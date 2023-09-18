"""
Import the coco2017 dataset and save metadata into mongodb.
"""

import json
import logging
import os
from multiprocessing import Manager
from multiprocessing import Process
from typing import Dict
from typing import List
from typing import Tuple

from deepdataspace.constants import DatasetType
from deepdataspace.constants import LabelName
from deepdataspace.constants import LabelType
from deepdataspace.io.importer import FileImporter
from deepdataspace.utils.import_utils import import_from_path

logger = logging.getLogger("plugins.coco.importer")


class COCO2017Importer(FileImporter):
    """
    Importer for coco2017 dataset.
    """

    def __init__(self, meta_path: str, enforce: bool = False):
        """
        :param meta_path: path to meta file of coco2017 dataset, in a format of python script.
        :param enforce: if True, the importer will re-import the dataset even if it is already imported.
        """

        self.meta_path = os.path.abspath(meta_path)
        info = self.parse_meta(meta_path)
        dataset_name = info["dataset_name"]
        self.ground_truth = info["ground_truth"]
        self.image_root = info["image_root"]
        self.predictions = info["predictions"]

        super(COCO2017Importer, self).__init__(meta_path, dataset_name, enforce=enforce)

        self.dataset.type = DatasetType.COCO2017
        self._images = {}  # {image_id: image}
        self._categories = {}  # {category_id: category}
        self._annotations = {}  # {image_id: [annotation...]}

    @staticmethod
    def _parse_meta(meta_path: str, rt):
        meta_path = os.path.abspath(meta_path)
        dir_path = os.path.dirname(meta_path)

        module = import_from_path(meta_path)
        if not getattr(module, "is_coco_meta", False):
            return None

        dataset_name = getattr(module, "dataset_name")
        assert isinstance(dataset_name, str)

        ground_truth = getattr(module, "ground_truth")
        ground_truth = os.path.abspath(os.path.join(dir_path, ground_truth))
        assert os.path.isfile(ground_truth) and os.path.exists(ground_truth)
        assert ground_truth.endswith(".json")

        predictions = getattr(module, "predictions", [])
        assert isinstance(predictions, list)
        for prediction in predictions:
            pred_name = prediction["name"]
            assert isinstance(pred_name, str)

            pred_file = prediction["file"]
            pred_file = os.path.abspath(os.path.join(dir_path, pred_file))
            assert os.path.isfile(pred_file) and os.path.exists(pred_file)
            assert pred_file.endswith(".json")
            prediction["file"] = pred_file

        image_root = getattr(module, "image_root", None)
        if image_root is not None:
            image_root = os.path.abspath(os.path.join(dir_path, image_root))
            assert os.path.isdir(image_root) and os.path.exists(image_root)

        info = {
            "dataset_name": dataset_name,
            "ground_truth": ground_truth,
            "predictions": predictions,
            "image_root": image_root
        }

        rt.value = info

    @staticmethod
    def parse_meta(meta_path: str):
        rt = Manager().Value("i", None)
        procs = Process(target=COCO2017Importer._parse_meta, args=(meta_path, rt))
        procs.start()
        procs.join()

        info = rt.value
        return info

    def load_ground_truth(self):
        with open(self.ground_truth, "r", encoding="utf8") as fp:
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

            uri = None

            # trying to find the image file in local file system
            if self.image_root and coco_image_data.get("file_name", None):
                image_path = coco_image_data.get("file_name", None)
                image_path = os.path.join(self.image_root, image_path)
                uri = f"file://{image_path}"

            # trying to find the image file in the original coco image urls
            if uri is None:
                uri = coco_image_data.get("coco_url", None)

            if uri is None:
                logger.warning(f"Cannot find image file for image {image_id}, skip it.")
                continue

            coco_image_data.pop("coco_url", None)
            coco_image_data.pop("file_name", None)

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
                keypoint_names = None
                keypoint_skeleton = None
                keypoint_colors = None
                keypoints = anno_data.pop("keypoints", None)
                if keypoints is not None:
                    keypoint_names = category.get("keypoints", None)
                    keypoint_skeleton = category.get("skeleton", None)
                    if keypoint_skeleton is not None:
                        keypoint_skeleton = [item for sublist in keypoint_skeleton for item in sublist]

                    keypoint_colors = category.get("keypoint_colors", None)
                    if keypoint_colors is not None:
                        keypoint_colors = [item for sublist in keypoint_colors for item in sublist]

                    if label_type == LabelType.GroundTruth:
                        length = len(keypoints) // 3
                        for idx in range(length):
                            idx *= 3
                            conf = 1.0
                            x, y, v = keypoints[idx], keypoints[idx + 1], keypoints[idx + 2]
                            keypoints.extend([float(x), float(y), int(v), conf])  # x, y, v, conf
                    elif label_type == LabelType.Prediction:
                        length = len(keypoints) // 4
                        for idx in range(length):
                            idx *= 4
                            x, y, v, conf = keypoints[idx], keypoints[idx + 1], keypoints[idx + 2], keypoints[idx + 3]
                            keypoints.extend([float(x), float(y), int(v), conf])  # x, y, v, conf

                # prepare is_group
                is_group = anno_data.pop("is_group", None)

                # prepare confidence
                conf = anno_data.pop("score", 1.0)
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
                                                   keypoints=keypoints,
                                                   keypoint_colors=keypoint_colors,
                                                   keypoint_skeleton=keypoint_skeleton,
                                                   keypoint_names=keypoint_names,
                                                   )
                anno_list.append(anno_data)
            yield image, anno_list

    @staticmethod
    def can_import(path: str):
        if os.path.isdir(path):
            return False

        if not path.endswith(".py"):
            return False

        try:
            assert COCO2017Importer.parse_meta(path) is not None
        except:
            return False
        else:
            return True

    def collect_files(self) -> dict:
        files = {LabelName.GroundTruth: self.ground_truth}

        for pred in self.predictions:
            pred_name = pred["name"]
            pred_file = pred["file"]
            files[f"PRED/{pred_name}"] = pred_file

        return files
