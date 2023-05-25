"""
Import the coco2017 dataset and save metadata into mongodb.
"""

import json
import logging
import os
from typing import Dict
from typing import List
from typing import Tuple

from deepdataspace.constants import DatasetType
from deepdataspace.constants import LabelName
from deepdataspace.constants import LabelType
from deepdataspace.io.importer import FileGroupImporter
from deepdataspace.io.importer import FileImporter

logger = logging.getLogger("plugins.coco.importer")


class COCO2017Importer(FileImporter):
    """
    Importer for coco2017 dataset.
    """

    def __init__(self, dataset_path: str, media_dir: str = None, prediction_dir: str = None, enforce: bool = False):
        """
        :param dataset_path: path to a json file of coco2017 dataset.
        :param media_dir: an optional local directory containing image files of this dataset.
            If no media_dir is provided, the image files will be served from the original coco image urls.
        :param prediction_dir: an optional local directory containing json files of predictions of this dataset.
        :param enforce: if True, the importer will re-import the dataset even if it is already imported.
        """

        dataset_path = os.path.abspath(dataset_path)
        self.dataset_path = dataset_path
        self.media_dir = media_dir
        self.prediction_dir = prediction_dir

        super(COCO2017Importer, self).__init__(dataset_path, enforce=enforce)
        self.dataset.type = DatasetType.COCO2017
        self._images = {}  # {image_id: image}
        self._categories = {}  # {category_id: category}
        self._annotations = {}  # {image_id: [annotation...]}

    def load_ground_truth(self):
        with open(self.dataset_path, "r", encoding="utf8") as fp:
            coco_data = json.load(fp)

        images = coco_data["images"]
        images = {i["id"]: i for i in images}

        categories = coco_data["categories"]
        self._categories = {c["id"]: c for c in categories}

        annotations = coco_data["annotations"]
        for annotation in annotations:
            annotation["label_name"] = LabelName.GroundTruth
            annotation["label_type"] = LabelType.GroundTruth
            image_id = annotation["image_id"]
            anno_list = self._annotations.setdefault(image_id, [])
            anno_list.append(annotation)

            self._images[image_id] = images[image_id]

    def load_predictions(self):
        for file_tag, file_path in self.dataset.files.items():
            if not file_tag.startswith("PRED/"):
                continue

            pred_name = file_tag.split("/", 1)[-1]
            with open(file_path, "r", encoding="utf8") as fp:
                pred_data = json.load(fp)

            annotations = pred_data.get("annotations", [])
            for annotation in annotations:
                annotation["label_name"] = pred_name
                annotation["label_type"] = LabelType.Prediction
                image_id = annotation["image_id"]
                anno_list = self._annotations.setdefault(image_id, [])
                anno_list.append(annotation)

    def format_data(self):
        self._images = [self._images[img_id] for img_id in sorted(self._images.keys())]

    def pre_run(self):
        super(COCO2017Importer, self).pre_run()

        self.load_ground_truth()
        self.load_predictions()
        self.format_data()

    def __iter__(self) -> Tuple[Dict, List[Dict]]:
        for coco_image_data in self._images:
            # data_sample = {"license"      : 2,
            #                "file_name"    : "000000000139.jpg",
            #                "coco_url"     : "http://images.cocodataset.org/val2017/000000000139.jpg",
            #                "height"       : 426,
            #                "width"        : 640,
            #                "date_captured": "2013-11-21 01:34:01",
            #                "flickr_url"   : "http://farm9.staticflickr.com/8035/8024364858_9c41dc1666_z.jpg",
            #                "id"           : 139}

            image_id = coco_image_data["id"]
            coco_anno_list = self._annotations.get(image_id, [])
            # list_sample = [
            #     {'segmentation'  : [
            #         [240.86, 211.31, 240.16, 197.19, 236.98, 192.26, 237.34, 187.67, 245.8, 188.02, 243.33, 176.02,
            #          250.39,
            #          186.96, 251.8, 166.85, 255.33, 142.51, 253.21, 190.49, 261.68, 183.08, 258.86, 191.2, 260.98,
            #          206.37,
            #          254.63, 199.66, 252.51, 201.78, 251.8, 212.01]],
            #         'area'       : 531.8071000000001,
            #         'iscrowd'    : 0,
            #         'image_id'   : 139,
            #         'bbox'       : [236.98, 142.51, 24.7, 69.5],
            #         'category_id': 64,
            #         'id'         : 26547,
            #         # 'label_name' : 'GroundTruth',
            #         # 'label_type' : 'GT'
            #     }
            # ]

            # prepare image uri

            uri = coco_image_data["coco_url"]
            if self.media_dir:
                image_path = os.path.join(self.media_dir, coco_image_data["file_name"])
                if os.path.exists(image_path):
                    uri = f"file://{image_path}"
                    coco_image_data.pop("coco_url")
                    coco_image_data.pop("file_name")

            # prepare other image data
            width = coco_image_data.pop("width", None)
            height = coco_image_data.pop("height", None)

            image = self.format_image_data(uri,
                                           width=width, height=height,
                                           id_=image_id, metadata=coco_image_data,
                                           )
            anno_list = []
            for anno_data in coco_anno_list:
                # prepare label
                label_name = anno_data.pop("label_name", LabelName.GroundTruth)
                label_type = anno_data.pop("label_type", LabelType.GroundTruth)

                # prepare category
                category_id = anno_data.pop("category_id")
                category = self._categories[category_id]
                category_name = category["name"]

                # prepare bbox
                bbox = anno_data.pop("bbox", None)
                if bbox is not None:
                    bbox = tuple(bbox)

                # prepare segmentation
                segmentation = anno_data.pop("segmentation", None)

                # prepare keypoints
                coco_keypoints = []
                keypoints = anno_data.pop("keypoints", None)
                if keypoints is not None:
                    length = len(keypoints) // 3
                    for idx in range(length):
                        idx *= 3
                        if label_type == LabelType.GroundTruth:
                            conf = 1.0
                            x, y, v = keypoints[idx], keypoints[idx + 1], keypoints[idx + 2]
                        else:  # label_type == LabelType.Prediction
                            v = 2
                            x, y, conf = keypoints[idx], keypoints[idx + 1], keypoints[idx + 2]
                        coco_keypoints.extend([float(x), float(y), int(v), conf])  # x, y, v, conf

                # prepare is_group
                is_group = anno_data.pop("is_group", None)

                # prepare confidence
                conf = anno_data.pop("conf", 1.0)
                if label_type == LabelType.GroundTruth:
                    conf = 1.0

                # finally, add the annotation
                anno_data = self.format_annotation(category_name,
                                                   label_name,
                                                   conf=conf,
                                                   bbox=bbox,
                                                   is_group=is_group,
                                                   label_type=label_type,
                                                   segmentation=segmentation,
                                                   coco_keypoints=coco_keypoints,
                                                   )
                anno_list.append(anno_data)
            yield image, anno_list

    @staticmethod
    def can_import(path: str):
        if os.path.isdir(path):
            return False

        if not path.endswith(".json"):
            return False

        if os.path.basename(path).startswith("captions_"):
            return False

        return True

    def collect_files(self) -> dict:
        files = super(COCO2017Importer, self).collect_files()
        if not self.prediction_dir or not os.path.exists(self.prediction_dir):
            return files

        for item in os.listdir(self.prediction_dir):
            if not item.endswith(".json"):
                continue

            pred_path = os.path.join(self.prediction_dir, item)
            with open(pred_path, "r", encoding="utf8") as fp:
                pred_data = json.load(fp)

            gt_path = pred_data.get("info", {}).get("gt", None)
            if gt_path is None:
                continue

            gt_name = os.path.splitext(os.path.basename(gt_path))[0]
            if gt_name != self.dataset_name:
                continue

            pred_name = os.path.splitext(item)[0]
            files[f"PRED/{pred_name}"] = pred_path

        return files


class COCO2017GroupImporter(FileGroupImporter):
    """
    Importer for COCO2017 dataset group.
    """

    def choose_importer(self, path: str) -> FileImporter:
        subset_name = os.path.basename(path).split("_")[-1]
        subset_name = os.path.splitext(subset_name)[0]

        media_dir = os.path.join(self.group_path, subset_name)
        prediction_dir = os.path.join(self.group_path, "predictions")

        if not os.path.exists(media_dir):
            media_dir = None
        if not os.path.exists(prediction_dir):
            prediction_dir = None

        importer = COCO2017Importer(path, media_dir, prediction_dir, enforce=self.enforce)
        return importer

    @staticmethod
    def can_import(path: str) -> bool:
        if os.path.isfile(path):
            return False

        dir_name = os.path.basename(path)
        if dir_name.lower() == "coco2017":
            return True

        for item in os.listdir(path):
            if item.lower() == ".coco2017":
                return True

        return False

    def find_files(self) -> List[str]:
        files = []
        annotations_dir = os.path.join(self.group_path, "annotations")
        for file in os.listdir(annotations_dir):
            file = os.path.join(annotations_dir, file)
            if COCO2017Importer.can_import(file):
                files.append(file)
        return files
