"""
deepdataspace.services.celery

The celery service manager.
"""

import os
import sys
from pathlib import Path

from deepdataspace.services import config
from deepdataspace.services.service import Service


class Celery(Service):
    def __init__(self):
        python_path = sys.executable
        python_path = str(Path(os.path.abspath(python_path)))
        cmd_list = [
            python_path,
            "-m", "celery",
            "-A", f"deepdataspace.task:app",
            "worker",
            "-l", "info",
            "-c", "1",
            f"--logfile={config.CELERY_LOG}",
        ]
        super(Celery, self).__init__("celery", cmd_list)

        self.cmd_id = " ".join(cmd_list)

    def start(self):
        try:
            self.start_process(self.cmd_list)
        except Exception as err:
            print(f"failed to start celery, err={err}")
            return False
        else:
            return True
