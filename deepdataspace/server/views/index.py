"""
deepdataspace.views.index

The index page view.
"""

from django.shortcuts import redirect


def index(request):
    return redirect("/page/")


def sub_index(request, sub_path):
    return redirect("/page/")
