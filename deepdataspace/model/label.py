"""
deepdataspace.model.label

The label model.
"""

from typing import List

from deepdataspace.model._base import BaseModel


class Label(BaseModel):
    """
    | Label, or Label Set, or Prediction Set, is a set of predictions made to images of a dataset at the same time.
    | GroundTruth and UserAnnotation are special label sets.

    Attributes:
    -----------
    name: str
         The label name.
    id: str
        The label id.
    type: str
        Is it a prediction? a GroundTruth? or a user annotation?, see :class:`deepdataspace.constants.LabelType`.
    dataset_id: str
        The dataset id this label belongs to.
    compare_precisions: list
        Pre-calculated thresh conf for comparing prediction to gt.
    clone_from_label: str
        Which label set this label is cloned from.
    """

    @classmethod
    def get_collection(cls, *args, **kwargs):
        return cls.db["labels"]

    # the mandatory fields
    name: str  # the label name

    # the optional fields
    id: str = ""  # the label id
    type: str = ""  # is it a prediction? a GroundTruth? or a user annotation?
    dataset_id: str = ""  # which dataset this label belongs to
    compare_precisions: List = []  # pre-calculated thresh conf for comparing prediction to gt
    clone_from_label: str = ""  # which label set this label is cloned from
