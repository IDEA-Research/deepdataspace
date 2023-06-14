"""
deepdataspace.server.resources.api_v1.datasets

The dataset RESTful APIs.
"""

import importlib
import logging

from deepdataspace.constants import LabelType
from deepdataspace.model import Category
from deepdataspace.model import DataSet
from deepdataspace.model import Label
from deepdataspace.server.resources.common import Argument
from deepdataspace.server.resources.common import BaseAPIView
from deepdataspace.server.resources.common import format_response
from deepdataspace.server.resources.common import parse_arguments
from deepdataspace.server.resources.common import raise_exception

logger = logging.getLogger("django")


class DatasetsView(BaseAPIView):
    """
    - GET /api/v1/datasets
    """

    get_args = [
        Argument("page_num", Argument.PositiveInt, Argument.QUERY, default=1),
        Argument("page_size", Argument.PositiveInt, Argument.QUERY, default=100)
    ]

    def get(self, request):
        """
        Get all datasets.
        - GET /api/v1/datasets
        """

        page_num, page_size = parse_arguments(request, self.get_args)
        total = DataSet.count_num({})

        dataset_list = []
        offset = max(0, page_size * (page_num - 1))
        if offset <= total:
            for dataset in DataSet.find_many({}, skip=offset, size=page_size):
                description = dataset.eval_description()
                dataset = dataset.to_dict(exclude=["description_func"])
                dataset["description"] = description or dataset["path"]
                dataset_list.append(dataset)

        data = {
            "dataset_list": dataset_list,
            "page_size"   : page_size,
            "page_num"    : page_num,
            "total"       : total
        }
        return format_response(data)


class DatasetView(BaseAPIView):
    """
    - GET /api/v1/datasets/<dataset_id>
    """

    def get(self, request, dataset_id: str):
        """
        Get detail of a dataset.
        - GET /api/v1/datasets/<dataset_id>
        """

        dataset = DataSet.find_one({"id": dataset_id})
        if dataset is None:
            raise_exception(404, f"dataset_id[{dataset_id}] not found")

        data = dataset.to_dict()

        category_list = []
        for cat in Category.find_many({"dataset_id": dataset_id}):
            category_list.append(cat.to_dict({"id", "name"}))

        label_list = []
        for label in Label.find_many({"dataset_id": dataset_id}):
            includes = {"id", "name", "type", "clone_from_label", "compare_precisions"}
            label = label.to_dict(include=includes)

            # TODO keep for compatibility, delete this in the future
            label["source"] = label["type"]

            # TODO keep for compatibility, delete this after run op/migrates/add_label_clone_from.py
            label.setdefault("clone_from_label", "")

            label_list.append(label)

        label_list.sort(key=lambda x: (x["type"] == LabelType.GroundTruth, x["type"] == LabelType.User),
                        reverse=True)

        data["category_list"] = category_list
        data["label_list"] = label_list
        return format_response(data)
