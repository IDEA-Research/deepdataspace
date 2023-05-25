"""
deepdataspace.utils.os

Convenient functions about os.
"""

import errno
import getpass
import logging
import os
import platform
import socket
from subprocess import check_output
from typing import List
from typing import Union

import psutil

logger = logging.getLogger("dds.utils.os")
logger.setLevel(logging.INFO)


class Platforms:
    Mac = "mac"
    MacArm = "mac_arm"
    Win = "win"
    Linux = "linux"

    @staticmethod
    def is_mac():
        """
        A shortcut to test if current platform is Mac
        """
        return PLATFORM == Platforms.Mac

    @staticmethod
    def is_macarm():
        """
        A shortcut to test if current platform is Mac Arm
        """
        return PLATFORM == Platforms.MacArm

    @staticmethod
    def is_win():
        """
        A shortcut to test if current platform is Windows
        """
        return PLATFORM == Platforms.Win

    @staticmethod
    def is_linux():
        """
        A shortcut to test if current platform is Linux
        """
        return PLATFORM == Platforms.Linux


def get_platform() -> Union[None, str]:
    """
    Acquire current operation system platform.
    """

    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == "darwin":
        if machine == "arm64":
            return Platforms.MacArm
        else:
            return Platforms.Mac
    elif system == "windows":
        return Platforms.Win
    elif system == "linux":
        return Platforms.Linux
    else:
        return None


PLATFORM = get_platform()


def get_pid_by_pidfile(pidfile: str) -> int:
    """
    Read the pidfile and check the process status by pid in the file.

    :param pidfile: the pidfile path, which expected to have the process pid inside.
    :return: int, 0 if process is dead, or pid if process is alive.
    """

    if not os.path.exists(pidfile):
        return 0

    with open(pidfile, "r") as fp:
        pid = fp.read().strip()
        try:
            pid = int(pid)
        except ValueError as err:
            logger.info(f"invalid pid file, err={str(err)}")
            return 0

    if psutil.pid_exists(pid):
        return pid
    return 0


def get_os_username():
    """
    Get the username of current os, works for both windows and linux.
    """

    if PLATFORM == Platforms.Win:
        name = os.environ["USERNAME"]
        domain = os.environ["USERDOMAIN"]
        user = f"{domain}\\{name}"
    else:
        user = getpass.getuser()
    return user


def get_pid_by_cmd_id(cmd_id: str, all_user: bool = False) -> List[int]:
    """
    Found all processes whose command line arguments contain the cmd_id, and return their pid in a list.

    :param cmd_id: A command line string identifier, usually the command line args to start a process.
    :param all_user: Search for processes of all user.
                     Default value is False, which means only processes of current user will be found.
    :return: A list of matched process pid.
    """

    user = get_os_username()
    pids = []
    for process in psutil.process_iter():
        try:
            process_user = process.username()
            if all_user is False and process_user != user:
                continue

            cmd_args = process.cmdline()
            cmd_line = " ".join(cmd_args)
            if cmd_id in cmd_line:
                pids.append(process.pid)
        except (psutil.AccessDenied, psutil.NoSuchProcess) as err:
            pass

    return pids


def check_port_free(port: int) -> bool:
    """
    Check if the target port is free for use.
    """

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        s.bind(("localhost", port))
    except socket.error as err:
        if err.errno == errno.EADDRINUSE:
            logger.info(f"port {port} is in use")
        else:
            logger.info(f"failed to check port, err={err}")
        return False
    else:
        return True
    finally:
        s.close()


def find_free_port(beg_port: int, end_port: int) -> Union[int, None]:
    """
    Find a free port in specified port range.

    :param beg_port: the begen of port range, include itself.
    :param end_port: the end of port range, include itself.
    :return: the first free port in range, or None if no port is free.
    """

    for port in range(beg_port, end_port + 1, 1):
        if check_port_free(port):
            return port

    return None


def get_ubuntu_version():
    """
    Get the ubuntu release version number.
    :return: 1804, 2004, 2204, or "" if failed.
    """
    with open("/etc/lsb-release", "r") as fp:
        for line in fp:
            line = line.strip()
            if line.startswith("DISTRIB_RELEASE="):
                version = line.split("=", 1)[-1]
                version = str(int(float(version) * 100))
                return version
    return ""


def find_shared_lib_on_ubuntu(lib_name: str):
    """
    find the target shared lib file by name, for ubuntu system only.
    :params lib_name: the shared lib file name, libssl.so.1.1, libcrypto.so.1.1 etc.
    :return: lib path, /lib/x86_64-linux-gnu/libssl.so.1.1
    """

    lines = check_output("ldconfig -p", shell=True).decode().split("\n")
    for line in lines:
        line = line.strip()
        if line.startswith(lib_name):
            path = line.split(">", 1)[-1]
            path = path.strip()
            return path

    return ""


def find_shared_dirs_on_ubuntu():
    """
    find all directories where system search for dynamic libs, for ubuntu system only.
    """

    paths = set()
    lines = check_output("ldconfig -p", shell=True).decode().split("\n")
    for line in lines:
        line = line.strip()
        path = line.split(">", 1)[-1]
        path = path.strip()
        path = os.path.dirname(path)
        if os.path.exists(path):
            paths.add(path)

    paths = sorted(paths, key=len)
    return paths
