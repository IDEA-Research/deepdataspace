"""
deepdataspace.utils.network

Convenient functions about network.
"""

import os
import shutil
import socket

import requests

from deepdataspace.utils.string import gen_random_str


def get_output_ip_address() -> str:
    """
    Acquire the default output ip address of this machine.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(5)
    s.connect(("114.114.114.114", 80))
    ip = s.getsockname()[0]
    s.close()
    return ip


def download_by_requests(url: str, path: str, timeout: int = 5):
    """
    Download the specified url to the local path.

    :param url: the remote url to be downloaded
    :param path: the local path of download destination
    :param timeout: the timeout for download, in case of endless blocking

    This function downloads the url to a temporary path during the download procedure and
    move the temporary file to the destination path.
    This guarantees the integrity of the downloaded file.
    """
    rsp = requests.get(url, timeout=timeout)

    tmp_file = f"{path}.{gen_random_str(6)}"
    os.makedirs(os.path.dirname(tmp_file), exist_ok=True)
    with open(tmp_file, "wb") as fp:
        fp.write(rsp.content)
    shutil.move(tmp_file, path)
