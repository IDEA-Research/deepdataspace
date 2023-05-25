"""
deepdataspace.task.celery

The celery app initialization.
"""

from celery import Celery

app = Celery("dds")
app.config_from_object("deepdataspace.task.settings")
