"""
deepdataspace.task.process_dataset

Task for processing datasets.
"""

import logging

from deepdataspace.process import process_dataset as prc_ds
from deepdataspace.task.celery import app

logger = logging.getLogger("celery")


@app.task
def process_dataset(dataset_dir: str, enforce: bool = False, auto_triggered: bool = False):
    """
    Process a dataset by all registered processors.
    """

    logger.info(f"import_dataset starts, dataset_dir={dataset_dir}, enforce={enforce}")
    return prc_ds(dataset_dir, enforce, auto_triggered=auto_triggered)
