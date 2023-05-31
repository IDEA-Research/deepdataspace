#! python
"""
deepdataspace.services.dds

The dds service manager.
This is the main entry point for dds, which controls all other services.
"""

import atexit
import getpass
import os
import stat
import time
import zipfile
from pathlib import Path
from threading import Thread

import psutil
import yaml

from deepdataspace.services import config
from deepdataspace.services.celery import Celery
from deepdataspace.services.config import generate_mongodb_conf
from deepdataspace.services.config import generate_redis_conf
from deepdataspace.services.config import read_mongodb_password
from deepdataspace.services.config import read_redis_password
from deepdataspace.services.config import setup_mongodb_password
from deepdataspace.services.config import setup_redis_password
from deepdataspace.services.django import Django
from deepdataspace.services.mongodb import MongoDB
from deepdataspace.services.redis import Redis
from deepdataspace.services.service import progress_log
from deepdataspace.services.sqlite import SQLite
from deepdataspace.utils.classes import SingletonMeta
from deepdataspace.utils.network import download_by_requests
from deepdataspace.utils.network import get_output_ip_address
from deepdataspace.utils.os import PLATFORM
from deepdataspace.utils.os import Platforms
from deepdataspace.utils.os import check_port_free
from deepdataspace.utils.os import find_shared_dirs_on_ubuntu
from deepdataspace.utils.os import get_ubuntu_version
from deepdataspace.utils.string import gen_random_str

if PLATFORM is None:
    raise OSError("unsupported platform, exiting now...")
IsWin = PLATFORM == Platforms.Win


