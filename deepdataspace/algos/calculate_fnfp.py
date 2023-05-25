"""
deepdataspace.algos.calculate_fnfp

Compare predictions to ground truths, found the FPs and FNs.
"""

from typing import Dict
from typing import List
from typing import Tuple

import numpy as np


def calculate_iou(all_gt: np.ndarray, all_det: np.ndarray) -> np.ndarray:
    """
    For every ground truth, calculate it's iou to every prediction.

    :param all_gt: (np.ndarray) Shape (G, 4), 4 present [x1, y1, x2, y2]
    :param all_det: (np.ndarray) Shape (D, 4), 4 present [x1, y1, x2, y2]
    :return iou: (np.ndarray) Shape (G, D)
    """

    all_gt = all_gt[:, np.newaxis, :]
    xmin = np.maximum(all_gt[:, :, 0], all_det[:, 0])
    ymin = np.maximum(all_gt[:, :, 1], all_det[:, 1])
    xmax = np.minimum(all_gt[:, :, 2], all_det[:, 2])
    ymax = np.minimum(all_gt[:, :, 3], all_det[:, 3])
    intersection = np.maximum(0, xmax - xmin) * np.maximum(0, ymax - ymin)
    union = (all_gt[:, :, 2] - all_gt[:, :, 0]) * (all_gt[:, :, 3] - all_gt[:, :, 1]) \
            + (all_det[:, 2] - all_det[:, 0]) * (all_det[:, 3] - all_det[:, 1]) \
            - intersection
    return intersection / union


def calculate_thresholds(all_gt: List[List],
                         all_det: List[List],
                         iou_thresh: float = 0.5) -> List[Dict[str, float]]:
    """
    For given IoU thresh, calculate confidence thresh for precisions from 0.0 to 1.0 .

    :param all_gt: All ground truth objects from a subset
                  [image_id(str), category_id(int), bbox(List[int])], bbox = [x1, y1, x2, y2]
    :param all_det: All prediction objects from a subset
                  [image_id(str), category_id(int), bbox(List[int]), conf(float)], bbox = [x1, y1, x2, y2]
    :param iou_thresh: IoU threshold
    :return [
                {"conf_thresh": xxx, "recall": xxx, "precision": xxx, "precision_thresh": xxx}
            ]
    """

    # sort det by conf in descending order
    all_det = sorted(all_det, key=lambda x: -x[-1])

    # transform gt
    imgid2gt = {}  # {"$img_id": {"category": [int(x), ], "bbox":[[x1, y1, x2, y2], ]}, }
    for gt in all_gt:
        img_id = gt[0]
        img = imgid2gt.setdefault(img_id, {"category": [], "bbox": []})
        img["category"].append(gt[1])
        img["bbox"].append(gt[2])

    for img in imgid2gt.values():  # transform list to np array
        img["category"] = np.array(img["category"])
        img["bbox"] = np.array(img["bbox"])

    # transform det
    imgid2det = {}  # {"$img_id": {"category": [int(x), ], "bbox":[[x1, y1, x2, y2],], "conf":[float(x)]}, }
    for det in all_det:
        img_id = det[0]
        img = imgid2det.setdefault(img_id, {"category": [], "bbox": [], "conf": [], })
        img["category"].append(det[1])
        img["bbox"].append(det[2])
        img["conf"].append(det[3])

    for img in imgid2det.values():  # transform list to np array
        img["category"] = np.array(img["category"])
        img["bbox"] = np.array(img["bbox"])
        img["conf"] = np.array(img["conf"])

    # calculate iou
    imgid2iou = {}
    for imgid in imgid2gt:
        bbox_gt = imgid2gt[imgid]["bbox"]
        if imgid in imgid2det:
            bbox_det = imgid2det[imgid]["bbox"]
        else:
            bbox_det = np.zeros((0, 4), dtype=np.float32)

        iou = calculate_iou(bbox_gt, bbox_det)
        imgid2iou[imgid] = iou

    # store current position idx of each image_id
    imgid2idx = {k: 0 for k in imgid2det}

    # calculate thresholds, recall, precision
    correct = []
    for det in all_det:
        imgid = det[0]
        if imgid not in imgid2iou:  # detection not in ground truth, it is an FN
            correct.append(0)
            continue

        idx = imgid2idx[imgid]
        category_id = det[1]

        iou = imgid2iou[imgid]  # G * D
        gt_idx_of_cat = np.where(imgid2gt[imgid]["category"] == category_id)[0]  # N * 1
        iou_of_cat = iou[gt_idx_of_cat]  # N * D
        if iou_of_cat.shape[0] == 0:
            correct.append(0)
        else:
            gt_idx_of_max_iou = iou_of_cat[:, idx].argmax()
            max_iou = iou_of_cat[gt_idx_of_max_iou][idx]
            if max_iou >= iou_thresh:
                correct.append(1)
                gt_idx_of_all_cat = gt_idx_of_cat[gt_idx_of_max_iou]
                imgid2iou[imgid][gt_idx_of_all_cat, :] = -1
            else:
                correct.append(0)
        imgid2idx[imgid] = idx + 1

    num_det = 0
    num_correct = 0
    num_gt = sum([img["bbox"].shape[0] for img in imgid2gt.values()])

    recalls = []
    precisions = []
    for c in correct:
        num_det += 1
        num_correct += c
        precisions.append(num_correct * 1.0 / num_det)
        recalls.append(num_correct * 1.0 / num_gt)

    for i in range(len(precisions) - 2, -1, -1):
        precisions[i] = max(precisions[i], precisions[i + 1])

    results = [
        {"conf_thresh": -1, "recall": -1, "precision": -1, "precision_thresh": round(i * 0.1, 1)}
        for i in range(11)  # 0.0 ~ 1.0
    ]

    all_det_conf = [det[3] for det in all_det]
    for i in range(len(precisions) - 1, -1, -1):
        precision = precisions[i]
        recall = recalls[i]
        conf = all_det_conf[i]
        update_idx = int(precision / 0.1)
        if results[update_idx]["conf_thresh"] == -1:
            results[update_idx]["conf_thresh"] = conf
            results[update_idx]["precision"] = precision
            results[update_idx]["recall"] = recall

    return results


