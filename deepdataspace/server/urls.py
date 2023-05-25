"""
deepdataspace.server.urls

The django server urls.
"""

from django.urls import include
from django.urls import path
from django.urls import re_path
from django.views.generic.base import TemplateView

from deepdataspace.server import resources
from deepdataspace.server.views import index

urlpatterns = [
    path("", index),
    path("files/", include(resources.files.urls)),
    path("api/v1/", include(resources.api_v1.urls)),
    re_path(r"^page", TemplateView.as_view(template_name="index.html"), name="index"),
]
