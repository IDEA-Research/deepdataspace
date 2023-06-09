"""
Add image dirs to whitelist so that they can be accessed from the web API.
"""

import logging
import os

from deepdataspace.constants import RedisKey
from deepdataspace.globals import Redis
from deepdataspace.model import DataSet
from deepdataspace.model import Image

logger = logging.getLogger("scripts.migrate")


def get_image_dirs():
    image_dirs = set()
    filters = {"url": {"$regex": "^/files/local_files"}}
    for dataset in DataSet.find_many({}):
        ImageModel = Image(dataset.id)
        for image in ImageModel.find_many(filters):
            image_path = image.url.split("/")
            image_path = "/".join(image_path[7:])
            image_dir = os.path.dirname(image_path)
            image_dirs.add(image_dir)

    return image_dirs


def add_to_whitelist(image_dirs):
    for image_dir in image_dirs:
        if not Redis.sismember(RedisKey.DatasetImageDirs, image_dir):
            logger.info(f"Adding image dir to whitelist: {image_dir}")
            Redis.sadd(RedisKey.DatasetImageDirs, image_dir)


def add_image_dirs_to_whitelist():
    image_dirs = get_image_dirs()
    add_to_whitelist(image_dirs)


def run():
    add_image_dirs_to_whitelist()
