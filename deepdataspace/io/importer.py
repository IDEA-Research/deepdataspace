"""
deepdataspace.io.importer

The common interface of importing a dataset.
"""

import abc
import copy
import json
import logging
import os
import uuid
from typing import Dict
from typing import List
from typing import Literal
from typing import Tuple
from typing import Type
from typing import Union

from tqdm import tqdm
from pymongo import WriteConcern

from deepdataspace import constants
from deepdataspace.constants import AnnotationType
from deepdataspace.constants import DatasetFileType
from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import FileReadMode
from deepdataspace.constants import LabelName
from deepdataspace.constants import LabelType
from deepdataspace.constants import RedisKey
from deepdataspace.globals import Redis
from deepdataspace.model import DataSet
from deepdataspace.model.category import Category
from deepdataspace.model.image import Image
from deepdataspace.model.image import ImageModel
from deepdataspace.model.label import Label
from deepdataspace.utils.file import create_file_url
from deepdataspace.utils.function import count_block_time
from deepdataspace.utils.string import get_str_md5

logger = logging.getLogger("io.importer")


class ImportHelper:
    """
    A mixin class that adds helper functions to import a dataset.
    """

    @staticmethod
    def format_image_data(uri: str,
                          thumb_uri: str = None,
                          width: int = None,
                          height: int = None,
                          id_: int = None,
                          metadata: dict = None,
                          flag: int = 0,
                          flag_ts: int = 0, ):
        """
        A helper function to format image data.
        """

        return dict(uri=uri, thumb_uri=thumb_uri,
                    width=width, height=height,
                    id_=id_, metadata=metadata,
                    flag=flag, flag_ts=flag_ts)

    @staticmethod
    def format_annotation(category: str,
                          label: str = LabelName.GroundTruth,
                          label_type: str = "GT",
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
                          confirm_type: int = 0, ):
        """
        A helper function to format annotation data.
        """

        return dict(category=category,
                    label=label,
                    label_type=label_type,
                    conf=conf,
                    is_group=is_group,
                    bbox=bbox,
                    segmentation=segmentation,
                    alpha_uri=alpha_uri,
                    keypoints=keypoints,
                    keypoint_colors=keypoint_colors,
                    keypoint_skeleton=keypoint_skeleton,
                    keypoint_names=keypoint_names,
                    caption=caption,
                    confirm_type=confirm_type, )


