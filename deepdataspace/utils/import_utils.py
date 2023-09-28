"""
deepdataspace.utils.import_utils

This file provides convenient functions about importing python packages.
"""

import importlib
import importlib.util
from types import ModuleType
from typing import Callable


def lazy_import(module_name: str, import_hook: Callable = None):
    return LazyModule(module_name, import_hook=import_hook)


class LazyModule(ModuleType):
    def __init__(self, module_name: str, import_hook: Callable = None):
        super().__init__(module_name)
        self._module = None
        self._import_hook = import_hook

    def __getattr__(self, item):
        if self._module is None:
            self._import_module()

        return getattr(self._module, item)

    def __dir__(self):
        if self._module is None:
            self._import_module()

        return dir(self._module)

    def _import_module(self):
        if self._import_hook is not None:
            self._import_hook()

        module = importlib.import_module(self.__name__)
        self._module = module

        self.__dict__.update(module.__dict__)


def import_from_path(path: str):
    """
    Import a module given its file path.
    """
    module_name = path.split("/")[-1].replace(".py", "")

    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module
