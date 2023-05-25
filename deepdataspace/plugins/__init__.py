"""
deepdataspace.plugins

This module includes the plugable implementations of various dataset format.
"""

import os
import sys
import importlib


def import_all_plugins():
    """
    Import all plugin modules in this directory without knowing their names.
    This function is called on django startup.
    Celery will also call this function on startup if DJANGO_SETTINGS_MODULE environment is set.
    """

    module_name = sys.modules[__name__].__name__
    module_dir = os.path.dirname(os.path.abspath(__file__))

    items = os.listdir(module_dir)
    for item in items:
        item_path = os.path.join(module_dir, item)

        # skip non-module dir
        if os.path.isdir(item_path) and not os.path.exists(f"{item_path}/__init__.py"):
            continue

        # skip non-python file
        if os.path.isfile(item_path) and not item.endswith(".py"):
            continue

        # also skip __init__.py file
        if item == "__init__.py":
            continue

        importlib.import_module(f"{module_name}.{item}")
