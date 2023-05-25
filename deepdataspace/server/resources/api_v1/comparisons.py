"""
deepdataspace.server.resources.api_v1.comparisons

The RESTful APIs of comparison of label set.
"""
import json

from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import LabelType
from deepdataspace.model import DataSet
from deepdataspace.model import Label
from deepdataspace.model.image import Image
from deepdataspace.server.resources.api_v1.images import concat_url
from deepdataspace.server.resources.common import Argument
from deepdataspace.server.resources.common import BaseAPIView
from deepdataspace.server.resources.common import format_response
from deepdataspace.server.resources.common import parse_arguments
from deepdataspace.server.resources.common import raise_exception


class ComparisonsView(BaseAPIView):
    """
    - GET /api/v1/comparisons
    """

    _precs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

    get_args = [
        Argument("dataset_id", str, Argument.QUERY, required=True),
        Argument("label_id", str, Argument.QUERY, required=False),
        Argument("precision", Argument.Choice(_precs, lambda x: round(float(x), 1)), Argument.QUERY, required=True),
        Argument("order_by", Argument.Choice(["fn", "fp"]), Argument.QUERY, required=False),
        Argument("display_category_id", str, Argument.QUERY, required=False),
        Argument("page_num", Argument.PositiveInt, Argument.QUERY, default=1),
        Argument("page_size", Argument.PositiveInt, Argument.QUERY, default=100)
    ]

    def _parse_args(self, request):
        args = parse_arguments(request, self.get_args)
        dataset_id, label_id, precision, order_by, display_category_id, page_num, page_size = args

        dataset = DataSet.find_one({"id": dataset_id})
        if dataset is None:
            raise_exception(404, f"'dataset[{dataset_id}] not found")

        if dataset.detail_status.get("FNFPCalculator") != DatasetStatus.Ready:
            raise_exception(404, f"dataset[{dataset_id}] is not calculated, try again later")

        label = Label.find_one({"id": label_id})
        if label is None:
            raise_exception(404, f"label[{label_id}] not found")
        threshold = None
        for thresh in label.compare_precisions:
            if precision == thresh["precision"]:
                threshold = thresh
                break
        if threshold is None:
            raise_exception(404, f"label[{label_id}] has no comparison data in precision of {precision}")

        return dataset_id, label_id, precision, order_by, display_category_id, page_num, page_size,

    def get(self, request):
        """
        Get the comparison result of a label and ground truth of a dataset.
        """

        dataset_id, label_id, precision, order_by, display_category_id, page_num, page_size = self._parse_args(request)

        precision_level = str(int(precision * 100))
        if display_category_id is not None:
            precision_key = f"compare_result.{precision_level}"
            filters = {"objects": {
                "$elemMatch": {
                    "category_id": display_category_id,
                    precision_key: {"$exists": True}}}
            }
        else:
            filters = {f"objects.compare_result.{precision_level}": {"$exists": True}}

        total = Image(dataset_id).count_num(filters)

        image_list = []
        offset = max(0, page_size * (page_num - 1))
        if offset > total:
            data = {
                "image_list": image_list,
                "page_size" : page_size,
                "page_num"  : page_num,
                "total"     : total
            }
            return format_response(data)

        # prepare includes
        includes = {"_id", "flag", "objects", "metadata", "idx", "url", "url_full_res",
                    "type", "width", "height", "num_fn", "num_fp", "num_fn_cat", "num_fp_cat"}
        includes = {i: 1 for i in includes}

        # prepare sort fields
        sort_fields = []
        if order_by is not None:
            if display_category_id is None:
                sort_key = f"num_{order_by}.{label_id}.{precision_level}"
            else:
                sort_key = f"num_{order_by}_cat.{label_id}.{display_category_id}.{precision_level}"
            sort_fields.append((sort_key, -1))
        sort_fields.append(("idx", 1))

        req_scheme = request.scheme
        req_host = request.META["HTTP_HOST"]
        req_prefix = f"{req_scheme}://{req_host}"

        for image in Image(dataset_id).find_many(filters, includes, sort_fields, offset, page_size, to_dict=True):
            objects = []
            for obj in image["objects"]:
                if obj["label_id"] != label_id and obj["label_type"] != LabelType.GroundTruth:
                    continue

                if obj.get("is_group", False) is True:
                    continue

                obj["source"] = obj["label_type"]  # TODO keep for compatibility, delete this in the future

                if "compare_result" in obj and precision_level in obj["compare_result"]:
                    compare_result = obj.pop("compare_result")
                    result = compare_result[precision_level]
                    obj["compare_result"] = result
                else:
                    obj["compare_result"] = None

                if obj.get("alpha", None):
                    obj["alpha"] = f"{req_prefix}{obj['alpha']}"

                alpha = obj.get("alpha", "")
                if alpha is None:
                    obj["alpha"] = ""
                elif not alpha.startswith("http"):
                    obj["alpha"] = f"{req_prefix}{alpha}"

                objects.append(obj)
            image["objects"] = objects

            if display_category_id is None:
                num_fp = image.pop("num_fp")[label_id].get(precision_level, 0)
                num_fn = image.pop("num_fn")[label_id].get(precision_level, 0)
                image.pop("num_fp_cat")
                image.pop("num_fn_cat")
            else:
                num_fp = image.pop("num_fp_cat").get(label_id, {}).get(display_category_id, {}).get(precision_level, 0)
                num_fn = image.pop("num_fn_cat").get(label_id, {}).get(display_category_id, {}).get(precision_level, 0)
            image["num_fp"] = num_fp
            image["num_fn"] = num_fn

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

            image_list.append(image)

        data = {
            "image_list": image_list,
            "page_size" : page_size,
            "page_num"  : page_num,
            "total"     : total
        }
        return format_response(data, enable_cache=True)
