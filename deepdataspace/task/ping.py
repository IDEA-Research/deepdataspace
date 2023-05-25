"""
deepdataspace.task.ping

A simple ping task.
"""

import logging

from deepdataspace.task.celery import app

logger = logging.getLogger("celery")


@app.task
def ping():
    return "pong"
