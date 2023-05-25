"""
deepdataspace.server.wsgi

The WSGI interface for django server.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "deepdataspace.server.settings")

app = get_wsgi_application()
