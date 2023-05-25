"""
deepdataspace.process.processor

The common interface of processing a dataset.
"""

import abc
import json
import logging
import os
import time
import traceback
from contextlib import contextmanager
from typing import Any
from typing import Dict
from typing import List
from typing import Union

from deepdataspace.algos.graph import DirectedSymbolGraph
from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import TaskStatus
from deepdataspace.model.dataset import DataSet
from deepdataspace.utils.string import get_str_md5

logger = logging.getLogger("process.processor")


class ProcessorMeta(type):
    """
    Metaclass of a process class.
    This metaclass will:
    - register all process classes
    - resolve the dependency links between them
    - register the task function of each process class
    """

    processors = []
    name2class = {}

    @staticmethod
    def register_class(name: str, cls: "ProcessorMeta"):
        """
        Find all processor classes, and order them by dependency links.
        The depended processor will be prior to all depending processors.
        """

        # found all processor classes, ensure there is no classes of the same name
        exist_cls = ProcessorMeta.name2class.get(name, None)
        if exist_cls is not None:
            msg = f"Cannot register processors, more than one Processor named by '{name}': [{exist_cls}, {cls}]"
            raise RuntimeError(msg)

        ProcessorMeta.name2class[name] = cls
        cls.register_task_func()

        # construct a directed symbol graph
        num_nodes = len(ProcessorMeta.name2class)
        dsg = DirectedSymbolGraph(num_nodes)
        for name, cls in ProcessorMeta.name2class.items():
            dsg.add_node(name)
            dependencies = cls.dependencies()
            for dep in dependencies:
                dsg.add_edge(name, ProcessorMeta.name2class[dep].__name__)

        # resolve the topology order from processor dependency links
        if dsg.has_circle():
            msg = f"Cannot resolve processors, there is a circle in processor dependency link"
            raise RuntimeError(msg)

        topo = dsg.topology_order()
        topo = [ProcessorMeta.name2class[n] for n in topo]

        ProcessorMeta.processors = topo

    def __new__(mcs, name, bases, attrs):
        cls = super().__new__(mcs, name, bases, attrs)
        if name != "BaseProcessor":
            ProcessorMeta.register_class(name, cls)
        return cls