class Importer(ImportHelper, abc.ABC):
    """
    The importer interface.
    Any subclass of Importer should implement the following methods:
        - __init__: do the initialization works.
        - __iter__: yield a tuple of image and annotation list in every iteration.
    And the following methods are optional:
        - pre_run: a hook before the importing process.
        - post_run: a hook after the importing process.
    """

    def __init__(self, name: str, id_: str = None):
        """
        :param name: the name of the dataset.
        :param id_: the dataset id.
            If provided, the importer will try to update an existing dataset instead of creating a new one.
        """
        self.dataset_name = name
        self.dataset = self.get_importing_dataset(name, id=id_)

        self._image_queue = {}
        self._label_queue = {}
        self._category_queue = {}
        self._user_data = {}  # {image_id: {}}
        self._import_queue = {}
        self._batch_size = 200
        self.IModel = Image(self.dataset.id)

    @staticmethod
    def get_importing_dataset(name: str,
                              id: str = None,
                              type: str = None,
                              path: str = None,
                              files: dict = None,
                              ) -> "DataSet":
        if id:
            dataset = DataSet.find_one({"id": id})
            if dataset is not None:
                dataset.type = type or dataset.type
                dataset.path = path or dataset.path
                dataset.files = files or dataset.files
                dataset.name = name
                dataset.save()
                return dataset
        else:
            id = uuid.uuid4().hex

        files = files or {}
        dataset = DataSet(name=name, id=id, type=type, path=path, files=files, status=DatasetStatus.Waiting)
        dataset.save()
        return dataset

    def dataset_import_image(self,
                             dataset: DataSet,
                             uri: str,
                             thumb_uri: str = None,
                             width: int = None,
                             height: int = None,
                             id_: int = None,
                             metadata: dict = None,
                             flag: int = 0,
                             flag_ts: int = 0, ) -> dict:
        full_uri = uri
        thumb_uri = full_uri if thumb_uri is None else thumb_uri
        if full_uri.startswith("file://"):
            full_uri = create_file_url(full_uri[7:], read_mode=FileReadMode.Binary)
        if thumb_uri.startswith("file://"):
            thumb_uri = create_file_url(thumb_uri[7:], read_mode=FileReadMode.Binary)

        metadata = metadata or {}
        metadata = json.dumps(metadata)

        # if id is not set,
        # we use a negative value to indicate we are adding a new image instead of updating an existing one
        idx = dataset.num_images
        id_ = id_ if id_ is not None else dataset.num_images
        image = dict(id=id_, idx=idx,
                     type=dataset.type, dataset_id=dataset.id,
                     url=thumb_uri, url_full_res=full_uri,
                     width=width, height=height,
                     flag=flag, flag_ts=flag_ts,
                     objects=[], metadata=metadata, )

        self._import_queue[id_] = image
        dataset.num_images += 1
        return image

    @staticmethod
    def image_import_annotation(image: dict,
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
                                confirm_type: int = 0, ):

        bbox = ImageModel.format_bbox(image["width"], image["height"], bbox)
        segmentation = ImageModel.format_segmentation(segmentation)
        points, colors, lines, names = ImageModel.format_keypoints(keypoints,
                                                                   keypoint_colors,
                                                                   keypoint_skeleton,
                                                                   keypoint_names)
        if alpha_uri and alpha_uri.startswith("file://"):
            alpha_path = alpha_uri[7:]
            alpha_uri = create_file_url(file_path=alpha_path,
                                        read_mode=FileReadMode.Binary)

        anno_obj = dict(label_name=label, label_type=label_type,
                        category_name=category, caption=caption,
                        bounding_box=bbox, segmentation=segmentation, alpha=alpha_uri,
                        points=points, lines=lines, point_colors=colors, point_names=names,
                        conf=conf, is_group=is_group, confirm_type=confirm_type)
        image["objects"].append(anno_obj)

    def bulk_write_images(self, image_queue: list):
        co = self.IModel.get_collection()
        wc = WriteConcern(w=0)
        co = co.with_options(write_concern=wc)
        co.insert_many(image_queue)

    def _dataset_flush_importing(self):
        if not self._import_queue:
            return

        with count_block_time("prepare batch setup", logger.debug):
            dataset_id = self.dataset.id
            waiting_labels = dict()
            waiting_categories = dict()
            object_types = set()
            whitelist_dirs = set()

        with count_block_time("prepare batch data", logger.debug):
            image_insert_queue = []

            for image_id, image in self._import_queue.items():
                for obj in image["objects"]:
                    # setup label
                    label_name = obj["label_name"]
                    label_id = waiting_labels.get(label_name, None)
                    if label_id is None:
                        label_id = get_str_md5(f"{dataset_id}_{label_name}")
                        label = Label(name=label_name, id=label_id, type=obj["label_type"], dataset_id=dataset_id)
                        label.batch_save(batch_size=self._batch_size)
                        waiting_labels[label_name] = label_id
                    obj["label_id"] = label_id

                    # setup category
                    cat_name = obj["category_name"]
                    category_id = waiting_categories.get(cat_name, None)
                    if category_id is None:
                        category_id = get_str_md5(f"{dataset_id}_{cat_name}")
                        category = Category(name=cat_name, id=category_id, dataset_id=dataset_id)
                        category.batch_save(batch_size=self._batch_size)
                        waiting_categories[cat_name] = category_id
                    obj["category_id"] = category_id

                    # setup object types
                    if AnnotationType.Classification not in object_types:
                        object_types.add(AnnotationType.Classification)
                    if obj["bounding_box"] and AnnotationType.Detection not in object_types:
                        object_types.add(AnnotationType.Detection)
                    if obj["segmentation"] and AnnotationType.Segmentation not in object_types:
                        object_types.add(AnnotationType.Segmentation)
                    if obj["alpha"] and AnnotationType.Matting not in object_types:
                        object_types.add(AnnotationType.Matting)
                        DataSet.add_local_file_url_to_whitelist(obj["alpha"], whitelist_dirs)
                    if obj["points"] and AnnotationType.KeyPoints not in object_types:
                        object_types.add(AnnotationType.KeyPoints)

                # setup image
                image["_id"] = image.pop("id")
                image_insert_queue.append(image)

                DataSet.add_local_file_url_to_whitelist(image["url"], whitelist_dirs)
                DataSet.add_local_file_url_to_whitelist(image["url_full_res"], whitelist_dirs)

        # finish batch saves
        with count_block_time("finish batch save", logger.debug):
            Label.finish_batch_save()
            Category.finish_batch_save()
            self.bulk_write_images(image_insert_queue)

        # setup dataset
        with count_block_time("setup dataset", logger.debug):
            self.dataset.object_types = list(sorted(list(object_types)))
            self.dataset.save()

        # save whitelist to redis
        with count_block_time("save whitelist", logger.debug):
            if whitelist_dirs:
                Redis.sadd(RedisKey.DatasetImageDirs, *whitelist_dirs)

            self._import_queue.clear()

    def dataset_flush_importing(self):
        batch_is_full = len(self._import_queue) >= self._batch_size
        if batch_is_full:
            with count_block_time("_dataset_flush_importing", logger.debug):
                self._dataset_flush_importing()
            return True
        return False

    def dataset_finish_importing(self):
        """
        This method should be called after all batch_add_image calls are finished.
        This saves all images in the buffer queue to database.
        """
        self._dataset_flush_importing()
        self.dataset.add_cover()

    def pre_run(self):
        """
        A pre-run hook for subclass importers to prepare data.
        """

        self.load_existing_user_data()
        self.dataset.num_images = 0
        self.dataset.status = constants.DatasetStatus.Importing
        self.dataset.save()
        Image(self.dataset.id).get_collection().drop()

    def post_run(self):
        """
        A post-run hook for subclass importers to clean up data.
        """
        self.dataset.add_cover()
        DataSet.update_one({"id": self.dataset.id}, {"status": DatasetStatus.Ready})
        self.dataset = DataSet.find_one({"id": self.dataset.id})

    def on_error(self, err: Exception):
        """
        A hook to handle error.
        """

        try:
            DataSet.cascade_delete(self.dataset)
            self.dataset = None
        finally:
            raise err

    def load_existing_user_data(self):
        """
        load existing user added data from mongodb, so they are not lost when re-importing the database.
        """

        pipeline = [
            {"$project": {"flag": 1,
                          "flag_ts": 1,
                          "label_confirm": 1,
                          "objects": {
                              "$filter": {
                                  "input": "$objects",
                                  "as": "object",
                                  "cond": {
                                      "$eq": ["$$object.label_type", LabelType.User]
                                  }
                              }
                          }}}
        ]

        for image in Image(self.dataset.id).aggregate(pipeline):
            image_id = image["_id"]

            # manually added objects
            old_objects = image["objects"]
            user_objects = list(filter(lambda obj: obj["label_type"] == LabelType.User, old_objects))

            # manually added flag
            flag = image.get("flag", 0)
            flag_ts = image.get("flag_ts", 0)

            # manually added confirm flag
            label_confirm = image.get("label_confirm", {})

            self._user_data[image_id] = {
                "objects": user_objects,
                "flag": flag,
                "flag_ts": flag_ts,
                "label_confirm": label_confirm,
            }

    def image_add_user_data(self, image: dict):
        """
        Save manually added user data back.
        """

        image_id = image["id"]
        user_data = self._user_data.pop(image_id, {})
        if not user_data:
            return

        image.setdefault("objects").extend(user_data["objects"])
        image["flag"] = user_data["flag"]
        image["flag_ts"] = user_data["flag_ts"]
        image["label_confirm"] = user_data["label_confirm"]

    def run_import(self):
        """
        The main process of importing the dataset.
        This Iterates over the dataset and import every image and annotations.
        """

        desc = f"dataset[{self.dataset.name}@{self.dataset.id}] import progress"
        for (image, anno_list) in tqdm(self, desc=desc, unit=" images"):
        # for (image, anno_list) in self:
            image = self.dataset_import_image(self.dataset, **image)
            self.image_add_user_data(image)
            for anno in anno_list:
                self.image_import_annotation(image, **anno)
            self.dataset_flush_importing()

        self.dataset_finish_importing()

    def run(self):
        """
        The start point of the importing process.
        """

        with count_block_time(f"import {self.dataset_name}", logger.info):
            try:
                self.pre_run()
                self.run_import()
            except Exception as err:
                self.on_error(err)
                return None
            else:
                self.post_run()
                return self.dataset

    @abc.abstractmethod
    def __iter__(self) -> Tuple[Dict, List[Dict]]:
        """
        The dataset iterator.
        It yields a tuple of image and annotation list in every iteration.
        """

        raise NotImplementedError


