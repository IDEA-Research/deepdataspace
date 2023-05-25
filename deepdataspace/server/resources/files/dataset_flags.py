"""
deepdataspace.server.resources.files.dataset_flags

This file add API to generate and return the flag file of a dataset.
"""

import json
import tempfile

from django.http.response import FileResponse
from django.http.response import Http404

from deepdataspace.model import DataSet
from deepdataspace.model.image import Image


def dataset_flags(request, dataset_id):
    """
    Generate and return the flag file of the dataset.
    """

    dataset = DataSet.find_one({"id": dataset_id})
    if dataset is None:
        raise Http404()

    file_lines = []  # val.tsv	{"time": 1664188933, "id": 0, "flag": 2}
    images = Image(dataset_id).find_many({}, sort=[("_id", 1)], to_dict=True)
    for image in images:
        flag_meta = {"time": image["flag_ts"], "id": image["id"], "flag": image["flag"]}
        line = f"{dataset.name}\t{json.dumps(flag_meta)}"
        file_lines.append(line)

    file_str = "\n".join(file_lines)
    tmp_file = tempfile.NamedTemporaryFile()
    tmp_file.name = f"{dataset.name}.flag.tsv"
    if dataset.group_name:
        tmp_file.name = f"{dataset.group_name}.{tmp_file.name}"
    tmp_file.write(file_str.encode("utf-8"))
    tmp_file.seek(0)

    response = FileResponse(tmp_file)
    response["Content-Type"] = "application/octet-stream"
    response["Content-Disposition"] = f'attachment;filename="{tmp_file.name}"'

    return response
