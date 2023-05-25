"""
deepdataspace.services.redis

The redis service manager.
"""

from deepdataspace.services import config
from deepdataspace.services.service import Service
from deepdataspace.utils.file import switch_dir_to_and_back
from deepdataspace.utils.os import check_port_free
from deepdataspace.utils.os import find_free_port


class Redis(Service):
    def __init__(self):
        cmd_list = [
            config.REDIS_BIN, "redis.conf",  # use relative path for windows compatibility
            "--dir", config.REDIS_DIR,
            "--logfile", config.REDIS_LOG,
            "--pidfile", config.REDIS_PID
        ]
        super(Redis, self).__init__("redis", cmd_list)

        self.port = config.REDIS_PORT
        self.cmd_id = cmd_list[0]

    def start(self):
        with switch_dir_to_and_back(config.REDIS_DIR):
            port_range = [self.port, self.port + 99]
            self.port = find_free_port(*port_range)
            while True:
                run_cmd = self.cmd_list[:]
                run_cmd.extend(["--port", str(self.port)])
                try:
                    self.start_process(run_cmd)
                except Exception as err:
                    if check_port_free(self.port):
                        print(f"failed to start redis, err={str(err)}")
                        return False
                    else:
                        self.port = find_free_port(port_range[0], port_range[1])
                        if self.port is None:
                            print(f"failed to start redis, no free port available in range {port_range}")
                            return False
                else:
                    config.log_and_save_env("DDS_REDIS_PORT", self.port)
                    config.REDIS_PORT = self.port
                    break

        return True
