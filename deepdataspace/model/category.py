"""
deepdataspace.model.category

The category model.
"""

from deepdataspace.model._base import BaseModel


class Category(BaseModel):
    """
    Category, or Class in some context, is the classification of objects in an image.
    
    Attributes:
    -----------
    name: str
       The category name.
    id: str
       The category id.
    dataset_id: str
       The dataset id this category belongs to.
    """

    @classmethod
    def get_collection(cls):
        """
        Categories are stored in the "categories" collection.
        """
        return cls.db["categories"]

    # the mandatory fields
    name: str  # the category name
    id: str  # category id
    dataset_id: str  # which dateset this category belongs to
