"""
deepdataspace.model.category

The category model.
"""

from deepdataspace.model._base import BaseModel


class Category(BaseModel):
    """
    Category, or Class in some context, is the classification of objects in an image.
    """

    @classmethod
    def get_collection(cls):
        return cls.db["categories"]

    # the mandatory fields
    name: str  # the label name

    # the optional fields
    id: str = ""  # category id
    name: str = ""  # category name
    dataset_id: str = ""  # which dateset this category belongs to
