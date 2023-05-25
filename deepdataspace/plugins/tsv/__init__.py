"""
deepdataspace.plugins.tsv

This module supports tsv dataset format.
"""

from deepdataspace.plugins.tsv.importer import TSVImporter
from deepdataspace.plugins.tsv.server import ReRankImagesByFlagsTaskView
from deepdataspace.plugins.tsv.server import ReRankImagesByFlagsTasksView
from deepdataspace.server.utils import route

route("api/v1/tasks/rerank_by_flags")(ReRankImagesByFlagsTasksView),
route("api/v1/tasks/rerank_by_flags/<task_id>")(ReRankImagesByFlagsTaskView)
