"""
deepdataspace.services.mongodb

The mongodb service manager.
"""

import os

import pymongo
from pymongo.errors import OperationFailure

from deepdataspace.services import config
from deepdataspace.services.config import print_if_verbose
from deepdataspace.services.service import Service
from deepdataspace.services.service import progress_log
from deepdataspace.utils.os import check_port_free
from deepdataspace.utils.os import find_free_port


class MongoDB(Service):
    def __init__(self):
        cmd_list = [
            config.MONGODB_BIN,
            "-f", config.MONGODB_CONF,
            "--dbpath", config.MONGODB_DBDIR,
            "--logpath", config.MONGODB_LOG,
            "--pidfilepath", config.MONGODB_PID
        ]
        super(MongoDB, self).__init__("mongodb", cmd_list)

        self.port = config.MONGODB_PORT
        self.cmd_id = cmd_list[0]

    def _test_mongodb_user(self):
        try:
            url = f"mongodb://{config.MONGODB_USER}:{config.MONGODB_PASS}"
            url = f"{url}@{config.MONGODB_HOST}:{config.MONGODB_PORT}/{config.MONGODB_DBNAME}"
            client = pymongo.MongoClient(url)
            db = client[config.MONGODB_DBNAME]
            db.list_collections()
        except Exception as err:
            if isinstance(err, OperationFailure) and err.code == 18:
                print_if_verbose(f"user authentication failed")
            else:
                print_if_verbose(f"cannot validate user and password, err={str(err)}")
            return False
        else:
            return True

    def _setup_mongodb_user(self):
        try:
            url = f"mongodb://{config.MONGODB_HOST}:{config.MONGODB_PORT}/{config.MONGODB_DBNAME}"
            client = pymongo.MongoClient(url)
            db = client[config.MONGODB_DBNAME]
            db.command("createUser", config.MONGODB_USER, pwd=config.MONGODB_PASS,
                       roles=[{"role": "readWrite", "db": config.MONGODB_DBNAME}])
        except OperationFailure as err:
            print(f"cannot setup mongodb user, err={err}")
            return
        else:
            print_if_verbose(f"setup mongodb user successfully.")

    def _start_mongodb(self, auth: bool = False):
        """
        Start the mongodb service, trying to bind a port from 9800 to 9899.
        """

        db_dir = f"{config.MONGODB_DBDIR}"
        os.makedirs(db_dir, exist_ok=True)

        cmd = [
            config.MONGODB_BIN,
            "-f", config.MONGODB_CONF,
            "--dbpath", config.MONGODB_DBDIR,
            "--logpath", config.MONGODB_LOG,
            "--pidfilepath", config.MONGODB_PID
        ]
        if auth is True:
            cmd.append("--auth")

        port_range = [self.port, self.port + 99]
        self.port = find_free_port(*port_range)
        while True:
            run_cmd = cmd[:]
            run_cmd.extend(["--nojournal", "--port", str(self.port)])
            try:
                self.start_process(run_cmd)
            except Exception as err:
                if check_port_free(self.port):
                    print(f"failed to start mongodb, err={str(err)}")
                    return False
                else:
                    self.port = find_free_port(port_range[0], port_range[1])
                    if self.port is None:
                        print(f"failed to start mongodb, no free port available in range {port_range}")
                        return False
            else:
                config.MONGODB_PORT = self.port
                config.log_and_save_env("DDS_MONGODB_PORT", self.port)
                break

        return True

    def start(self):
        if not self._start_mongodb(auth=True):
            return False

        if self._test_mongodb_user():  # user authentication failed, we have to config it now
            return True

        with progress_log(f"Setting up mongodb authentication"):
            if not self._start_mongodb():  # start in admin mode without auth
                return False

            if not self._setup_mongodb_user():  # config user and password in admin mode
                return False

            if not self._start_mongodb(auth=True):  # restart with auth to make user and password effect
                return False

        return True
