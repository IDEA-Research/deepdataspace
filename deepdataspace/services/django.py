"""
deepdataspace.services.django

The django service manager.
"""

import os
import shutil
import sys
from pathlib import Path
from subprocess import check_call

from deepdataspace.services import config
from deepdataspace.services.service import Service
from deepdataspace.utils.os import check_port_free


class Django(Service):
    def __init__(self):
        python_path = sys.executable
        python_path = str(Path(os.path.abspath(python_path)))

        django_path = shutil.which("django-admin")

        cmd_list = [
            python_path,
            django_path,
            "runserver", f"{config.DJANGO_HOST}:{config.DJANGO_PORT}",
            "--no-color",
            "--pythonpath", ".",
            "--settings", config.DJANGO_SETTINGS_MODULE
        ]
        if config.DJANGO_RELOAD is False:
            cmd_list.append("--noreload")

        super(Django, self).__init__("django", cmd_list)

        self.python_path = python_path
        self.django_path = django_path
        self.cmd_id = " ".join(cmd_list[1:-1])

    def migrate_db(self):
        cmd = [
            self.python_path,
            self.django_path,
            "migrate",
            "--no-color",
            "--pythonpath", ".",
            "--settings", config.DJANGO_SETTINGS_MODULE
        ]
        check_call(cmd)

    def start(self):
        try:
            self.start_process(self.cmd_list)
        except Exception as err:
            if check_port_free(config.DJANGO_PORT):
                print(f"Failed to start django, err={err}")
            else:
                print(f"Failed to start django, port[{config.DJANGO_PORT}] is in use.")
            return False
        else:
            return True
