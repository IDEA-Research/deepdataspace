"""
deepdataspace.server.resources.api_v1.ping

RESTful API to check service health of api v1 version.
"""

import logging
import time

from deepdataspace.globals import Redis
from deepdataspace.model import DataSet
from deepdataspace.utils.http import BaseAPIView
from deepdataspace.utils.http import format_response
from deepdataspace.task import ping

logger = logging.getLogger("django")


class PingView(BaseAPIView):
    """
    - GET /api/v1/ping
    """

    def get(self, request):
        """
        Check service health for api v1.

        - GET /api/v1/ping
        """

        ts = int(time.time() * 1000)
        data = {
            "redis"  : None,
            "mongodb": None,
            "celery" : None,
            "ts"     : ts
        }

        try:
            Redis.ping()
        except Exception as err:
            data["redis"] = False
            logger.error(f"redis is not available: {err}")
            return format_response(data, code=500, msg="redis is not available", status=500)
        else:
            data["redis"] = True

        try:
            DataSet.count_num({"id": str(ts)})
        except Exception as err:
            data["mongodb"] = False
            logger.error(f"mongodb is not available: {err}")
            return format_response(data, code=500, msg="mongodb is not available", status=500)
        else:
            data["mongodb"] = True

        try:
            ping.apply_async()
        except Exception as err:
            data["celery"] = False
            logger.error(f"mongodb is not available: {err}")
            return format_response(data, code=500, msg="celery is not available", status=500)
        else:
            data["celery"] = True

        return format_response(data)
