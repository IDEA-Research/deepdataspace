"""
deepdataspace.services.config

This file defines global config variables shared by all services.
"""

import os
from pathlib import Path

import requests

from deepdataspace.utils.function import retry
from deepdataspace.utils.os import PLATFORM
from deepdataspace.utils.os import Platforms
from deepdataspace.utils.string import gen_random_str

if PLATFORM is None:
    raise OSError("unsupported platform, exiting now...")
IsWin = PLATFORM == Platforms.Win

# the global project confs
HOME_DIR = str(Path(os.path.expanduser("~")))
RUNTIME_DIR = os.environ.get("DDS_RUNTIME_DIR", os.path.join(HOME_DIR, ".deepdataspace"))  # the dir holds all files
ENV_FILE = os.path.join(HOME_DIR, ".config", "dds", ".dds.env")  # the environments file
os.makedirs(os.path.dirname(ENV_FILE), exist_ok=True)
SHARED_LIB_DIR = None
SHARED_SSL_LIB = None
SHARED_CRYPTO_LIB = None
SHARED_CURL_LIB = None
CUR_DIR = os.path.dirname(os.path.abspath(__file__))

# the database relevant
DB_ENGIN = None  # for sqlite, settings like host and user are not important
DB_HOST = None
DB_PORT = None
DB_NAME = None
DB_USER = None
DB_PASS = None

# the redis relevant
REDIS_HOST = None
REDIS_PORT = None
REDIS_PASS = None
REDIS_DBNAME = None
REDIS_SELF_HOSTED = None
# local files of redis, this is only useful if no redis server config is provided
REDIS_DIR = None
REDIS_BIN = None
REDIS_CONF = None
REDIS_LOG = None
REDIS_PID = None

# the mongodb relevant
MONGODB_HOST = None
MONGODB_PORT = None
MONGODB_USER = None
MONGODB_PASS = None
MONGODB_DBNAME = None
MONGODB_SELF_HOSTED = None
# local files of mongodb, this is only useful if no mongodb server config is provided
MONGODB_DIR = None
MONGODB_BIN = None
MONGODB_CONF = None
MONGODB_LOG = None
MONGODB_PID = None
MONGODB_DBDIR = None

# the django relevant
DJANGO_HOST = None
DJANGO_PORT = None
DJANGO_DIR = None  # the dir holds all files of django
DJANGO_LOG = None
DJANGO_KEY = None
DJANGO_KEY_FILE = None
DJANGO_RELOAD = None
DJANGO_SETTINGS_MODULE = "deepdataspace.server.settings"

# the celery relevant
CELERY_DIR = None  # the dir holds all files of celery
CELERY_LOG = None
CELERY_WORKER_POOL = None

# the sentry relevant
SENTRY_DSN = None

# other global variables parsed from command arguments
DATA_DIR = ""
VERBOSE_LOG = False
LD_LIBRARY_PATH = os.environ.get("LD_LIBRARY_PATH", None)


def log_and_save_env(name: str, value):
    """
    Save an export statement to the env file, and log it to the console.
    The saved statements will be loaded by ddsop command.
    """

    if value is False:
        return

    os.environ[name] = str(value)
    export = f"export {name}={str(value)}"
    with open(ENV_FILE, "a", encoding="utf8") as fp:
        fp.write(f"{export}\n")
        fp.flush()

    if VERBOSE_LOG is True:
        print_if_verbose(export)


_env_checked = False


def _check_api_health(environs):
    if "DDS_DJANGO_HOST" in environs and "DDS_DJANGO_PORT" in environs:
        django_host = f"http://{environs['DDS_DJANGO_HOST']}:{environs['DDS_DJANGO_PORT']}"
        ping_api = f"{django_host}/api/v1/ping"
        rsp = requests.get(ping_api, timeout=1)
        data = rsp.json()

        assert rsp.status_code == 200
        assert data["code"] == 0
    else:
        raise Exception("failed to check api health")


