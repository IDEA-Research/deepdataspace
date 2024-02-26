"""
Import the tsv dataset and save metadata into mongodb.
"""

import json
import logging
import os
import re
import traceback
from typing import Dict
from typing import List
from typing import Tuple
from typing import Union

from deepdataspace.constants import ContentEncoding
from deepdataspace.constants import DatasetType
from deepdataspace.constants import LabelName
from deepdataspace.constants import LabelType
from deepdataspace.constants import DatasetFileType
from deepdataspace.io.importer import FileImporter
from deepdataspace.utils.file import create_file_range_url

logger = logging.getLogger("plugins.tsv.importer")


class TSVImporter(FileImporter):
    """
    Importer for tsv dataset.
    """

    def __init__(self, dataset_path: str, enforce: bool = False):
        """
        :param dataset_path: path to a tsv dataset.
        :param enforce: if True, the importer will re-import the dataset even if it is already imported.
        """

        dataset_path = os.path.abspath(dataset_path)
        super(TSVImporter, self).__init__(dataset_path, enforce=enforce)

        self.dataset.type = DatasetType.TSV
        self._files = {}
        self._num_images = 0

    def open_files(self):
        for file_tag, file_path in self.dataset.files.items():
            if file_tag == DatasetFileType.GroundTruth or file_tag.startswith(f"{DatasetFileType.Prediction}/"):
                self._files[file_tag] = {
                    "fp": open(file_path, "r", encoding="utf8"),
                    "line_idx": 0,
                    "byte_idx": 0,
                    "path": file_path
                }
            elif file_tag == DatasetFileType.Embedding:
                self._files[file_tag] = {
                    "path": file_path
                }

    def close_files(self):
        for file in self._files.values():
            try:
                fp = file.get("fp", None)
                if fp is not None:
                    fp.close()
            except Exception as err:
                logger.error(traceback.format_tb(err.__traceback__))
                logger.error(str(err))
        self._files = {}

    def pre_run(self):
        self.open_files()
        super(TSVImporter, self).pre_run()

    def on_error(self, err: Exception):
        try:
            self.close_files()
        finally:
            super(TSVImporter, self).on_error(err)

    def post_run(self):
        try:
            self.close_files()
        finally:
            super(TSVImporter, self).post_run()

    def load_objects(self,
                     image: Dict,
                     label_name: str,
                     label_type: str,
                     objects: list,
                     image_data_off: int,
                     image_data_str: str,
                     file_path: str,
                     line_idx: int) -> List[Dict]:
        obj_list = []

        warned_seg = False
        for obj_idx, obj in enumerate(objects):
            obj["id"] = obj_idx

            # prepare category
            category_name = obj.pop("class", None)
            if category_name is None:
                continue

            # prepare segmentation
            segmentation = obj.pop("segmentation", None)
            if segmentation:
                wh, seg_str = segmentation.split("/", 1)
                if image["width"] is None or image["height"] is None:
                    h, w = wh.split(",", 1)
                    image["width"], image["height"] = int(w), int(h)
                try:
                    segmentation = [[float(num) for num in line_str.split(",")]
                                    for line_str in seg_str.split("/")]
                except Exception as err:
                    if warned_seg is False:
                        msg = f"[{self.dataset.path}@{line_idx}] malformed segmentation, seg={seg_str}, err={str(err)}"
                        logger.warning(msg)
                        warned_seg = True
                    segmentation = [[str(num) for num in line_str.split(",")]
                                    for line_str in seg_str.split("/")]

            # prepare bounding box
            bbox = obj.pop("bounding_box", None)
            if bbox is not None:
                xmin, ymin = bbox["xmin"] * image["width"], bbox["ymin"] * image["height"]
                xmax, ymax = bbox["xmax"] * image["width"], bbox["ymax"] * image["height"]
                bbox = [
                    xmin,
                    ymin,
                    xmax - xmin,
                    ymax - ymin
                ]

            # prepare alpha matting
            alpha = obj.get("alpha", None)
            if alpha is not None:
                pattern_length = 6
                pattern = alpha[:pattern_length]
                while True:
                    result = list(re.finditer(pattern, image_data_str))
                    if len(result) > 1:
                        pattern_length += 2
                    else:
                        result = result[0]
                        break

                beg_pos = image_data_off + result.start()
                end_pos = beg_pos + len(alpha)
                alpha = create_file_range_url(file_path=file_path,
                                              file_encoding=ContentEncoding.Base64,
                                              beg_pos=beg_pos,
                                              end_pos=end_pos,
                                              file_mime="image/png")

            # prepare is_group
            is_group = bool(obj.get("iscrowd", False))

            # prepare confidence
            confidence = obj.get("conf", 1.0)

            # add the annotation
            obj = self.format_annotation(category_name,
                                         label=label_name, label_type=label_type,
                                         conf=confidence, is_group=is_group,
                                         bbox=bbox, segmentation=segmentation, alpha_uri=alpha,
                                         )
            obj_list.append(obj)

        return obj_list

    @staticmethod
    def read_line(file_data: dict):
        line_idx = file_data["line_idx"]
        byte_idx = file_data["byte_idx"]

        line = file_data["fp"].readline()
        if len(line) == 0:
            return None, None, -1, -1, -1
        file_data["line_idx"] += 1
        file_data["byte_idx"] += len(line)

        image_id, image_data_str, image_content_str = line.split("\t")
        image_data_off = byte_idx + len(image_id) + 1
        return image_data_str, image_content_str, line_idx, byte_idx, image_data_off

    def load_groundtruth(self) -> Tuple[Union[Dict, None], Union[List[Dict], None]]:
        file = self._files[DatasetFileType.GroundTruth]
        image_data_str, image_content_str, line_idx, byte_idx, image_data_off = self.read_line(file)
        if image_data_str is None:
            return None, None

        file_path = file["path"]
        image_data = json.loads(image_data_str)

        # prepare image metadata
        metadata = image_data.get("metadata", {})
        image_width = metadata.get("width", None)
        image_height = metadata.get("height", None)

        # prepare image url
        content_offset = image_data_off + len(image_data_str) + 1
        content_length = len(image_content_str)
        if image_content_str.startswith("http://") or image_content_str.startswith("https://"):
            image_url = image_content_str
        else:
            image_url = create_file_range_url(file_path=file_path,
                                              file_encoding=ContentEncoding.Base64,
                                              beg_pos=content_offset, end_pos=content_offset + content_length,
                                              file_mime="image/jpeg",
                                              )

        # create image
        image = self.format_image_data(image_url, thumb_uri=image_url,
                                       width=image_width, height=image_height,
                                       id_=line_idx, metadata=metadata)

        # add annotations
        objects = image_data.get("objects", [])
        objects = self.load_objects(image, LabelName.GroundTruth, LabelType.GroundTruth,
                                    objects, image_data_off, image_data_str,
                                    file_path, line_idx)

        return image, objects

    def load_prediction(self, image: Dict, pred_name: str):
        file = self._files[pred_name]
        image_data_str, image_content_str, line_idx, byte_idx, image_data_off = self.read_line(file)
        if image_data_str is None:
            return

        file_path = file["path"]
        pred_name = pred_name.split("/")[-1]
        image_data = json.loads(image_data_str)

        # add annotations
        objects = image_data.get("objects", [])
        objects = self.load_objects(image, pred_name, LabelType.Prediction,
                                    objects, image_data_off, image_data_str,
                                    file_path, line_idx)
        return objects

    def load_predictions(self, image: Dict) -> List[Dict]:
        objects = []
        for file_key in self._files.keys():
            if not file_key.startswith(f"{DatasetFileType.Prediction}/"):
                continue
            obj_list = self.load_prediction(image, file_key)
            objects.extend(obj_list)
        return objects

    def __iter__(self) -> Tuple[Dict, List[Dict]]:
        while True:
            image, objects = self.load_groundtruth()
            if image is None:
                break

            pred_objects = self.load_predictions(image)
            objects.extend(pred_objects)
            yield image, objects

    @staticmethod
    def can_import(path: str):
        if os.path.isdir(path):
            return False
        return path.endswith(".tsv")

    def collect_files(self) -> dict:
        files = super(TSVImporter, self).collect_files()

        directory = os.path.dirname(self.path)
        for item in os.listdir(directory):
            if not item.startswith(self.dataset.name):
                continue

            file_path = os.path.join(directory, item)
            if item.endswith(".pred"):
                pred_name = item.replace(self.dataset.name, "")[1:]
                pred_name = os.path.splitext(pred_name)[0]
                pred_name = f"{DatasetFileType.Prediction}/{pred_name}"
                files[pred_name] = file_path

            if item.endswith(".embd"):
                files[DatasetFileType.Embedding] = file_path

        return files
