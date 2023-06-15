"""
Add cover to every dataset.
"""

import logging
import os

from deepdataspace.model import DataSet

logger = logging.getLogger("scripts.migrate")


def add_covers():
    num = DataSet.count_num({})
    logger.info(f"Adding covers to {num} dataset(s)...")

    datasets = DataSet.find_many({})
    for idx, dataset in enumerate(datasets):
        dataset._add_cover(force_update=True)
        logger.info(f"[{idx + 1}/{num}]Added cover to dataset[{dataset.id}], cover_url={dataset.cover_url}")

    logger.info("Finished adding covers")


def run():
    add_covers()
