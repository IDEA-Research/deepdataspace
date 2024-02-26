"""
deepdataspace.server.resources.api_v1.images

RESTful API for images.
"""

import json
import logging

from deepdataspace.constants import DatasetFileType
from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import ErrCode
from deepdataspace.constants import LabelType
from deepdataspace.model import DataSet
from deepdataspace.model.image import Image
from deepdataspace.plugins.coco2017 import COCO2017Importer
from deepdataspace.utils.http import Argument
from deepdataspace.utils.http import BaseAPIView
from deepdataspace.utils.http import format_response
from deepdataspace.utils.http import parse_arguments
from deepdataspace.utils.http import raise_exception
from deepdataspace.constants import DatasetType

logger = logging.getLogger("django")


def concat_url(prefix, path):
    if path.startswith("http://") or path.startswith("https://"):
        return path
    if path.startswith("/"):
        return f"{prefix}{path}"
    return f"{prefix}/{path}"


def get_meta_module(dataset):
    is_coco_dataset = dataset.type == DatasetType.COCO2017
    if not is_coco_dataset:
        return None

    meta_file = dataset.files.get(DatasetFileType.Meta, None)
    if meta_file is None:
        return None

    try:
        meta_module = COCO2017Importer.parse_meta(meta_file)
    except Exception as err:
        logger.error(f"parse meta file[{meta_file}] failed: {err}")
    else:
        return meta_module


def get_caption_func(dataset):
    meta_module = get_meta_module(dataset)
    if meta_module is None:
        return None

    if meta_module["dynamic_caption"]:
        return meta_module["caption_generator"]
    return None


class ImagesView(BaseAPIView):
    """
    - GET /api/v1/images
    """

    get_args = [
        Argument("dataset_id", str, Argument.QUERY, required=True),
        Argument("category_id", str, Argument.QUERY, required=False),
        Argument("flag", int, Argument.QUERY, required=False),
        Argument("label_id", str, Argument.QUERY, required=False),
        Argument("page_num", Argument.PositiveInt, Argument.QUERY, default=1),
        Argument("page_size", Argument.PositiveInt, Argument.QUERY, default=100)
    ]

    def get(self, request):
        """
        Query all images of a dataset.
        - GET /api/v1/images
        """

        dataset_id, category_id, flag, label_id, page_num, page_size = parse_arguments(request, self.get_args)

        dataset = DataSet.find_one({"_id": dataset_id})
        if dataset is None:
            raise_exception(ErrCode.DatasetNotFound, f"dataset_id[{dataset_id}] not found")
        if dataset.status in DatasetStatus.DontRead_:
            raise_exception(ErrCode.DatasetNotReadable,
                            f"dataset_id[{dataset_id}] is in status [{dataset.status}] now, try again later")

        caption_generator = get_caption_func(dataset)

        filters = {}
        if category_id is not None:
            filters = {"objects": {
                "$elemMatch": {
                    "category_id": category_id,
                    "label_type" : {"$in": [LabelType.User, LabelType.GroundTruth]}}}
            }

        if flag is not None:
            filters["flag"] = flag

        total = Image(dataset_id).count_num(filters)

        image_list = []
        offset = max(0, page_size * (page_num - 1))

        includes = {"id", "idx", "flag", "objects", "metadata", "type", "width", "height", "url",
                    "url_full_res"}
        includes = {i: 1 for i in includes}

        req_scheme = request.scheme
        req_host = request.META["HTTP_HOST"]
        req_prefix = f"{req_scheme}://{req_host}"

        if offset <= total:
            for image in Image(dataset_id).find_many(filters, includes,
                                                     sort=[("idx", 1)],
                                                     skip=offset,
                                                     size=page_size,
                                                     to_dict=True):
                for obj in image["objects"]:
                    obj["source"] = obj["label_type"]  # TODO keep for compatibility, delete this in the future

                    alpha = obj.get("alpha", "")
                    if alpha is None:
                        obj["alpha"] = ""
                    elif not alpha.startswith("http"):
                        obj["alpha"] = f"{req_prefix}{alpha}"

                    if obj["segmentation"] is None:
                        obj["segmentation"] = ""

                    obj["caption"] = obj["caption"] or ""

                    obj.pop("compare_result", None)

                image_url = image["url"]
                image_url = concat_url(req_prefix, image_url)

                image_url_full_res = image["url_full_res"] or image_url
                image_url_full_res = concat_url(req_prefix, image_url_full_res)

                desc = image.pop("metadata") or "{}"

                image.update({
                    "desc"        : desc,
                    "metadata"    : json.loads(desc),
                    "url"         : image_url,
                    "url_full_res": image_url_full_res
                })

                image["caption"] = ""
                if caption_generator:
                    image["caption"] = caption_generator(image)

                image_list.append(image)

        data = {
            "image_list": image_list,
            "page_size" : page_size,
            "page_num"  : page_num,
            "total"     : total
        }
        return format_response(data, enable_cache=True)
