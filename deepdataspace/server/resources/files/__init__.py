"""
deepdataspace.server.resources.files

Fake static file urls.
Actually the file is dynamically generated according to the request.
"""

from django.urls import path

from deepdataspace.server.resources.files.local_file import read_file
from deepdataspace.server.resources.files.dataset_flags import dataset_flags

urls = [
    path("local_files/<read_mode>/<content_encode>/<position>/<mime_type>/<path:local_path>", read_file),
    path("dataset_flags/<dataset_id>.tsv", dataset_flags),
]
