"""
deepdataspace.model.object

The object model.
"""

from typing import Dict
from typing import List
from typing import Literal
from typing import Optional
from typing import Union

from deepdataspace import constants
from deepdataspace.model._base import BaseModel
from deepdataspace.utils.file import create_file_url


class Object(BaseModel):
    """
    Objects are predictions, ground truths, or user annotations of an image.
    It is not stored in mongodb collections directly, but saved as nested documents in the image document.

    Attributes:
    -----------
    label_name: str
        The label name.
    label_type: str
        Is it a prediction? a GroundTruth? or a user annotation?, see :class:`deepdataspace.constants.LabelType`.
    label_id: str
        The label id.
    category_id: str
        The category id.
    category_name: str
        The category name.
    conf: float
        The confidence of the prediction.
    is_group: bool
        Is it a group of objects?
    bounding_box: dict
        The bounding box of the object, {"xmin": 0, "ymin": 0, "xmax": 0, "ymax": 0}.
    segmentation: str
        The segmentation of the object.
    alpha: str
        The alpha of the object.
    points: list
        The points of the object.
    lines: list
        The lines of the object.
    point_colors: list
        The point colors of the object.
    point_names: list
        The point names of the object.
    confirm_type: int
        The image confirm type, 0 for unconfirmed, 1 for confirmed, 2 for rejected.
    compare_result: dict
        The compare result of the object, {"90": "FP", ..., "10": "OK"}.
    matched_det_idx: int
        The matched ground truth index, for prediction objects only.
    """

    @classmethod
    def get_collection(cls, *args, **kwargs):
        """
        Objects are stored directly inside the image document.
        """
        return None

    # the mandatory fields
    # every object must belong to a label set
    label_name: str
    label_type: str

    # the optional fields
    label_id: str = ""
    category_id: str = ""
    category_name: str = ""
    conf: Union[float, int] = 1.0
    is_group: Optional[bool] = False
    bounding_box: Optional[Dict[str, Union[float, int]]] = {}
    segmentation: Optional[str] = ""
    alpha: Optional[str] = ""
    points: Optional[List[Union[float, int]]] = []
    lines: Optional[List[int]] = []
    point_colors: Optional[List[str]] = []
    point_names: Optional[List[str]] = []
    confirm_type: Optional[int] = 0  # the image confirm type, 0 no confirm required, 1 gt may be fn, 2 pred may be fp
    compare_result: Optional[Dict[str, str]] = {}  # {"90": "FP", ..., "10": "OK"}
    matched_det_idx: Optional[int] = None  # The matched ground truth index, for prediction objects only.

    @staticmethod
    def _convert_file_path_to_url(file_uri: str):
        """
        Convert a local file path to a visible file url.
        """

        file_path = file_uri[7:]
        file_url = create_file_url(file_path=file_path,
                                   read_mode=constants.FileReadMode.Binary)
        return file_url

    def post_init(self):
        """
        Override the post_init method to convert the alpha file path to url.
        """

        if self.alpha and self.alpha.startswith("file://"):
            self.alpha = self._convert_file_path_to_url(self.alpha)
