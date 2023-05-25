"""
deepdataspace.server.resources.api_v1.lints

RESTful APIs on lints.
"""

from deepdataspace.model.dataset import DataSet
from deepdataspace.model.label_task import LabelProject
from deepdataspace.model.user import User
from deepdataspace.server.resources.common import Argument
from deepdataspace.server.resources.common import AuthenticatedAPIView
from deepdataspace.server.resources.common import format_response
from deepdataspace.server.resources.common import parse_arguments


class UserNameLintsView(AuthenticatedAPIView):
    """
    - GET /api/v1/user_name_lints
    """

    get_data = [
        Argument("name", str, Argument.QUERY, required=True),
    ]

    def get(self, request):
        """
        Get user lints by username.
        - GET /api/v1/user_name_lints
        """

        name, = parse_arguments(request, self.get_data)
        name = name.strip()
        if not name:
            return format_response({"user_list": []})

        filters = {"name": {"$regex": f"{name}"}}
        users = User.find_many(filters, to_dict=True, includes={"name": 1, "_id": 1})
        data = {"user_list": list(users)}
        return format_response(data)


class DatasetNameLintsView(AuthenticatedAPIView):
    """
    - GET /api/v1/dataset_name_lints
    """

    LabelProjectPurpose = "label_project"
    ALLPurpose_ = [LabelProjectPurpose]

    get_data = [
        Argument("name", str, Argument.QUERY, required=True),
        Argument("purpose", Argument.Choice(ALLPurpose_), Argument.QUERY, required=False),
    ]

    def get(self, request):
        """
        Get dataset lints by dataset name.
        - GET /api/v1/dataset_name_lints
        """

        name, purpose = parse_arguments(request, self.get_data)
        name = name.strip()
        if not name:
            return format_response({"dataset_list": []})

        filters = {"name": {"$regex": f"{name}"}}

        datasets = DataSet.find_many(filters, to_dict=True, includes={"name": 1, "_id": 1})

        invalid_datasets = set()
        if purpose == self.LabelProjectPurpose:
            projects = LabelProject.find_many({})
            for project in projects:
                for dataset in project.datasets:
                    invalid_datasets.add(dataset["id"])

        dataset_list = []
        for dataset in datasets:
            dataset["valid"] = dataset["id"] not in invalid_datasets
            dataset_list.append(dataset)

        data = {"dataset_list": dataset_list}
        return format_response(data)
