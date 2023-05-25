"""
deepdataspace.server.middlewares.request_perf

The request performance middleware.
"""

import time

from django.utils.deprecation import MiddlewareMixin


class RequestPerfMiddleware(MiddlewareMixin):
    def process_request(self, request):
        "Start time at request coming in"
        request.start_time = time.time()

    def process_response(self, request, response):
        "End of request, take time"
        total = time.time() - request.start_time

        # Add the header.
        response["X-Django-Cost"] = int(total * 1000)
        return response