class DDS(metaclass=SingletonMeta):
    def __init__(self,
                 data_dir: str = None,
                 quickstart: bool = None,
                 verbose: bool = None,
                 public: bool = None,
                 host: str = None,
                 port: int = None,
                 reload: bool = None,
                 configfile: str = None,
                 from_cmdline: bool = False):

        self.config_data = {}
        if configfile is not None:
            with open(configfile, "r") as fp:
                config_data = yaml.safe_load(fp)
                for key, val in config_data.items():
                    if val is not None:
                        self.config_data[key] = val

        self.data_dir = self.argument_or_config("data_dir", data_dir, None)
        self.quickstart = self.argument_or_config("quickstart", quickstart, False)
        self.verbose = self.argument_or_config("verbose", verbose, False)
        self.public = public or False
        if host is None and public:
            host = get_output_ip_address()
        self.host = self.argument_or_config("django_host", host, "127.0.0.1")
        self.port = int(self.argument_or_config("django_port", port, 8765))
        self.reload = self.argument_or_config("django_reload", reload, False)

        self.configfile = configfile
        self.from_cmdline = from_cmdline

        self.started = False

        self.db = None
        self.redis = None
        self.mongodb = None
        self.celery = None
        self.django = None

        self.running_pids = {}  # {name:pid}, all subprocess started, will be closed at exit

        self.dl_prefix = "https://deepdataspace.oss-accelerate.aliyuncs.com/install_files"
        self.distro = PLATFORM if PLATFORM != Platforms.Linux else f"ubuntu{get_ubuntu_version()}"

    def argument_or_config(self, key, value, default):
        if value is not None:
            return value
        else:
            return self.config_data.get(key, default)

    def exit_or_raise(self, msg: str):
        if self.from_cmdline is True:
            print(msg)
            exit(1)
        else:
            raise RuntimeError(msg)

    def prefight_checks(self):
        if self.quickstart is False:
            if self.data_dir is None:
                if self.from_cmdline:
                    msg = "Usage: dds.py [OPTIONS] DATA_DIR\nTry 'dds.py --help' for help.\n\nError: Missing argument 'DATA_DIR'."
                else:
                    msg = f"Argument data_dir is required, otherwise you must set 'quickstart' to True."
                self.exit_or_raise(msg)
            elif not os.path.exists(self.data_dir):
                msg = f"data dir[{self.data_dir}] not found, exiting now..."
                self.exit_or_raise(msg)

        if PLATFORM == Platforms.Win:
            if self.reload is True:
                msg = f"--reload flag is not compatible with Windows platform"
                self.exit_or_raise(msg)
        elif PLATFORM == Platforms.Linux:
            ubuntu_version = get_ubuntu_version()
            supported_versions = ["1804", "2004", "2204"]
            if ubuntu_version not in supported_versions:
                msg = f"ubuntu version[{ubuntu_version}] is not supported, supported versions are {supported_versions}"
                self.exit_or_raise(msg)

        if not check_port_free(self.port):
            msg = f"Port {self.port} is taken, please specify another port."
            self.exit_or_raise(msg)

    @staticmethod
    def init_samples():
        data_dir = f"{config.RUNTIME_DIR}/dataset-samples"
        if os.path.exists(data_dir) and os.listdir(data_dir):
            return data_dir

        os.makedirs(data_dir, exist_ok=True)
        sample_url = "https://deepdataspace.oss-cn-shenzhen.aliyuncs.com/install_files/datasets/dataset-samples.zip"
        sample_file = f"{config.RUNTIME_DIR}/dataset-samples.zip"
        with progress_log(f"Downloading sample datasets"):
            download_by_requests(sample_url, sample_file)

        with zipfile.ZipFile(sample_file, "r") as fp:
            fp.extractall(f"{config.RUNTIME_DIR}/")
        os.remove(sample_file)

        return data_dir

    def _init_shared_files_and_dirs(self):
        # init shared files and directories
        home_dir = str(Path(os.path.expanduser("~")))

        config.RUNTIME_DIR = self.config_data.get("runtime_dir", str(Path(home_dir, ".deepdataspace")))
        config.RUNTIME_DIR = os.path.expanduser(config.RUNTIME_DIR)
        config.RUNTIME_DIR = os.path.expandvars(config.RUNTIME_DIR)
        os.makedirs(config.RUNTIME_DIR, exist_ok=True)

        if self.quickstart is True:
            self.data_dir = self.init_samples()
        config.DATA_DIR = self.data_dir

        config.VERBOSE_LOG = self.verbose
        config.SHARED_LIB_DIR = str(Path(config.RUNTIME_DIR, "lib"))
        config.SHARED_SSL_LIB = str(Path(config.SHARED_LIB_DIR, "libssl.so.1.1"))
        config.SHARED_CRYPTO_LIB = str(Path(config.SHARED_LIB_DIR, "libcrypto.so.1.1"))
        config.SHARED_CURL_LIB = str(Path(config.SHARED_LIB_DIR, "libcurl.so.4"))

        os.makedirs(config.SHARED_LIB_DIR, exist_ok=True)
        if PLATFORM != Platforms.Linux:
            return

    def _init_database_config(self):
        # init database config
        config.DB_ENGIN = self.config_data.get("db_engin", "sqlite3")
        config.DB_HOST = self.config_data.get("db_host", "127.0.0.1")
        config.DB_PORT = self.config_data.get("db_port", 3306)
        config.DB_NAME = self.config_data.get("db_name", "deepdataspace")
        config.DB_USER = self.config_data.get("db_user", "dds")
        config.DB_PASS = self.config_data.get("db_pass", "dds")

    def _init_redis_config(self):
        # init redis config
        config.REDIS_HOST = self.config_data.get("redis_host", "127.0.0.1")
        config.REDIS_PORT = self.config_data.get("redis_port", 9900)
        config.REDIS_PASS = self.config_data.get("redis_pass", "")
        config.REDIS_DBNAME = self.config_data.get("redis_dbname", 0)

        config.REDIS_DIR = str(Path(config.RUNTIME_DIR, "redis"))  # the dir holds all files of redis
        os.makedirs(config.REDIS_DIR, exist_ok=True)

        config.REDIS_BIN = str(Path(config.REDIS_DIR, "bin"))
        config.REDIS_BIN = str(Path(config.REDIS_BIN, "redis-server.exe" if IsWin else "redis-server"))
        config.REDIS_CONF = str(Path(config.REDIS_DIR, "redis.conf"))
        config.REDIS_LOG = str(Path(config.REDIS_DIR, "redis.log"))
        config.REDIS_PID = str(Path(config.REDIS_DIR, "redis.pid"))

        config.REDIS_SELF_HOSTED = not bool(self.config_data.get("redis_host", None))
        if config.REDIS_SELF_HOSTED:
            if not os.path.exists(config.REDIS_BIN):
                with progress_log(f"Installing redis to {config.REDIS_DIR}"):
                    if PLATFORM == Platforms.Win:
                        url = f"{self.dl_prefix}/redis/{self.distro}/redis-server.exe"
                        download_by_requests(url, config.REDIS_BIN)
                        url = f"{self.dl_prefix}/redis/{self.distro}/cygwin1.dll"
                        download_by_requests(url, f"{config.REDIS_DIR}/bin/cygwin1.dll")
                    else:
                        url = f"{self.dl_prefix}/redis/{self.distro}/redis-server"
                        download_by_requests(url, config.REDIS_BIN)

            if not os.path.exists(config.REDIS_CONF):
                generate_redis_conf(config.REDIS_CONF)
                setup_redis_password(config.REDIS_CONF)

            st = os.stat(config.REDIS_BIN)
            os.chmod(config.REDIS_BIN, st.st_mode | stat.S_IEXEC)

            config.REDIS_PASS = read_redis_password(config.REDIS_CONF)

    def _init_mongodb_config(self):
        # init mongodb config
        config.MONGODB_HOST = self.config_data.get("mongodb_host", "127.0.0.1")
        config.MONGODB_PORT = self.config_data.get("mongodb_port", 9800)
        config.MONGODB_USER = self.config_data.get("mongodb_user", getpass.getuser())
        config.MONGODB_PASS = self.config_data.get("mongodb_pass", "")
        config.MONGODB_DBNAME = self.config_data.get("mongodb_dbname", "dds")

        config.MONGODB_DIR = str(Path(config.RUNTIME_DIR, "mongodb"))
        os.makedirs(config.MONGODB_DIR, exist_ok=True)

        config.MONGODB_BIN = str(Path(config.MONGODB_DIR, "bin"))
        config.MONGODB_BIN = str(Path(config.MONGODB_BIN, "mongod.exe" if IsWin else "mongod"))
        config.MONGODB_CONF = str(Path(config.MONGODB_DIR, "mongo.conf.yaml"))
        config.MONGODB_LOG = str(Path(config.MONGODB_DIR, "mongo.log"))
        config.MONGODB_PID = str(Path(config.MONGODB_DIR, "mongo.pid"))
        config.MONGODB_DBDIR = str(Path(config.MONGODB_DIR, "db"))

        # install mongodb
        config.MONGODB_SELF_HOSTED = not bool(self.config_data.get("mongodb_host", None))
        if config.MONGODB_SELF_HOSTED:
            if not os.path.exists(config.MONGODB_BIN):
                with progress_log(f"Installing mongodb to {config.MONGODB_DIR}"):
                    url = f"{self.dl_prefix}/mongodb/{self.distro}/mongod"
                    url += ".exe" if PLATFORM == Platforms.Win else ""
                    download_by_requests(url, config.MONGODB_BIN)

            if not os.path.exists(config.MONGODB_CONF):
                generate_mongodb_conf(config.MONGODB_CONF)
                setup_mongodb_password(config.MONGODB_CONF)

            st = os.stat(config.MONGODB_BIN)
            os.chmod(config.MONGODB_BIN, st.st_mode | stat.S_IEXEC)

            config.MONGODB_PASS = read_mongodb_password(config.MONGODB_CONF)

    def _init_django_config(self):
        # init django config
        config.DJANGO_HOST = self.host
        config.DJANGO_PORT = self.port
        config.DJANGO_RELOAD = self.reload

        config.DJANGO_DIR = str(Path(config.RUNTIME_DIR, "django"))
        os.makedirs(config.DJANGO_DIR, exist_ok=True)

        config.DJANGO_LOG = str(Path(config.DJANGO_DIR, "django.log"))
        config.DJANGO_KEY_FILE = str(Path(config.DJANGO_DIR, "secret.txt"))
        config.DJANGO_SETTINGS_MODULE = "deepdataspace.server.settings"

        django_secret = self.config_data.get("django_secret", None)
        if not django_secret:
            if os.path.exists(config.DJANGO_KEY_FILE):
                with open(config.DJANGO_KEY_FILE, "r") as fp:
                    django_secret = fp.read().strip()
            else:
                django_secret = gen_random_str(32)
        with open(config.DJANGO_KEY_FILE, "w") as fp:
            fp.write(django_secret)
        config.DJANGO_KEY = django_secret

    def _init_celery(self):
        # init celery config
        config.CELERY_DIR = str(Path(config.RUNTIME_DIR, "celery"))
        os.makedirs(config.CELERY_DIR, exist_ok=True)

        config.CELERY_LOG = str(Path(config.CELERY_DIR, "celery.log"))
        config.CELERY_WORKER_POOL = self.config_data.get("celery_worker_pool", "solo")

        # log_and_save_env("DDS_CELERY_WORKERPOOL", config.CELERY_WORKER_POOL)

    def _init_shared_libs(self):
        # install shared lib for redis and mongodb for linux only
        if PLATFORM != Platforms.Linux:
            return

        if not os.path.exists(config.SHARED_SSL_LIB):
            url = f"{self.dl_prefix}/lib/libssl.so.1.1"
            download_by_requests(url, config.SHARED_SSL_LIB)

        if not os.path.exists(config.SHARED_CRYPTO_LIB):
            url = f"{self.dl_prefix}/lib/libcrypto.so.1.1"
            download_by_requests(url, config.SHARED_CRYPTO_LIB)

        if not os.path.exists(config.SHARED_CURL_LIB):
            url = f"{self.dl_prefix}/lib/libcurl.so.4.8.0"
            download_by_requests(url, config.SHARED_CURL_LIB)

        if config.LD_LIBRARY_PATH is None:
            config.LD_LIBRARY_PATH = config.SHARED_LIB_DIR
        elif config.SHARED_LIB_DIR is not None and config.LD_LIBRARY_PATH != config.SHARED_LIB_DIR:
            config.LD_LIBRARY_PATH = f"{config.SHARED_LIB_DIR}:{config.LD_LIBRARY_PATH}"

        ld_path = os.environ.get("LD_LIBRARY_PATH", None)
        if ld_path is not None:
            config.LD_LIBRARY_PATH = f"{ld_path}:{config.LD_LIBRARY_PATH}"

        current_lib_paths = find_shared_dirs_on_ubuntu()
        current_lib_paths = ":".join(current_lib_paths)
        if current_lib_paths:
            config.LD_LIBRARY_PATH = f"{current_lib_paths}:{config.LD_LIBRARY_PATH}"

        os.environ["LD_LIBRARY_PATH"] = config.LD_LIBRARY_PATH

    def _init_sentry(self):
        config.SENTRY_DSN = self.config_data.get("sentry_dsn", None)

    def init_envs(self):
        """
        Init all global environments.
        These environments will be read by subprocesses, especially celery and django.
        """

        # this is a new start, so remove the old env config
        if config.ENV_FILE and os.path.exists(config.ENV_FILE):
            os.remove(config.ENV_FILE)

        self._init_shared_files_and_dirs()
        self._init_database_config()
        self._init_redis_config()
        self._init_mongodb_config()
        self._init_django_config()
        self._init_celery()
        self._init_shared_libs()
        self._init_sentry()

        config.save_all_env()

    def init(self):
        """
        Make preparations before start the services.
        """
        self.init_envs()

    def start_db(self):
        self.db = SQLite()
        self.db.start()
        return self.db

    def start_redis(self):
        self.redis = Redis()
        self.redis.start()
        return self.redis

    def start_mongodb(self):
        self.mongodb = MongoDB()
        self.mongodb.start()
        return self.mongodb

    def start_celery(self):
        self.celery = Celery()
        self.celery.start()
        return self.celery

    def start_django(self):
        self.django = Django()
        self.django.start()
        return self.django

    @staticmethod
    def close_process(pid: int):
        """
        Close a process by pid.
        Try p.terminate first, then p.kill if it survives more than 1 second.
        """
        if not psutil.pid_exists(pid):
            return

        p = psutil.Process(pid)
        p.terminate()

        time.sleep(0.4)
        if p.is_running():
            time.sleep(0.6)
            try:
                p.kill()
            except psutil.NoSuchProcess:
                pass

    def close_all_started(self):
        """
        Close all started subprocesses.
        """
        threads = [Thread(target=self.close_process, args=(pid,)) for pid in self.running_pids.values()]
        [t.start() for t in threads]
        [t.join() for t in threads]
        self.running_pids = {}

    def start_all(self):
        """
        Start all services.
        """
        atexit.register(self.close_all_started)

        # order matters, don't change it
        starters = []
        if config.REDIS_SELF_HOSTED:
            starters.append(self.start_redis)
        if config.MONGODB_SELF_HOSTED:
            starters.append(self.start_mongodb)
        starters.extend([self.start_celery, self.start_django])

        for starter in starters:
            service = starter()
            if not service.started:
                return False
            self.running_pids[service.name] = service.pid

        return True

    def greeting(self):
        """
        Print startup messages to the console.
        """
        host = os.environ["DDS_DJANGO_HOST"]
        port = os.environ["DDS_DJANGO_PORT"]
        if self.started is True:
            print(f"DDS[{os.getpid()}] is already started at http://{host}:{port}.")
        else:
            print(f"Started DDS[{os.getpid()}] at http://{host}:{port}.")

        print(f"The DDS tool is importing datasets inside dir in the background: {os.path.abspath(config.DATA_DIR)}.")
        print(f"Explore other useful commands by: ddsop --help.")

        if self.from_cmdline is True:
            print(f"You can quit the DDS tool with Ctrl+C.\n")

    @staticmethod
    def loop():
        """
        Block the main process.
        Don't use os.waitpid, it is not Windows compatible.
        """
        while True:
            time.sleep(60)

    def start(self):
        if self.started:
            print(f"DDS is already started.")
            self.greeting()
            return

        self.prefight_checks()

        with progress_log("Starting DeepDataSpace(DDS)"):
            self.init()
            self.start_all()
            self.greeting()

        self.started = True
        if self.from_cmdline:
            self.loop()

    def stop(self):
        if not self.started:
            return

        self.close_all_started()
        self.started = False
