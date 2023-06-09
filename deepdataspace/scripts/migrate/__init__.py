"""
deepdataspace.scripts.migrate

This file adds migrate sub-command to ddsop command.
"""

import importlib

import click

from deepdataspace.scripts import ddsop


@ddsop.command("migrate", help="Run a migrate script.")
@click.argument("script_name")
def migrate(script_name):
    module_name = f"{__name__}.{script_name}"
    try:
        module = importlib.import_module(module_name)
    except ModuleNotFoundError:
        print(f"script [{script_name}] not found")
        exit(1)
    else:
        module.run()
