"""
deepdataspace.task

The celery task module.
"""

import logging
import os
import traceback
from logging import StreamHandler

from celery.signals import after_setup_logger
from celery.signals import worker_ready

from deepdataspace import environs
from deepdataspace.model.dataset import DataSet
from deepdataspace.model.dataset import DatasetStatus
from deepdataspace.model.image import Image
from deepdataspace.task.celery import app
from deepdataspace.task.celery import app
from deepdataspace.task.ping import ping

logger = logging.getLogger("celery")


@after_setup_logger.connect
def logger_setup_handler(logger, **kwargs):
    if environs.VERBOSE:
        handler = StreamHandler()
        handler.setLevel(logging.INFO)
        fmt = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
        formatter = logging.Formatter(fmt)
        handler.setFormatter(formatter)
        logger.addHandler(handler)


@app.task
def import_and_process_dataset(dataset_dir: str, enforce: bool = False, auto_triggered: bool = False):
    from deepdataspace.model.dataset import DataSet
    from deepdataspace.task.import_dataset import import_dataset
    from deepdataspace.task.process_dataset import process_dataset

    logger.info(f"import_and_process_dataset starts, dataset_dir={dataset_dir}, enforce={enforce}")
    result = import_dataset(dataset_dir, enforce)
    if isinstance(result, list):
        for dataset in result:
            process_dataset(dataset.path, enforce, auto_triggered=auto_triggered)
    elif isinstance(result, DataSet):
        dataset = result
        process_dataset(dataset.path, enforce, auto_triggered=auto_triggered)
    return result


@app.task
def import_and_process_data_dir(data_dir: str, enforce: bool = False, auto_triggered: bool = False):
    """
    Import and process all datasets inside directory.
    :param data_dir: the containing directory of all datasets.
    :param enforce: import and process all datasets, even if they are imported/processed before.
    :param auto_triggered: is this function called automatically on program start up?
    """

    logger.info(f"import_and_check_data_dir starts, data_dir={data_dir}")

    data_dir = os.path.abspath(data_dir)
    for item in os.listdir(data_dir):
        target_path = os.path.join(data_dir, item)

        try:
            import_and_process_dataset(target_path, enforce, auto_triggered)
        except Exception as err:
            tb_list = traceback.format_tb(err.__traceback__)
            errors = "".join(tb_list)
            logger.error(errors)
            logger.error(str(err))


@app.task
def create_dataset_index():
    """
    Create index for all datasets.
    """

    logger.info(f"create_dataset_index starts")

    total = DataSet.count_num({})
    datasets = DataSet.find_many({})
    for idx, dataset in enumerate(datasets):
        logger.info(f"[{idx + 1}/{total}] creating index for dataset {dataset.id}")
        if dataset.status != DatasetStatus.Ready:
            logger.info(f"dataset status is not {DatasetStatus.Ready}, skip it")
        else:
            ImageModel = Image(dataset.id)
            ImageModel.get_collection().create_index([
                ("objects.category_id", 1),
            ])
            logger.info(f"dataset created index on field: objects.category_id")

            ImageModel.get_collection().create_index([
                ("idx", 1)
            ])
            logger.info(f"dataset created index on field: idx")


@worker_ready.connect
def startup_jobs(sender=None, headers=None, body=None, **kwargs):
    # ensure necessary indices
    create_dataset_index.apply_async()

    # import all datasets
    data_dir = environs.DATASET_DIR
    import_and_process_data_dir.apply_async(args=(data_dir, False, True))
