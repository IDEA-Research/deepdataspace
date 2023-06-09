"""
deepdataspace.services.service

Base class and common interfaces for all services.
"""

import contextlib
import os
import signal
import subprocess
import sys
import time
from threading import Thread

import psutil

from deepdataspace.services import config
from deepdataspace.utils.os import PLATFORM
from deepdataspace.utils.os import Platforms
from deepdataspace.utils.os import get_pid_by_cmd_id


def terminate_all_children(sig, frame):
    process = psutil.Process()
    for child in process.children(recursive=True):
        try:
            config.print_if_verbose(f"terminating process, pid={child.pid}, cmd_line={' '.join(child.cmdline())}")
            os.kill(child.pid, signal.SIGTERM)
        except:  # don't block program terminating in any way
            pass
    exit(0)


signal.signal(signal.SIGTERM, terminate_all_children)
signal.signal(signal.SIGINT, terminate_all_children)

_progress_logs = []


@contextlib.contextmanager
def progress_log(log_prefix: str):
    """
    Print a dynamic log message while we start services in the background.
    So users won't mistake that our process is dead.
    """
    _progress_logs.append(log_prefix)

    running = False

    def _threaded():
        idx = 0

        while running:
            if _progress_logs and idx % 10 == 0:
                _progress_logs[-1] += "."
                print(_progress_logs[-1], flush=True, end="\r")

            if config.VERBOSE_LOG:
                return
            idx += 1
            time.sleep(0.1)

    try:
        running = True
        print(_progress_logs[-1], flush=True, end="\r")

        thread = Thread(target=_threaded)
        thread.setDaemon(True)
        thread.start()
        yield
    finally:
        running = False
        clean_log = " " * len(_progress_logs.pop())
        print(clean_log, flush=True, end="\r")


class Service:
    def __init__(self, name: str, cmd_list: list):
        self.name = name
        self.cmd_list = cmd_list
        self.cmd_id = None
        self.pid = None
        self.started = False

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

    def clean_process(self, ):
        """
        Close all process identified by cmd_id
        """

        pids = get_pid_by_cmd_id(self.cmd_id)
        for pid in pids:
            config.print_if_verbose(f"{self.name} is already started, killing it now...")
            self.close_process(pid)

    def open_process(self, cmd: list, wait: int = 2):
        """
        Start a subprocess with cmd and argument.
        :param cmd: the cmd and arguments used to start the subprocess
        :param wait: num of seconds to wait after init the subprocess
        """

        if config.VERBOSE_LOG is True:
            stdout = sys.stdout
            stderr = sys.stderr
        else:
            stdout = subprocess.DEVNULL
            stderr = subprocess.DEVNULL

        if PLATFORM == Platforms.Win:
            p = subprocess.Popen(cmd, subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
                                 stdout=stdout, stderr=stderr)
        else:
            p = subprocess.Popen(cmd, preexec_fn=os.setpgrp, stdout=stdout, stderr=stderr)

        self.pid = p.pid
        time.sleep(wait)  # wait for a while, so if the process exit immediately, we have a chance to catch its status

    def check_process(self):
        """
        Check if the process identified by cmd_is is running.
        """
        pids = get_pid_by_cmd_id(self.cmd_id)
        if pids:
            config.print_if_verbose(f"{self.name} is started")
            self.pid = pids[0]
            self.started = True
        else:
            config.print_if_verbose(f"failed to start {self.name}")
            self.pid = None
            self.started = False

    def start_process(self, cmd_list: list, wait: int = 2):
        """
        Start a subprocess with the command line arguments.
        :param cmd_list: the command line arguments to start the process
        :param cmd_id: the command line identifier, this must be unique enough to identify the process from all processes
        :param wait: how many seconds to wait after the subprocess is called
        """

        config.print_if_verbose(f"trying to start {self.name} with command: {' '.join(cmd_list)}")

        self.clean_process()  # close started subprocess first
        self.open_process(cmd_list, wait)  # then open the process, ensure the process is started by us
        self.check_process()  # double-check the process status
