"""
deepdataspace.task.settings

The celery settings.
"""

from deepdataspace import environs

broker_url = environs.CELERY_BROKER
worker_pool = environs.CELERY_WORKER_POOL
task_acks_late = True
