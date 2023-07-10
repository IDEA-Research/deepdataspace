"""
deepdataspace.server.resources.api_v1.object_confirm

RESTful API for object confirm.
"""

import logging
import time

from deepdataspace.constants import ErrCode
from deepdataspace.constants import DatasetStatus
from deepdataspace.model import DataSet
from deepdataspace.model import Label
from deepdataspace.model import Object
from deepdataspace.model.image import Image
from deepdataspace.utils.http import Argument
from deepdataspace.utils.http import BaseAPIView
from deepdataspace.utils.http import format_response
from deepdataspace.utils.http import parse_arguments
from deepdataspace.utils.http import raise_exception

logger = logging.getLogger("django")


class ObjectConfirmView(BaseAPIView):
    """
    - POST /api/v1/object_confirm
    """

    post_args = [
        Argument("dataset_id", str, Argument.JSON, required=True),
        Argument("label_id", str, Argument.JSON, required=True),
        Argument("image_id", int, Argument.JSON, required=True),
        Argument("confirm", Argument.Choice([1, 2]), Argument.JSON, required=True),
        Argument("objects", list, Argument.JSON, required=False),
    ]

    def post(self, request):
        """
        Confirm a label set of an image.

        - POST /api/v1/object_confirm
        """

        dataset_id, label_id, image_id, confirm, objects = parse_arguments(request, self.post_args)

        dataset = DataSet.find_one({"id": dataset_id})
        if dataset is None:
            raise_exception(ErrCode.DatasetNotFound, f"dataset_id[{dataset_id}] not found")
        if dataset.status in DatasetStatus.DontRead_:
            raise_exception(404, f"dataset_id[{dataset_id}] is in status [{dataset.status}] now, try again later")

        label = Label.find_one({"id": label_id, "dataset_id": dataset_id})
        if label is None:
            raise_exception(ErrCode.DatasetLabelNotFound, f"label_id[{label_id}] not found")

        image = Image(dataset_id).find_one({"id": image_id})
        if image is None:
            raise_exception(ErrCode.DatasetImageNotFound, f"image_id[{image_id}] not found")

        new_objects = []
        for idx, obj in enumerate(objects):
            if obj["label_id"] != label_id:
                continue

            try:
                obj = Object.from_dict(obj)
                obj.compare_result = {}
                obj.matched_det_idx = None
            except Exception as err:
                logger.warning(err)
                raise_exception(ErrCode.AnnotationFormatError, f"objects[{idx}] data structure mismatch")
            new_objects.append(obj)

        saving_objects = [o for o in image.objects if o.label_id != label_id]
        saving_objects.extend(new_objects)
        image.objects = saving_objects

        label_confirm = image.label_confirm
        confirm_ts = int(time.time())
        label_confirm[label_id] = {"confirm": confirm, "confirm_ts": confirm_ts}
        image.save()

        return format_response({"confirm": confirm, "confirm_ts": confirm_ts})