def calculate_fnfp(all_gt: List[List],
                   all_det: List[List],
                   iou_thresh: float = 0.5) -> Tuple[List[int], List[int]]:
    """
    For given IoU thresh, check the correctness of all predictions in an image.

    :param all_gt: All ground truth objects from a subset
                  [category_id(int), bbox(List[int])], bbox = [x1, y1, x2, y2]
    :param all_det: All prediction objects from a subset
                  [category_id(int), bbox(List[int]), conf(float)], bbox = [x1, y1, x2, y2]
    :param iou_thresh: IoU threshold
    :return (gt_results, det_results)
            gt_results, list, -1 means FN, otherwise means matched det id
            det_results, list, 1 means TP, 0 means FP
    """

    gt_arr = np.array(all_gt[:], dtype=np.float32)
    det_arr = np.array(all_det[:], dtype=np.float32)

    gt_results = [-1] * gt_arr.shape[0]
    det_results = [0] * det_arr.shape[0]
    if gt_arr.shape[0] == 0 or det_arr.shape[0] == 0:
        return gt_results, det_results

    categories = set(det_arr[:, 0].astype(np.int32).tolist())
    for category_id in categories:
        gt_idx_of_cat = np.where(gt_arr[:, 0] == category_id)[0]
        gt_of_cat = gt_arr[gt_idx_of_cat]

        det_idx_of_cat = np.where(det_arr[:, 0] == category_id)[0]
        det_of_cat = det_arr[det_idx_of_cat]

        if gt_of_cat.shape[0] == 0:
            continue
        if det_of_cat.shape[0] == 0:
            continue

        iou = calculate_iou(gt_of_cat[:, 1:5], det_of_cat[:, 1:5])
        det_idx_sorted = (-det_of_cat[:, 5]).argsort()  # sort by confidence

        for i in range(det_of_cat.shape[0]):
            det_idx = det_idx_sorted[i]
            gt_idx_of_max_iou = iou[:, det_idx].argmax()
            if iou[gt_idx_of_max_iou, det_idx] >= iou_thresh:
                det_idx_of_all_cat = det_idx_of_cat[det_idx]
                det_results[det_idx_of_all_cat] = 1

                gt_idx_of_all_cat = gt_idx_of_cat[gt_idx_of_max_iou]
                gt_results[gt_idx_of_all_cat] = det_idx_of_all_cat

                iou[gt_idx_of_max_iou, :] = -1

    return gt_results, det_results
