"""
This file is a coco meta file instructing DDS how to import a coco dataset.
Put it under the DATA_DIR directory specified when starting DDS, DDS will recognize file and import the dataset.
You can also use the ddsop command to import or delete the dataset:
```shell
ddsop import_one /path/to/this/meta/file.py
ddsop delete_one /path/to/this/meta/file.py
```
"""

is_coco_meta = True  # Mandatory.
# You must declare this variable, otherwise DDS will ignore it.

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
# while you are browsing the dataset.


def caption_generator(image):
    """
    This function is used to generate a caption for an image dynamically while browsing the dataset.
    It only works when `dynamic_caption = True` in this meta file.

    :param image: The image object.

    ```json
    {
      "idx": 0,
      "id": 179765,
      "width": 640,
      "height": 480,
      "objects": [
        {
          "label_name": "GroundTruth",
          "label_id": "aa",
          "category_id": "bb",
          "category_name": "",
          "conf": 1.0,
          "is_group": null,
          "bounding_box": {
            "xmin": 0.0,
            "ymin": 0.0,
            "xmax": 1.0,
            "ymax": 1.0
          },
          "segmentation": "",
          "points": [x1, y1, x2, y2, x3, y3...],
          "lines": [l1_beg, l1_end, l2_beg, l2_end, l3_beg, l3_end...],
          "point_colors": [r1, g1, b1, r2, b2, g2, r3, g3, b3...],
          "point_names": ["point1", "point2", "point3"...],
          "caption": "A black Honda motorcycle parked in front of a garage."
        }
      ],
      "url": "https://example.com/thumb.jpg",
      "url_full_res": "https://example.com/picture.jpg",
      "desc": "image description",
      "metadata": {
        "license": 3,
        "date_captured": "2013-11-15 14:02:51",
        "flickr_url": "http://farm3.staticflickr.com/2824/10213933686_6936eb402b_z.jpg",
        "id": 179765
      }
    }
    ```
    """
    objects = image["objects"]
    if objects:
        return objects[0]["caption"]
    return "dynamic caption is working"
