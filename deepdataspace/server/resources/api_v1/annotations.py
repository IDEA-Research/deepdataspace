"""
deepdataspace.server.resources.api_v1.annotations

The RESTful API of Annotations.
"""

import logging
import time

from deepdataspace.constants import AnnotationType
from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import LabelName
from deepdataspace.constants import LabelType
from deepdataspace.model import Category
from deepdataspace.model import DataSet
from deepdataspace.model import Label
from deepdataspace.model.image import Image
from deepdataspace.model.object import Object
from deepdataspace.server.resources.common import Argument
from deepdataspace.server.resources.common import BaseAPIView
from deepdataspace.server.resources.common import format_response
from deepdataspace.server.resources.common import parse_arguments
from deepdataspace.server.resources.common import raise_exception
from deepdataspace.utils.string import get_str_md5

logger = logging.getLogger("django")


class AnnotationsView(BaseAPIView):
    """
    - POST /api/v1/annotations
    """

    post_args = [
        Argument("dataset_id", str, Argument.JSON, required=True),
        Argument("image_id", int, Argument.JSON, required=True),
        Argument("annotations", list, Argument.JSON, required=True),
    ]

    def _parse_json(self, request):
        dataset_id, image_id, annotations = parse_arguments(request, self.post_args)

        dataset = DataSet.find_one({"id": dataset_id})
        if dataset is None:
            raise_exception(404, f"dataset[{dataset_id}] not found")

        image = Image(dataset_id).find_one({"id": image_id})
        if image is None:
            raise_exception(404, f"image[{image_id}] not found")

        status = dataset.status
        if status in DatasetStatus.DontRead_:
            raise_exception(404, f"dataset[{dataset_id}] is in status[{status}] now, try again later")

        for idx, annotation in enumerate(annotations):
            if not isinstance(annotation, dict):
                raise_exception(400, f"annotations[{idx}] must be a list of object, got '{annotation}'")

            try:
                annotation["category_name"] = str(annotation["category_name"])
            except KeyError:
                raise_exception(400, f"field annotations[{idx}] must have key 'category_name'")

            try:
                bbox = annotation["bounding_box"]
            except KeyError:
                raise_exception(400, f"field annotations[{idx}] must have key 'bounding_box'")

            try:
                bbox["xmin"] = float(bbox["xmin"])
                bbox["ymin"] = float(bbox["ymin"])
                bbox["xmax"] = float(bbox["xmax"])
                bbox["ymax"] = float(bbox["ymax"])
            except (KeyError, ValueError, TypeError):
                raise_exception(400,
                                f"field annotations[{idx}].bounding_box must have key xmin/xmax/ymin/ymax of float value")

        return dataset, image, annotations

    @staticmethod
    def _save_annotations(dataset: DataSet, image, annotations):
        """
        保存 objects 到 image
        """
        cur_objs = image.objects
        cur_objs = list(filter(lambda x: x.label_name != LabelName.UserAnnotation, cur_objs))

        saving_categories = {}
        saving_labels = {}

        label_name = LabelName.UserAnnotation
        label_id = get_str_md5(f"{dataset.id}_{label_name}")
        for obj in annotations:
            category_name = obj["category_name"]
            category_id = get_str_md5(f"{dataset.id}_{category_name}")
            obj["category_id"] = category_id
            obj["category_name"] = obj.pop("category_name")  # 重新插入保持一致的字段顺序
            saving_categories[category_id] = category_name

            obj["label_id"] = label_id
            obj["label_name"] = label_name
            obj["label_type"] = LabelType.User
            obj["conf"] = 1
            saving_labels[label_id] = label_name

            try:
                obj = Object.from_dict(obj)
            except Exception as err:
                logger.warning(f"object data structure mismatch: err={str(err)}")
                raise_exception(400, f"object data structure mismatch")
            else:
                cur_objs.append(obj)

        image.objects = cur_objs
        image.label_confirm[label_id] = {"confirm": 1, "confirm_ts": int(time.time())}
        image.save()

        return saving_categories, saving_labels

    def _save_categories(self, dataset, categories):
        for cat_id, cat_name in categories.items():
            category = Category(id=cat_id, name=cat_name, dataset_id=dataset.id)
            category.save()

    @staticmethod
    def _save_labels(dataset: DataSet, labels):
        """
        保存 label 到 mongodb
        """

        for label_id, label_name in labels.items():
            label = Label(id=label_id, name=label_name, type=LabelType.User, dataset_id=dataset.id)
            label.save()

    @staticmethod
    def _save_object_types(dataset: DataSet):
        dataset = DataSet.find_one({"id": dataset.id})
        object_types = dataset.object_types
        if AnnotationType.Detection not in object_types:
            object_types.append(AnnotationType.Detection)
            object_types.sort()
            dataset.object_types = object_types
            dataset.save()

    def post(self, request):
        """
        Save annotations to a image.
        - POST /api/v1/annotations
        """

        dataset, image, annotations = self._parse_json(request)

        categories, labels = self._save_annotations(dataset, image, annotations)
        self._save_categories(dataset, categories)
        self._save_labels(dataset, labels)
        self._save_object_types(dataset)

        return format_response({})
