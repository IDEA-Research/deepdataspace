"""
deepdataspace.process.calculate_fnfp

This module defines the processor for calculating false negative and false positive analytics for dataset.
"""

import logging
from typing import Dict
from typing import List

from deepdataspace.algos import calculate_fnfp
from deepdataspace.constants import AnnotationType
from deepdataspace.constants import LabelCompareResult
from deepdataspace.constants import LabelType
from deepdataspace.model.image import Image
from deepdataspace.model.label import Label
from deepdataspace.process.processor import BaseProcessor

logger = logging.getLogger("process.calculate_fnfp")


class FNFPCalculator(BaseProcessor):
    """
    This processor calculates false negative and false positive analytics for dataset.
    """

    @classmethod
    def dependencies(cls) -> List[str]:
        """
        This processor depends on nothing.
        """

        return []

    @classmethod
    def should_auto_run(cls) -> bool:
        """
        This processor should run automatically on program start-up.
        """

        return True

    def can_process(self):
        """
        This processor can process any dataset.
        """

        return True

    @staticmethod
    def calculate_detection_thresh(dataset_id: str):
        """
        For each label set,
        """

        logger.info(f"calculate_detection_thresh for dataset[{dataset_id}] starts")

        # prepare data for calculation
        all_gt = []
        all_det = {}
        all_cat = {}
        images = Image(dataset_id).find_many({})
        for image_idx, image in enumerate(images):

            image_width = image.width
            image_height = image.height

            for obj in image.objects:
                if not obj.bounding_box:
                    continue

                if obj.is_group is True:
                    continue

                bbox = obj.bounding_box
                x1, y1, x2, y2 = bbox["xmin"], bbox["ymin"], bbox["xmax"], bbox["ymax"]
                x1, x2 = x1 * image_width, x2 * image_width
                y1, y2 = y1 * image_height, y2 * image_height
                bbox = [x1, y1, x2, y2]
                cat_id = obj.category_id
                cat_id = all_cat.setdefault(cat_id, len(all_cat))
                label_id = obj.label_id

                if obj.label_type == LabelType.GroundTruth:
                    gt = [image_idx, cat_id, bbox]
                    all_gt.append(gt)
                elif obj.label_type == LabelType.Prediction:
                    conf = obj.conf
                    det = [image_idx, cat_id, bbox, conf, ]
                    label_all_det = all_det.setdefault(label_id, [])
                    label_all_det.append(det)
        logger.info(f"calculate_detection_thresh prepare data done")

        # calculate thresholds for every label set
        all_thresholds = {}
        for label_id, label_all_det in all_det.items():
            thresholds = calculate_fnfp.calculate_thresholds(all_gt, label_all_det)
            thresholds.sort(key=lambda x: x["precision_thresh"], reverse=True)
            thresholds = [
                {
                    "precision": t["precision_thresh"],
                    "threshold": t["conf_thresh"],
                    "recall"   : t["recall"]
                }
                for t in thresholds if t["precision_thresh"] != 0.0 and t["precision_thresh"] != 1.0
            ]
            all_thresholds[label_id] = thresholds

            set_data = {"compare_precisions": thresholds}
            Label.update_one({"id": label_id}, set_data)

            logger.info(f"updated compare_precisions of label[{label_id}] to {thresholds}")
        return all_thresholds

    @staticmethod
    def calculate_detection_result(dataset_id: str, label_id: str, thresholds: List[Dict]):
        """
        For given label set, calculate fn/fp analytics for each image with given precision thresholds.
        """

        logger.info(f"calculate_detection_result starts, label_id={label_id}")

        category_id_map = {}
        images = Image(dataset_id).find_many({})

        for image in images:
            image_width = image.width
            image_height = image.height

            # prepare all ground truth and detection for this image
            all_gt = []
            all_det = []
            gt_io_map = []
            det_io_map = []
            for idx, obj in enumerate(image.objects):
                if obj.bounding_box is None:  # skip object without bounding box
                    continue

                if obj.is_group is True:  # skip group object
                    continue

                bbox = obj.bounding_box
                x1, y1, x2, y2 = bbox["xmin"], bbox["ymin"], bbox["xmax"], bbox["ymax"]
                x1, x2 = x1 * image_width, x2 * image_width
                y1, y2 = y1 * image_height, y2 * image_height
                bbox = [x1, y1, x2, y2]
                cat_id = obj.category_id
                cat_id = category_id_map.setdefault(cat_id, len(category_id_map))

                if obj.label_type == LabelType.GroundTruth:
                    gt = [cat_id, *bbox]
                    all_gt.append(gt)
                    gt_io_map.append(idx)
                elif obj.label_type == LabelType.Prediction:
                    if obj.label_id != label_id:
                        continue
                    det = [cat_id, *bbox, obj.conf, ]
                    all_det.append(det)
                    det_io_map.append(idx)

            # calculate fn/fp
            gt_results, det_results = calculate_fnfp.calculate_fnfp(all_gt, all_det)

            # save the result in database for further query
            for threshold in thresholds:
                conf_thresh = threshold["threshold"]
                precision_thresh = str(int(threshold["precision"] * 100))  # key 不能有点(.)

                gt_valids = []
                det_valids = []

                det_idx_valids = {}
                for idx, det in enumerate(all_det):
                    if det[5] >= conf_thresh:
                        det_valids.append(det_results[idx])
                        det_idx_valids[idx] = True

                for gt_matched_det_idx in gt_results:
                    if det_idx_valids.get(gt_matched_det_idx, False) is True:
                        gt_valids.append(1)
                    else:
                        gt_valids.append(0)

                num_fn = len(gt_valids) - sum(gt_valids)
                num_fp = len(det_valids) - sum(det_valids)

                image.num_fn.setdefault(label_id, {})[precision_thresh] = num_fn
                image.num_fp.setdefault(label_id, {})[precision_thresh] = num_fp

                for idx, (gt_valid, gt_result) in enumerate(zip(gt_valids, gt_results)):
                    idx = gt_io_map[idx]
                    obj = image.objects[idx]
                    if gt_valid == 1:
                        compare_result = LabelCompareResult.OK
                    else:
                        compare_result = LabelCompareResult.FalseNegative

                        cat_id = obj.category_id
                        counter = image.num_fn_cat.setdefault(label_id, {}).setdefault(cat_id, {})
                        counter.setdefault(precision_thresh, 0)
                        counter[precision_thresh] += 1

                    obj.compare_result[precision_thresh] = compare_result
                    obj.matched_det_idx = int(gt_result)

                for idx, det_result in enumerate(det_results):
                    idx = det_io_map[idx]
                    obj = image.objects[idx]

                    if det_result == 1:
                        compare_result = LabelCompareResult.OK
                    else:
                        compare_result = LabelCompareResult.FalsePositive

                        cat_id = obj.category_id
                        counter = image.num_fp_cat.setdefault(label_id, {}).setdefault(cat_id, {})
                        counter.setdefault(precision_thresh, 0)
                        counter[precision_thresh] += 1

                    obj.compare_result[precision_thresh] = compare_result
                    obj.matched_det_idx = None

            image.save()
            logger.debug(f"updated num_fp of image[{image.id}] of label[{label_id}] to {image.num_fp}")
            logger.debug(f"updated num_fn of image[{image.id}] of label[{label_id}] to {image.num_fn}")

    def process_dataset(self):
        """
        The major steps of calculate fnfp for the dataset.
        """

        dataset = self.dataset
        logger.info(f"process_dataset starts, dataset_id={dataset.id}, dataset_name={dataset.name}")

        # skip task if no detection is found
        obj_types = dataset.object_types
        if AnnotationType.Detection not in obj_types:
            msg = f"dataset[{dataset.name}].object_types={obj_types}, no {AnnotationType.Detection}, skip task..."
            logger.info(msg)
            return

        # calculate detection thresholds for every label set
        all_thresholds = self.calculate_detection_thresh(dataset.id)

        # for each label set,
        for label_id, label_thresholds in all_thresholds.items():
            self.calculate_detection_result(dataset.id, label_id, label_thresholds)
