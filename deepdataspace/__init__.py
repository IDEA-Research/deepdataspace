"""
The deepdataspace package.
"""

import logging
import os
import sys

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

from deepdataspace.services import DDS
from deepdataspace.services import config
from deepdataspace.constants import RunningEnv

env = os.environ.get("DDS_DEPLOY", RunningEnv.Local)
if env == RunningEnv.Local and not config.load_all_env():  # this runs as early as possible
    if not os.environ.get("DDS_STARTING", None):
        msg = "\ndeepdataspace package is not available before dds services are started. \n" \
              "You can start dds services by one of the two methods:\n" \
              "1. CLI tool: dds start --quickstart\n" \
              "2. Python API: from deepdataspace import DDS; DDS(quickstart=True).start()\n"
        logging.warning(msg)
else:
    from deepdataspace.model import *