def _check_env(environs: dict):
    global _env_checked

    if _env_checked:
        return True

    try:
        _check_api_health(environs)
    except Exception:
        return False
    else:
        return True


def load_all_env():
    """
    Load environment variables from the env file.
    The env file is generated by dds command.
    """
    if not ENV_FILE:
        return False

    if not os.path.exists(ENV_FILE):
        return False

    environs = {}
    with open(ENV_FILE, "r", encoding="utf8") as fp:
        for line in fp:
            line = line.split(" ", 1)[-1].strip()
            name, value = line.split("=", 1)
            environs[name] = value

            name = name.replace("DDS_", "", 1)
            value = True if value == "True" else value
            if name.endswith("_PORT"):
                value = int(value)
            globals()[name] = value

    if _check_env(environs):
        os.environ.update(environs)
        return True
    return False


def save_all_env():
    for name, value in globals().items():
        if name.startswith("_"):
            continue

        if name.upper() != name:
            continue

        # these environments do not need to be saved
        if name in {"RUNTIME_DIR", "ENV_FILE"}:
            continue

        if value is None:
            continue

        # these environments have to be the same name to be effective
        if name not in {"LD_LIBRARY_PATH", "DJANGO_SETTINGS_MODULE"}:
            name = f"DDS_{name}"

        value = "True" if value is True else value
        log_and_save_env(name, value)


def print_if_verbose(*args, **kwargs):
    """
    Only print message when VERBOSE_LOG is On.
    """
    if VERBOSE_LOG is False:
        return
    print(*args, **kwargs)


def generate_redis_conf(config_path: str):
    tmpl = """
daemonize no
loglevel notice
save 10 1
appendonly yes
appendfilename "redis.aof"
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
# requirepass 'generated-on-first-start'
"""
    with open(config_path, "w", encoding="utf8") as fp:
        fp.write(tmpl)


def setup_redis_password(config_path: str):
    """
    Generate a random password in the redis config file
    """

    password = gen_random_str(10)

    lines = []
    with open(config_path, "r", encoding="utf8") as fp:
        for line in fp:
            if line.startswith("# requirepass "):
                line = f"requirepass {password}"
            line = line.rstrip("\n")
            lines.append(line)

    with open(config_path, "w", encoding="utf8") as fp:
        fp.write("\n".join(lines))

    return password


def read_redis_password(config_path: str):
    """
    Read redis password from config file.
    """

    with open(config_path, "r", encoding="utf8") as fp:
        for line in fp:
            if line.startswith("requirepass "):
                password = line.split(" ", 1)[-1]
                return password

    raise RuntimeError(f"No password is found in config file: {config_path}")


def generate_mongodb_conf(config_path: str):
    tmpl = """
processManagement:
   fork: false
storage:
   directoryPerDB: true
net:
   unixDomainSocket:
      enabled: false
# password 'generated-on-first-start'
"""
    if PLATFORM == Platforms.Win:
        tmpl = """
storage:
   directoryPerDB: true
# password 'generated-on-first-start'
"""
    with open(config_path, "w", encoding="utf8") as fp:
        fp.write(tmpl)


def setup_mongodb_password(config_path: str):
    """
    Generate a random password for mongodb.
    It's not directly used by mongodb server, but read by dds tool to set up the server.
    """

    password = gen_random_str(10)

    lines = []
    with open(config_path, "r", encoding="utf8") as fp:
        for line in fp:
            if line.startswith("# password "):
                line = f"# password {password}"
            line = line.rstrip("\n")
            lines.append(line)

    with open(config_path, "w", encoding="utf8") as fp:
        fp.write("\n".join(lines))

    return password


def read_mongodb_password(config_path: str):
    """
    Read mongodb password from config file.
    """

    with open(config_path, "r", encoding="utf8") as fp:
        for line in fp:
            if line.startswith("# password "):
                password = line.split(" ", 2)[-1]
                return password

    raise RuntimeError(f"No password is found in config file: {config_path}")