class BaseProcessor(metaclass=ProcessorMeta):
    """
    The common interface for processing a dataset.
    Any subclass should implement all abstract methods.

    Processors may be executed asynchronously by celery.
    To do so, the processor class should implement the `register_task_func` function, which returns a celery task.
    """
    task_func = None

    def __init__(self, dataset_path: str, enforce: bool = False):
        """
        :param dataset_path: the path of dateset to be processed.
        :param enforce: force processing the target dataset, even though it is processed before.
        """
        dataset_path = os.path.abspath(dataset_path)

        self.enforce = enforce

        self._dataset = None
        self.dataset_path = dataset_path
        self.dataset_id = get_str_md5(dataset_path)

    @classmethod
    @abc.abstractmethod
    def dependencies(cls) -> List[str]:
        """
        What processors this processor is depending on.
        """
        raise NotImplementedError

    @classmethod
    @abc.abstractmethod
    def should_auto_run(cls) -> bool:
        """
        Should this processor automatically run at program start?
        """
        raise NotImplementedError

    @abc.abstractmethod
    def can_process(self):
        raise NotImplementedError

    @property
    def dataset(self):
        if self._dataset is None:
            self._dataset = DataSet.find_one({"_id": self.dataset_id})
            if self._dataset is not None:
                self.dataset_path = self._dataset.path
        return self._dataset

    @property
    def is_processed(self) -> bool:
        """
        Check if the dataset is processed before.
        """
        if self.dataset is None:
            return False

        status = self.dataset.detail_status.get(self.__class__.__name__)
        return status == DatasetStatus.Ready

    @property
    def should_process(self):
        """
        Check if the process task should be run.
        """

        return not self.is_processed or self.enforce

    @contextmanager
    def process_dataset(self):
        """
        Process a subset of this dataset.
        Derived class should implement this interface accordingly.
        """
        raise NotImplementedError

    def update_dataset_status(self, status):
        detail_status = self.dataset.detail_status
        detail_status[self.__class__.__name__] = status

        update = {
            "status"       : status,
            "detail_status": detail_status
        }
        DataSet.update_one({"id": self.dataset_id}, update)

    @contextmanager
    def process_dataset_context(self):
        self.update_dataset_status(DatasetStatus.Processing)
        try:
            yield
        except Exception as err:
            logger.error(f"{self.dataset_path} is failed to process, err={str(err)}")
            logger.error(traceback.format_tb(err.__traceback__))
            self.update_dataset_status(DatasetStatus.Failed)
            raise err
        else:
            self.update_dataset_status(DatasetStatus.Ready)
            logger.info(f"{self.dataset_path} process done.")

    def run(self) -> Union[None, Dict[str, Any]]:
        """
        The function invokes the whole processing procedures.
        This stars the processing of dataset directly in current thread.
        If you want to process the dataset asynchronously, use `run_async` instead.
        """

        logger.info(f"{self.__class__.__name__} starts to run, enforce={self.enforce}")

        if self.dataset is None:
            logger.info(f"{self.dataset_path} is not imported before, skip it...")
            return None

        if not self.should_process:
            logger.info(f"{self.dataset_path} is processed before, skip it...")
            return self.dataset

        with self.process_dataset_context():
            self.process_dataset()

        return self.dataset

    @staticmethod
    def update_task_status(task_id, update_data: dict):
        from deepdataspace.globals import Redis

        logger.info(f"updating task[{task_id}] with {update_data}")
        redis_key = f"task:{task_id}"
        task_data = Redis.get(redis_key)
        if task_data:
            task_data = json.loads(task_data)
            task_data.update(update_data)
            Redis.set(redis_key, json.dumps(task_data))

    @staticmethod
    def on_async_start(task):
        """
        This function is called before the processor is executed by celery.

        :param task: celery task instance.
        """
        task_id = task.request.id.replace("-", "")
        BaseProcessor.update_task_status(task_id, {
            "status"  : TaskStatus.Running,
            "start_at": int(time.time() * 1000)
        })

    @staticmethod
    def on_async_success(task, retval, task_id, args, kwarg):
        """
        This function is called if the processor is executed by celery successfully.

        :param task: celery task instance.
        """
        task_id = task_id.replace("-", "")
        BaseProcessor.update_task_status(task_id, {
            "status"   : TaskStatus.Success,
            "finish_at": int(time.time() * 1000)
        })

    @staticmethod
    def on_async_fail(task, exc, task_id, args, kwargs, einfo):
        """
        This function is called if the processor is failed to be executed by celery.

        :param task: celery task instance.
        """
        task_id = task_id.replace("-", "")
        BaseProcessor.update_task_status(task_id, {
            "status"   : TaskStatus.Fail,
            "finish_at": int(time.time() * 1000)
        })

    @classmethod
    def register_task_func(cls):
        """
        This function registers the process class as a celery task.
        """

        if cls.task_func is not None:
            return

        from deepdataspace.task.celery import app

        def _run_async(task, dataset_path: str, enforce: bool = False):
            cls.on_async_start(task)
            instance = cls(dataset_path, enforce)
            return instance.run()

        cls.task_func = app.task(name=f"{cls.__name__}",
                                 bind=True,
                                 on_success=cls.on_async_success,
                                 on_failure=cls.on_async_fail)(_run_async)

    @classmethod
    def run_async(cls, dataset_path: str, enforce: bool):
        """
        Run the processor asynchronously by celery.
        """

        return cls.task_func.apply_async(args=(dataset_path, enforce,))

    def __repr__(self):
        return f"Processor('{self.dataset_path}')"

    def __str__(self):
        return self.__repr__()


def process_dataset(dataset_dir: str,
                    enforce: bool = False,
                    auto_triggered=False):
    """
    Process the dataset with all registered Processors.

    :param dataset_dir: the dataset dir to be processed.
    :param enforce: enforce the import task, even though the dataset is processed before.
    :param auto_triggered: is this function called automatically on program start up?
    """

    logger.info(f"process_dataset starts, dataset_dir={dataset_dir}, enforce={enforce}")

    dataset = None
    for processor in ProcessorMeta.processors:
        proc = processor(dataset_dir, enforce)
        if auto_triggered is True and not proc.should_auto_run():
            continue
        dataset = proc.run()
    return dataset