class FileImporter(Importer, abc.ABC):
    """
    The importer interface for file-based dataset.
    In addition to abstract methods defined in base Importer class,
    any subclass of FileImporter should implement the following methods:
        - can_import: a static method, check if the given path can be imported by this importer.
    And these methods are optional:
        - collect_files: collect the files related to this dataset, {file_tag: file_path}.
            By default, this function returns {LabelName.GroundTruth: dataset_file_path}.
            If there are other related files, such as prediction files, they should be collected here too.
    """

    def __init__(self, path: str, name: str = None, id_: str = None, enforce: bool = False):
        """
        :param path: the path of the dataset.
        :param name: the name of the dataset.
        :param id_: the dataset id.
                    If not provided, the importer will generate one with the path and name.
        :param enforce: if True, the importer will re-import the dataset even if it is already imported.
        """

        path = os.path.abspath(path)
        if name is None:
            name = os.path.basename(path).rsplit(".", 1)[0]

        if id_ is None:
            id_ = get_str_md5(path)

        super(FileImporter, self).__init__(name, id_=id_)
        self.path = path
        self.enforce = enforce

        self.dataset.path = path
        self.dataset.files = self.collect_files()
        self.dataset.save()

    def collect_files(self) -> dict:
        """
        Collect the files related to this dataset, {file_tag: file_path}.
        """

        return {DatasetFileType.GroundTruth: self.path}

    @staticmethod
    @abc.abstractmethod
    def can_import(path: str):
        """
        Check if the given path can be imported by this importer.
        """

        raise NotImplementedError

    def run(self):
        """
        The start point of the importing process.
        """

        if self.dataset.status == constants.DatasetStatus.Ready and not self.enforce:
            logger.info(f"Dataset {self.dataset_name} is already imported, skip.")
            return self.dataset

        return super(FileImporter, self).run()

    @classmethod
    def get_subclasses(cls):
        """
        Get all subclasses of this class.
        This is used together with can_import function to choose a proper importer for a given path.
        """

        sub_classes = set(cls.__subclasses__())
        result = copy.deepcopy(sub_classes)
        for sub_class in sub_classes:
            sub_sub_classes = sub_class.__subclasses__()
            result.union(sub_sub_classes)
        return result


def choose_importer_cls(target_path: str) -> Union[Type[FileImporter], None]:
    """
    Choose the proper importer class for target_path.
    The right importer is the importer class which returns true on importer_class.can_import(target_path).

    :param target_path: the target path to import, either a dataset or a dataset group.
    """

    # try to import as a dataset
    importers = FileImporter.get_subclasses()
    for imp_cls in importers:
        if imp_cls.can_import(target_path):
            logger.info(f"choose_importer_cls: {imp_cls.__name__} is chosen for target_path {target_path}")
            return imp_cls

    return None


def import_dataset(target_path: str, enforce: bool = False) -> DataSet:
    """
    Choose the right auto importer for target path, and run the import task.

    :param target_path: the target path to import, either a dataset or a dataset group.
    :param enforce: enforce the import task, even though the dataset is imported into mongodb before.
    """

    logger.info(f"import_dataset starts, target_path={target_path}, enforce={enforce}")
    importer_cls = choose_importer_cls(target_path)
    if importer_cls is not None:
        importer = importer_cls(target_path, enforce=enforce)
        return importer.run()
    else:
        logger.warning(f"cannot find any importer for {target_path}, skip it...")
