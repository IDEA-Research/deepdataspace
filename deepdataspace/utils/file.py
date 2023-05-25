"""
deepdataspace.utils.file

Convenient functions about file system.
"""

import os
from contextlib import contextmanager
from mimetypes import guess_type
from typing import Literal

from deepdataspace.constants import ContentEncoding
from deepdataspace.constants import FileReadMode
from deepdataspace.utils.os import PLATFORM
from deepdataspace.utils.os import Platforms


@contextmanager
def file_lock_context(lock_file: str) -> bool:
    """
    Acquire a lock identified by file path.
    If the file path already exists, return False.
    If the file path does not exist, create it and return True, and ensure the file is removed on lock releasing.

    :param lock_file: A file path represents the lock.

    Example:
        with file_lock_context("/tmp/abc.lock") as ok:
            if ok:
                do_some_thing()
            else:
                print("failed to acquire a lock")

    """
    created = False
    try:
        if os.path.exists(lock_file):
            yield None
        else:
            open(lock_file, "w").close()
            created = True
            yield lock_file
    finally:
        if created:
            os.remove(lock_file)


def tailf(file_path: str):
    """
    Run a cross-platform 'tail -f' command
    """
    if not os.path.exists(file_path):
        print(f"cannot tailf file, no such file exits: {file_path}\n")
        return
    if os.path.isdir(file_path):
        print(f"cannot tailf file, this is a directory: {file_path}\n")
        return

    if PLATFORM == Platforms.Win:
        os.system(f"Get-Content {file_path} -Wait")
    else:
        os.system(f"tail -f {file_path}")


@contextmanager
def switch_dir_to_and_back(target_dir: str):
    """
    Change to target directory, execute code blocks,
    and go back to current directory even there is exception in code blocks.
    """
    cur_dir = os.getcwd()
    try:
        os.chdir(target_dir)
        yield
    finally:
        os.chdir(cur_dir)


def create_file_url(file_path: str,
                    file_encoding: Literal["1", "2"] = ContentEncoding.Plain,
                    read_mode: Literal["t", "b"] = FileReadMode.Text,
                    file_mime: str = None,
                    url_prefix=None
                    ) -> str:
    """
    Given the required file info, return a file url to serve the whole file from local disk.

    :param file_path: the path of the file.
    :param file_encoding: the encoding of the file, "1" = "plain" or "2" = "base64".
                          for "plain" encoded file, contents will be read as is.
                          for "base64" encoded file, contents will be read as base64 encoded string,
                          and will be decoded accordingly.
    :param read_mode: the read mode of the file, "t" or "b".
    :param file_mime: the file mime type, e.g. "image/png". This is used to set the response content type.
    :param url_prefix: the file url path prefix.
                       If not provided, will use "/files/local_files/{file_id}/{file_name}".
                       If provided, will use the format: f"{url_prefix}/{file_id}/{file_name}".
    """

    position = "-1_-1"
    mime = file_mime or guess_type(file_path)[0]
    mime = mime.replace("/", "_")
    local_path = os.path.abspath(file_path)
    url_prefix = url_prefix or "/files/local_files"
    return f"{url_prefix}/{read_mode}/{file_encoding}/{position}/{mime}/{local_path}"


def create_file_range_url(file_path: str,
                          beg_pos: int,
                          end_pos: int,
                          file_encoding: Literal["1", "2"] = ContentEncoding.Plain,
                          read_mode: Literal["t", "b"] = FileReadMode.Text,
                          file_mime: str = None,
                          url_prefix: str = None,
                          ) -> str:
    """
    Serve the file from local disk with range.
    This is similar to serve_whole_file, but it will serve the file with range.

    :param file_path: the path of the file.
    :param file_encoding: the encoding of the file, "1" = "plain" or "2" = "base64".
        for "plain" encoded file, contents will be read as is.
        for "base64" encoded file, contents will be read as base64 encoded string, and will be decoded accordingly.
    :param read_mode: the read mode of the file, "t" or "b".
    :param file_mime: the file mime type, e.g. "image/png". This is used to set the response content type.
    :param beg_pos: the beginning position of the file.
    :param end_pos: the end position of the file.
    :param url_prefix: the file url path prefix.
        If not provided, will use "/files/local_files/{file_id}/{file_name}".
        If provided, will use the format: f"{url_prefix}/{file_id}/{file_name}".
    """

    position = f"{beg_pos}_{end_pos}"
    mime = file_mime or guess_type(file_path)[0]
    mime = mime.replace("/", "_")
    local_path = os.path.abspath(file_path)
    url_prefix = url_prefix or "/files/local_files"
    return f"{url_prefix}/{read_mode}/{file_encoding}/{position}/{mime}/{local_path}"
