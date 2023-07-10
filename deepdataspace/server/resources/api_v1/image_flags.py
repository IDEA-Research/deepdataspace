"""
deepdataspace.server.resources.api_v1.image_flags

RESTful api to update flags of images in a dataset.
"""

import time

from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import ErrCode
from deepdataspace.model import DataSet
from deepdataspace.model.image import Image
from deepdataspace.utils.http import Argument
from deepdataspace.utils.http import BaseAPIView
from deepdataspace.utils.http import format_response
from deepdataspace.utils.http import parse_arguments
from deepdataspace.utils.http import raise_exception


class ImageFlagsView(BaseAPIView):
    """
    - POST /api/v1/image_flags
    """

    post_args = [
        Argument("dataset_id", str, Argument.JSON, required=True),
        Argument("flag_groups", list, Argument.JSON, required=True),
    ]

    def _parse_json(self, request):
        dataset_id, flag_groups = parse_arguments(request, self.post_args)

        dataset = DataSet.find_one({"id": dataset_id})
        if dataset is None:
            raise_exception(ErrCode.DatasetNotFound, f"subset[{dataset_id}] not found")
        if dataset.status in DatasetStatus.DontRead_:
            raise_exception(ErrCode.DatasetNotReadable,
                            f"dataset_id[{dataset_id}] is in status {dataset.status} now, try again later")

        for flag_group in flag_groups:
            if not isinstance(flag_group, dict):
                raise_exception(ErrCode.FlagGroupsNotListOfObj,
                                f"field flag_groups[] must be a list of object, got '{flag_group}'")
            flag = flag_group.pop("flag", None)

            if flag is None:
                raise_exception(ErrCode.FlagObjectMissingFlag, "field flag_groups[].flag is required")
            try:
                flag = int(flag)
                assert flag in [0, 1, 2]
            except Exception:
                raise_exception(ErrCode.FlagObjectFlagValueInvalid,
                                f"field flag_groups[].flag must be one of [0, 1, 2], got '{flag}'")

            ids = flag_group.pop("ids", None)
            if ids is None:
                raise_exception(ErrCode.FlagObjectMissingIDs, "field flag_groups[].ids is required")
            try:
                ids = list(ids)
            except Exception:
                raise_exception(ErrCode.FlagObjectIDsNotList,
                                f"field flag_groups[].ids must be a list, got '{type(ids)}'")

            flag_group["flag"] = flag
            flag_group["ids"] = ids

        return dataset, flag_groups

    def post(self, request):
        """
        Update flags of images in a dataset.
        - POST /api/v1/image_flags
        """

        dataset, flag_groups = self._parse_json(request)

        flag_ts = int(time.time())
        for group in flag_groups:
            flag = group["flag"]
            ids = group["ids"]
            Image(dataset.id).update_many(
                    {"id": {"$in": ids}},
                    {"flag": flag, "flag_ts": flag_ts}
            )

        if flag_groups:
            flag_export_link = f"/files/dataset_flags/{dataset.id}.tsv"
            DataSet.update_one({"id": dataset.id}, {"flag_export_link": flag_export_link})

        return format_response({})
