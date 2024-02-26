"""
deepdataspace.model.image

The image model.
"""

import copy
import logging
import os
from typing import ClassVar
from typing import Dict
from typing import List
from typing import Literal
from typing import Tuple
from typing import Type
from typing import Union

from deepdataspace import constants
from deepdataspace.constants import FileReadMode
from deepdataspace.constants import LabelName
from deepdataspace.constants import RedisKey
from deepdataspace.globals import Redis
from deepdataspace.model._base import BaseModel
from deepdataspace.model.category import Category
from deepdataspace.model.label import Label
from deepdataspace.model.object import Object
from deepdataspace.utils.file import create_file_url
from deepdataspace.utils.string import get_str_md5

logger = logging.getLogger("io.model.image")


class ImageModel(BaseModel):
    """
    | Image is the element of a dataset.
    | Each image contains a list of objects.
    |
    | The image model is designed differently from other models.
    | In the normal condition, every model refers to one and only one mongodb collection.
    | But the image model refers to multiple mongodb collections, one for each dataset.
    | This will improve the performance of the image query for large datasets.
    | But this also changes the behaviors of ImageModel:
    - The ImageModel class is created dynamically before accessing the mongodb collection.
    - While creating the ImageModel class, the dataset id is passed in as a class attribute 'belong_dataset'.
    - The get_collection and get_cls_id methods will decide the return value along with the 'belong_dataset'.

    | So the image model is designed to be used in this way:
    .. code-block:: python

        IModel = Image(dataset_id='xxxx') # the additional step to create the ImageModel class dynamically
        image = IModel(...)
        image.save()

    | Let's say we have two datasets, A and B:
    - Both dataSet A and B are stored in collection "datasets"
    - Images belong to DataSet A are stored in collection ``f"images@{dataset_A.id}"``
    - Images belong to DataSet B are stored in collection ``f"images@{dataset_B.id}"``

    Attributes:
    -----------
    id: int
        The image id.
    idx: int
        The image sorting field.
    url: str
        The image URL.
    dataset_id: str
        Which dataset this image belongs to.
    type: str
        What kind of dataset this image belongs to. Default is None. See :class:`deepdataspace.constants.DatasetType`.
    url_full_res: str
        The image URL of full resolution. Default is an empty string.
    objects: List[Object]
        The objects in this image. Default is an empty list.
    width: int
        The image width. Default is None.
    height: int
        The image height. Default is None.
    metadata: str
        The image metadata. Default is "{}".
    flag: int
        The image flag, values can be 0,1,2. Default is 0.
    flag_ts: int
        The image flag timestamp. Default is 0.
    num_fn: dict
        fn counter of image in the format {"label_id": {90:x, 80: y, ..., 10: z}}. Default is an empty dict.
    num_fn_cat: dict
        fn counter of image categorized, in the format {"label_id": {"category_id: {90:x, 80: y, ..., 10: z}}}. Default is an empty dict.
    num_fp: dict
        fp counter of image in the format {"label_id": {90:x, 80: y, ..., 10: z}}. Default is an empty dict.
    num_fp_cat: dict
        fp counter of image categorized, in the format {"label_id": {"category_id: {90:x, 80: y, ..., 10: z}}}. Default is an empty dict.
    """

    @classmethod
    def get_collection(cls):
        """
        Instead of returning a collection for all dataset, return a collection for each dataset.
        """

        return cls.db[f"images@dataset_{cls.belong_dataset}"]

    # the mandatory fields
    id: int  # the image id
    idx: int  # the image sorting field
    url: str  # the image url
    dataset_id: str  # which dataset this image belongs to

    # the optional fields
    type: str = None  # what kind of dataset this image belongs to
    url_full_res: str = ""  # the image url of full resolution
    objects: List[Object] = []  # the objects in this image
    width: int = None  # the image width
    height: int = None  # the image height
    metadata: str = "{}"  # the image metadata
    flag: int = 0  # the image flag, 0,1,2
    flag_ts: int = 0  # the image flag timestamp

    # fn/fp counter of image
    num_fn: dict = {}  # {"label_id": {90:x, 80: y, ..., 10: z}}
    num_fn_cat: dict = {}  # {"label_id": {"category_id: {90:x, 80: y, ..., 10: z}}}
    num_fp: dict = {}  # {"label_id": {90:x, 80: y, ..., 10: z}}
    num_fp_cat: dict = {}  # {"label_id": {"category_id: {90:x, 80: y, ..., 10: z}}}

    _dataset = None

    _labels: dict = {}
    _categories: dict = {}
    belong_dataset: ClassVar[str] = None

    @property
    def dataset(self):
        from deepdataspace.model.dataset import DataSet  # import inside function to avoid circular importing

        if self._dataset is None:
            self._dataset = DataSet.find_one({"id": self.dataset_id})
        return self._dataset

    @classmethod
    def get_cls_id(cls):
        """
        Instead of returning the class name directly, return the class name with dataset id.
        """

        return f"{cls.__name__}.{cls.belong_dataset}"

    @classmethod
    def from_dict(cls, data: dict):
        """
        This is almost the same as the BaseModel.from_dict method,
        except that it will set the idx field by id value if idx is not set.
        """

        data.setdefault("idx", data["id"])
        obj = cls.parse_obj(data)
        return obj

    @staticmethod
    def _convert_local_to_url(file_uri: str):
        file_path = file_uri[7:]
        file_url = create_file_url(file_path=file_path,
                                   read_mode=constants.FileReadMode.Binary)
        return file_url

    def _add_label(self, label: str, label_type: str):
        """
        Add a label to the dataset the image belongs to.
        """

        label_id = get_str_md5(f"{self.dataset_id}_{label}")
        label_obj = self._labels.get(label_id, None)
        if label_obj is None:
            label_obj = Label.find_one({"id": label_id})

        if label_obj is not None and label_obj.type != label_type:
            msg = f"label_type mismatch with existing label data, existing: {label_obj.type}, label_type:{label_type}"
            raise ValueError(msg)

        if label_obj is None:
            label_obj = Label(name=label, id=label_id, type=label_type, dataset_id=self.dataset_id)
            label_obj.save()
            self._labels[label_id] = label_obj
        return label_obj

    def _add_category(self, category: str):
        """
        Add a category to the dataset the image belongs to.
        """

        category_id = get_str_md5(f"{self.dataset_id}_{category}")
        category_obj = self._categories.get(category_id, None)
        if category_obj is None:
            category_obj = Category.find_one({"id": category_id})

        if category_obj is None:
            category_obj = Category(name=category, id=category_id, dataset_id=self.dataset_id)
            category_obj.save()
            self._categories[category_id] = category_obj
        return category_obj

    @staticmethod
    def format_bbox(width, height, bbox: Tuple[int, int, int, int]):
        """
        Convert the bbox data to the internal format.
        """

        bounding_box = {}
        if bbox:
            x1, y1, w, h = bbox
            x2, y2 = x1 + w, y1 + h
            bounding_box = {"xmin": x1 / width,
                            "ymin": y1 / height,
                            "xmax": x2 / width,
                            "ymax": y2 / height}
        return bounding_box

    @staticmethod
    def format_segmentation(segmentation: List[List[int]]):
        """
        Convert the segmentation data to the internal format.
        """

        if not segmentation:
            return ""
        return "/".join([",".join([str(x) for x in seg]) for seg in segmentation])

    @staticmethod
    def format_keypoints(keypoints: List[Union[float, int]],
                         colors: List[int] = None,
                         skeleton: List[int] = None,
                         names: List[str] = None):
        """
        Convert the coco_keypoints data to the internal format.
        """

        if not keypoints:
            return [], [], [], []

        if len(keypoints) % 4 != 0:
            raise ValueError("coco_keypoints must be a flat list of x1, y1, v1, conf1, x2, y2, v2, conf2, ...")

        points = []
        length = len(keypoints) // 4
        for idx in range(length):
            idx *= 4
            x, y, v, conf = keypoints[idx], keypoints[idx + 1], keypoints[idx + 2], keypoints[idx + 3]
            points.extend([float(x), float(y), 0.0, 1.0, int(v), conf])  # x, y, z, w, v, conf

        if not colors:
            colors = constants.KeyPointColor.COCO
        if not skeleton:
            skeleton = constants.KeyPointSkeleton.COCO
        if not names:
            names = constants.KeyPointName.COCO

        return points, colors, skeleton, names

    @staticmethod
    def _add_local_file_url_to_whitelist(url: str):
        if not url or not url.startswith("/files/local_files"):
            return

        path = url.split("/")
        path = "/".join(path[7:])
        Redis.sadd(RedisKey.DatasetImageDirs, os.path.dirname(path))

    def _update_dataset(self, bbox, segmentation, alpha_uri, coco_keypoints):
        """
        Update the dataset attributes according to the annotation data.
        """

        modified = False
        if constants.AnnotationType.Classification not in self.dataset.object_types:
            self.dataset.object_types.append(constants.AnnotationType.Classification)
            modified = True
        if bbox is not None and constants.AnnotationType.Detection not in self.dataset.object_types:
            self.dataset.object_types.append(constants.AnnotationType.Detection)
            modified = True
        if segmentation and constants.AnnotationType.Segmentation not in self.dataset.object_types:
            self.dataset.object_types.append(constants.AnnotationType.Segmentation)
            modified = True
        if alpha_uri and constants.AnnotationType.Matting not in self.dataset.object_types:
            self.dataset.object_types.append(constants.AnnotationType.Matting)
            modified = True
        if coco_keypoints and constants.AnnotationType.KeyPoints not in self.dataset.object_types:
            self.dataset.object_types.append(constants.AnnotationType.KeyPoints)
            modified = True

        if modified:
            self.dataset.save()

    def _add_annotation(self,
                        category: str,
                        label: str = LabelName.GroundTruth,
                        label_type: Literal["GT", "Pred", "User"] = "GT",
                        conf: float = 1.0,
                        is_group: bool = False,
                        bbox: Tuple[int, int, int, int] = None,
                        segmentation: List[List[int]] = None,
                        alpha_uri: str = None,
                        keypoints: List[Union[float, int]] = None,
                        keypoint_colors: List[int] = None,
                        keypoint_skeleton: List[int] = None,
                        keypoint_names: List[str] = None,
                        caption: str = None,
                        ):
        if bbox:
            if not self.width or not self.height:
                raise ValueError("image width and height must be set before setting bbox")

        if alpha_uri and alpha_uri.startswith("file://"):
            alpha_path = alpha_uri[7:]
            alpha_uri = create_file_url(file_path=alpha_path,
                                        read_mode=FileReadMode.Binary)

        label_obj = self._add_label(label, label_type)
        category_obj = self._add_category(category)
        bounding_box = self.format_bbox(self.width, self.height, bbox)
        segmentation = self.format_segmentation(segmentation)
        points, colors, lines, names = self.format_keypoints(keypoints,
                                                             keypoint_colors,
                                                             keypoint_skeleton,
                                                             keypoint_names)
        anno_obj = Object(label_name=label, label_type=label_type, label_id=label_obj.id,
                          category_name=category, category_id=category_obj.id, caption=caption,
                          bounding_box=bounding_box, segmentation=segmentation, alpha=alpha_uri,
                          points=points, lines=lines, point_colors=colors, point_names=names,
                          conf=conf, is_group=is_group)
        self.objects.append(anno_obj)

    def add_annotation(self,
                       category: str,
                       label: str = LabelName.GroundTruth,
                       label_type: Literal["GT", "Pred", "User"] = "GT",
                       conf: float = 1.0,
                       is_group: bool = False,
                       bbox: Tuple[int, int, int, int] = None,
                       segmentation: List[List[int]] = None,
                       alpha_uri: str = None,
                       keypoints: List[Union[float, int]] = None,
                       keypoint_colors: List[int] = None,
                       keypoint_skeleton: List[int] = None,
                       keypoint_names: List[str] = None,
                       caption: str = None,
                       ):
        """
        Add an annotation to the image.

        :param category: the category name.
        :param label: the label name.
        :param conf: the confidence of the annotation.
        :param is_group: whether the annotation is a group.
        :param label_type: the label type, GT, Pred, User.
        :param bbox: the bounding box of the annotation, (x1, y1, w, h).
        :param segmentation: the segmentation of the annotation, [[l1p1, l1p2, ...], [l2p1, l2p2, ...]].
        :param alpha_uri: the alpha uri of the annotation, either a local path or a remote url.
        :param keypoints: the key points, [x1, y1, v1, conf1, x2, y2, v2, conf2, ...].
               v stands for visibility, 0 = not labeled, 1 = labeled but not visible, 2 = visible;
               conf stands for confidence, and it should always be 1.0 for ground truth.
        :param keypoint_names: the key point names, ["nose", "left_eye", ...].
        :param keypoint_colors: the key point colors, [255, 0, 0, ...].
        :param keypoint_skeleton: the key point skeleton, [0, 1, 2, ...].
        :param caption: the caption of the annotation.
        """

        self._add_annotation(category, label, label_type, conf,
                             is_group, bbox, segmentation, alpha_uri,
                             keypoints, keypoint_colors, keypoint_skeleton, keypoint_names,
                             caption)

        self.save()
        self._update_dataset(bbox, segmentation, alpha_uri, keypoints)

    def batch_add_annotation(self,
                             category: str,
                             label: str = LabelName.GroundTruth,
                             label_type: Literal["GT", "Pred", "User"] = "GT",
                             conf: float = 1.0,
                             is_group: bool = False,
                             bbox: Tuple[int, int, int, int] = None,
                             segmentation: List[List[int]] = None,
                             alpha_uri: str = None,
                             keypoints: List[Union[float, int]] = None,
                             keypoint_colors: List[int] = None,
                             keypoint_skeleton: List[int] = None,
                             keypoint_names: List[str] = None,
                             caption: str = None,
                             ):
        """
        The batch version of add_annotation.
        The performance is better if we are saving a lot of annotations.
        But this does not guarantee the dataset data consistency before the DataSet.finish_batch_add_image is called.
        So this function must be used in a batch add image context like this::

            for image_data in images:
                image = dataset.batch_add_image(**image_data)

                for annotation_data in annotations:
                    image.batch_add_annotation(**annotation_data)

            dataset.finish_batch_add_image()

        :param category: the category name.
        :param label: the label name.
        :param conf: the confidence of the annotation.
        :param is_group: whether the annotation is a group.
        :param label_type: the label type, GT, Pred, User.
        :param bbox: the bounding box of the annotation, (x1, y1, w, h).
        :param segmentation: the segmentation of the annotation, [[l1p1, l1p2, ...], [l2p1, l2p2, ...]].
        :param alpha_uri: the alpha uri of the annotation, either a local path or a remote url.
        :param keypoints: the key points, [x1, y1, v1, conf1, x2, y2, v2, conf2, ...].
            v stands for visibility, 0 = not labeled, 1 = labeled but not visible, 2 = visible;
            conf stands for confidence, and it should always be 1.0 for ground truth.
        :param keypoint_names: the key point names, ["nose", "left_eye", ...].
        :param keypoint_colors: the key point colors, [255, 0, 0, ...].
        :param keypoint_skeleton: the key point skeleton, [0, 1, 2, ...].
        :param caption: the caption of the annotation.
        :return: None
        """

        bbox = self.format_bbox(self.width, self.height, bbox)
        segmentation = self.format_segmentation(segmentation)
        points, colors, lines, names = self.format_keypoints(keypoints,
                                                             keypoint_colors,
                                                             keypoint_skeleton,
                                                             keypoint_names)
        if alpha_uri and alpha_uri.startswith("file://"):
            alpha_path = alpha_uri[7:]
            alpha_uri = create_file_url(file_path=alpha_path,
                                        read_mode=FileReadMode.Binary)

        anno_obj = Object(label_name=label, label_type=label_type,
                          category_name=category, caption=caption,
                          bounding_box=bbox, segmentation=segmentation, alpha=alpha_uri,
                          points=points, lines=lines, point_colors=colors, point_names=names,
                          conf=conf, is_group=is_group)
        self.objects.append(anno_obj)

    def finish_batch_add_annotation(self):
        self.dataset.batch_save_image()


_image_models: Dict[str, Type[ImageModel]] = {}  # a cache for ImageModel for each dataset


def Image(dataset_id: str) -> Type[ImageModel]:
    """
    A shortcut to get the ImageModel for specified dataset.
    """

    model = _image_models.setdefault(dataset_id, copy.deepcopy(ImageModel))
    model.belong_dataset = dataset_id
    return model
