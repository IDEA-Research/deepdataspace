"""
deepdataspace.server.resources.api_v1.label_clone

RESTful API for cloning a label set for a dataset.
"""

import logging
import time

from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import ErrCode
from deepdataspace.constants import LabelName
from deepdataspace.constants import LabelType
from deepdataspace.globals import MongoDB
from deepdataspace.model import DataSet
from deepdataspace.model import Label
from deepdataspace.model import Object
from deepdataspace.model.image import Image
from deepdataspace.utils.http import Argument
from deepdataspace.utils.http import BaseAPIView
from deepdataspace.utils.http import format_response
from deepdataspace.utils.http import parse_arguments
from deepdataspace.utils.http import raise_exception
from deepdataspace.utils.string import get_str_md5

logger = logging.getLogger("django")


class LabelCloneView(BaseAPIView):
    """
    - POST /api/v1/label_clone
    """

    post_args = [
        Argument("dataset_id", str, Argument.JSON, required=True),
        Argument("src_label_id", str, Argument.JSON, required=True),
        Argument("dst_label_name", str, Argument.JSON, required=False),
    ]

    @staticmethod
    def gen_unique_clone_name(dataset_id, src_label_name, dst_label_name):
        if dst_label_name in [LabelName.GroundTruth, LabelName.UserAnnotation]:
            raise_exception(ErrCode.LabelSetNameInvalid,
                            f"dst_label_name[{dst_label_name}] is forbidden, please try another name")

        current_labels = Label.find_many({"dataset_id": dataset_id})
        current_names = {l.name: 1 for l in current_labels}

        if not dst_label_name:
            dst_label_name = f"{src_label_name}.Clone"
            name_suffix = 2
            while current_names.get(dst_label_name, None) == 1:
                dst_label_name = ".".join(dst_label_name.split(".")[:2])
                dst_label_name = f"{dst_label_name}.{name_suffix}"
                name_suffix += 1
            return dst_label_name
        elif current_names.get(dst_label_name, None) == 1:
            raise_exception(ErrCode.LabelSetNameConflicts,
                            f"dst_label_name[{dst_label_name}] already exists, please try another name")
        else:
            return dst_label_name

    @staticmethod
    def clone_images_collection(dataset_id, target_dataset_id, src_label_id, dst_label_id, dst_label_name):
        for image in Image(dataset_id).find_many({}):
            cloned = []
            label_confirm = image.label_confirm
            label_confirm.setdefault(dst_label_id, {"confirm": 0, "confirm_ts": 0})

            for obj in image.objects:
                label_id = obj.label_id
                label_confirm.setdefault(label_id, {"confirm": 0, "confirm_ts": 0})

                if obj.label_id != src_label_id:
                    continue

                obj = Object(
                        label_id=dst_label_id, label_name=dst_label_name, label_type=LabelType.User,
                        category_id=obj.category_id, category_name=obj.category_name, conf=obj.conf,
                        is_group=obj.is_group, bounding_box=obj.bounding_box, segmentation=obj.segmentation,
                        alpha=obj.alpha, points=obj.points, lines=obj.lines, point_colors=obj.point_colors,
                        point_names=obj.point_names, confirm_type=obj.confirm_type,
                )
                cloned.append(obj)
            image.objects.extend(cloned)

            try:
                Image(target_dataset_id)(**image.to_dict()).batch_save()
            except Exception as err:
                logger.warning(f"Failed to clone label set, err={str(err)}")
                Image(target_dataset_id).get_collection().drop()
                raise_exception(ErrCode.FailedToCloneLabelSet, ErrCode.FailedToCloneLabelSetMsg)

        try:
            Image(target_dataset_id).finish_batch_save()
        except Exception as err:
            logger.warning(f"Failed to clone label set, err={str(err)}")
            Image(target_dataset_id).get_collection().drop()
            raise_exception(ErrCode.FailedToCloneLabelSet, ErrCode.FailedToCloneLabelSetMsg)

    @staticmethod
    def swap_images_collection(dataset_id, target_dataset_id):
        src_name = Image(dataset_id).get_collection().name
        dst_name = Image(target_dataset_id).get_collection().name
        tmp_name = f"tmp@{dataset_id}"

        try:
            MongoDB[src_name].rename(tmp_name, dropTarget=True)
        except Exception as err:
            logger.warning(f"Failed to swap images collection, cannot rename src to tmp, err={str(err)}")
            raise_exception(ErrCode.FailedToCloneLabelSet, ErrCode.FailedToCloneLabelSetMsg)

        try:
            MongoDB[dst_name].rename(src_name, dropTarget=True)
        except Exception as err:
            logger.warning(f"Failed to swap images collection, cannot rename dst to src, err={str(err)}")
            MongoDB[tmp_name].rename(src_name, dropTarget=True)
            raise_exception(ErrCode.FailedToCloneLabelSet, ErrCode.FailedToCloneLabelSetMsg)

        try:
            MongoDB[tmp_name].drop()
        except Exception as err:
            logger.warning(f"Failed to swap images collection, cannot drop tmp, err={str(err)}")

    @staticmethod
    def insert_label_meta(dataset_id, src_label_id, dst_label_id, dst_label_name):
        dst_label = Label(id=dst_label_id, name=dst_label_name, type=LabelType.User,
                          dataset_id=dataset_id, clone_from_label=src_label_id)
        dst_label.save()
        return dst_label

    def post(self, request):
        """
        Clone a label set for a dataset
        - POST /api/v1/label_clone
        """

        dataset_id, src_label_id, dst_label_name = parse_arguments(request, self.post_args)

        # prefight checks
        src_label = Label.find_one({"id": src_label_id})
        if src_label is None or src_label.dataset_id != dataset_id:
            raise_exception(ErrCode.DatasetLabelNotFound, f"src_label_id[{src_label_id}] not found")

        dataset = DataSet.find_one({"id": dataset_id})
        if dataset is None:
            raise_exception(ErrCode.DatasetNotFound,
                            f"dataset_id[{dataset_id}] not found")

        if dataset.status in DatasetStatus.DontRead_:
            raise_exception(ErrCode.DatasetNotReadable,
                            f"dataset_id[{dataset_id}] is in status [{dataset.status}] now, try again later")

        dst_label_name = self.gen_unique_clone_name(dataset_id, src_label.name, dst_label_name)

        # prepare for cloning
        timestamp = int(time.time())
        dataset_id = dataset.id
        dst_label_id = get_str_md5(f"{dataset_id}_{dst_label_name}")

        # lock the dataset
        origin_status = dataset.status
        DataSet.update_one({"id": dataset_id}, {"status": DatasetStatus.Importing})
        try:
            target_dataset_id = f"backup@{timestamp}@{dataset_id}"
            self.clone_images_collection(dataset_id, target_dataset_id, src_label_id, dst_label_id, dst_label_name)
            self.swap_images_collection(dataset_id, target_dataset_id)
            label = self.insert_label_meta(dataset_id, src_label_id, dst_label_id, dst_label_name)

            data = label.to_dict()
            # TODO keep for compatibility, delete this in the future
            data["source"] = data["type"]

            return format_response(data)
        finally:  # unlock the dataset
            DataSet.update_one({"id": dataset_id}, {"status": origin_status})
