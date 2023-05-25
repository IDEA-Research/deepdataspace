"""
deepdataspace.server.utils

Convenient functions for django server.
"""

import inspect
from functools import wraps

from django.urls import path
from rest_framework.views import APIView

from deepdataspace.server.urls import urlpatterns


def route(api_path: str):
    """
    Register the decorated function or APIView class as the handler for given api path.
    """

    path_record = {}

    def decorator(handler):
        registered = path_record.get(api_path, None)
        if registered is not None:
            raise RuntimeError(f"{api_path} is already registered by {registered}")

        path_record[api_path] = handler
        if inspect.isclass(handler) and issubclass(handler, APIView):
            pattern = path(api_path, handler.as_view())
        else:
            pattern = path(api_path, handler)
        urlpatterns.append(pattern)

        @wraps(handler)
        def wrapper(*args, **kwargs):
            return handler(*args, **kwargs)

        return wrapper

    return decorator
