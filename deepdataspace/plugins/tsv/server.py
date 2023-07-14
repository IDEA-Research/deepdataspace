"""
deepdataspace.plugins.tsv.server

Add RESTful APIs for tsv dataset.
"""

import json
import logging
import os
import time
from dataclasses import asdict
from dataclasses import dataclass

from rest_framework.views import APIView

from deepdataspace.constants import ErrCode
from deepdataspace.constants import DatasetStatus
from deepdataspace.constants import TaskName
from deepdataspace.constants import TaskStatus
from deepdataspace.globals import Redis
from deepdataspace.model import DataSet
from deepdataspace.plugins.tsv.process import RankByFlags
from deepdataspace.utils.http import Argument
from deepdataspace.utils.http import format_response
from deepdataspace.utils.http import parse_arguments
from deepdataspace.utils.http import raise_exception

logger = logging.getLogger("plugins.tsv.server")


@dataclass
class Task:
    """
    A task model for rerank_by_flags task.
    """

    id: str
    name: str
    status: str
    trigger_at: int
    start_at: int
    finish_at: int


class ReRankImagesByFlagsTasksView(APIView):
    """
    Add an API to trigger a task to rerank images by dataset flags.
    """

    post_args = [Argument("dataset_id", str, "json", required=True)]

    def post(self, request):
        """
        Trigger a task to rerank images by dataset flags.
        """

        dataset_id, = parse_arguments(request, self.post_args)

        dataset = DataSet.find_one({"id": dataset_id})
        if dataset is None:
            raise_exception(ErrCode.DatasetNotFound, f"dataset_id[{dataset_id}] not found")

        status = dataset.status
        if status in DatasetStatus.BatchProcessing_:
            raise_exception(ErrCode.DatasetNotReadable,
                            f"dataset_id[{dataset_id}] is in status[{status}] now, try again later")

        embd_file = dataset.files.get("Embedding", None)
        if embd_file is None or not os.path.exists(embd_file):
            raise_exception(ErrCode.DatasetMissingEmbdFile,
                            f"dataset_id[{dataset_id}] dose not have an embedding file")

        celery_task = RankByFlags.run_async(dataset.path, enforce=True)

        task_id = celery_task.id.replace("-", "")
        task = Task(task_id, TaskName.ReRankByFlags, TaskStatus.Waiting, int(time.time() * 1000), 0, 0)
        task_data = asdict(task)
        Redis.set(f"task:{task_id}", json.dumps(task_data))
        return format_response(task_data)


class ReRankImagesByFlagsTaskView(APIView):
    """
    Add an API to query result of rerank_by_flags task.
    """

    def get(self, request, task_id: str):
        """
        Query result of rerank_by_flags task.
        """

        redis_key = f"task:{task_id}"
        task_data = Redis.get(redis_key)
        if not task_data:
            raise_exception(ErrCode.ReRankByFlagTaskNotFound,
                            f"task_id[{task_id}] not found")

        task_data = json.loads(task_data)
        return format_response(task_data)
