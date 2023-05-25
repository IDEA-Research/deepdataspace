"""
deepdataspace.server.resources.files.local_file

This file add APIs to read local files or file byte ranges.
"""

import base64
import os.path

from django.http.response import FileResponse
from django.http.response import Http404
from django.http.response import HttpResponse

from deepdataspace.constants import ContentEncoding
from deepdataspace.constants import FileReadMode


def decode_file(content, encoding):
    if encoding == ContentEncoding.Plain:
        return HttpResponse(content)
    elif encoding == ContentEncoding.Base64:
        image_bytes = base64.b64decode(content)
        response = HttpResponse(image_bytes)
        return response
    else:
        raise ValueError(f"Unknown encoding: {encoding}")


def _read_file(local_path, read_mode, beg, end, content_encode, mime_type):
    """
    Read the part of file and return it as a http response.
    """
    read_mode = "rt" if read_mode == FileReadMode.Text else "rb"
    with open(local_path, read_mode) as fp:
        if beg is not None and end is not None:
            fp.seek(beg)
            content = fp.read(end - beg)
        else:
            content = fp.read()
        response = decode_file(content, content_encode)
        response["Content-Type"] = mime_type
        return response


def read_file(request, read_mode, content_encode, position, mime_type, local_path):
    """
    Read and decode a local file and return the data in http response.
    """

    if not os.path.exists(local_path) or os.path.isdir(local_path):
        raise Http404()

    if read_mode not in FileReadMode.ALL_:
        raise Http404()

    if content_encode not in ContentEncoding.ALL_:
        raise Http404()

    beg, end = position.split("_")
    try:
        beg = int(beg)
        end = int(end)
    except ValueError:
        raise Http404()

    beg = None if beg == -1 else beg
    end = None if end == -1 else end
    mime_type = mime_type.replace("_", "/")

    # the most simple case, just return the file
    if (beg is None or end is None) and content_encode == ContentEncoding.Plain:
        response = FileResponse(open(local_path, "rb"))
        response["Content-Type"] = mime_type
        return response

    # the complicated cases involving file partial reading or decoding
    return _read_file(local_path, read_mode, beg, end, content_encode, mime_type)
