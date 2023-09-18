"""
This file is a coco meta file, which is used to describe the basic information of a coco dataset.
Put it under the DATA_DIR directory specified when starting DDS, DDS will automatically scan this meta file
and import the dataset.
You can also use the ddsop command to import or delete the dataset:
```shell
ddsop import_one /path/to/this/meta/file.py
ddsop delete_one /path/to/this/meta/file.py
```
"""

is_coco_meta = True  # Mandatory.
# You MUST declare this variable in a coco meta file, otherwise DDS will ignore it.

dataset_name = "instances_val2017"  # Mandatory.
# The name of the dataset.

ground_truth = "annotations/instances_val2017.json"  # Mandatory.
# The ground truth file path, relative to the directory of this meta file.

predictions = [
    {
        "name": "pred1",  # Mandatory.
        # The name of the prediction set.

        "file": "pred1.json"  # Mandatory.
        # The prediction file path, relative to the directory of this meta file.
    }
]  # Optional.
# The prediction sets of this dataset.
# If you don't have any prediction set for this dataset, you can leave it out or set it to None/[].
# Otherwise, it must be a list of dict, each dict must contain a "name" and a "file" key.

image_root = None  # Optional.
# The DDS will try to locate the image file under this directory, according to the "file_name" field.

dynamic_caption = False  # Optional.
# Indicating whether the caption is dynamic or not.
# If it is True, DDS will call the `caption_generator` function to generate the caption for every image
# while your are browsing the dataset.


def caption_generator(image, objects):
    """
    This function is used to generate a caption for an image dynamically while browsing the dataset.
    It only works when `dynamic_caption = True` in this meta file.

    :param image: The image object.
    :param objects: The objects in the image.
    """
    return image["caption"]
