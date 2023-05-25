"""
deepdataspace.task.import_dataset

Tasks about importing datasets.
"""

import logging

from deepdataspace.io import import_dataset as imp_ds
from deepdataspace.task.celery import app

logger = logging.getLogger("celery")


@app.task
def import_dataset(target_path: str, enforce: bool = False):
    """
    Import all datasets under target path.
    """

    logger.info(f"import_dataset starts, target_path={target_path}, enforce={enforce}")
    return imp_ds(target_path, enforce)
