"""
deepdataspace.scripts.enter_shell

This file adds a sub-command to ddsop command: ddsop shell.
This sub-command will present user a Python interpreter shell with all configurations loaded.
"""

from deepdataspace.scripts import ddsop


@ddsop.command("shell", help="Enter a Python interpreter shell with all dds configs loaded.")
def enter_shell():
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
                "Couldn't import Django. Are you sure it's installed and "
                "available on your PYTHONPATH environment variable? Did you "
                "forget to activate a virtual environment?"
        ) from exc

    run_cmd = ["manage.py", "shell"]
    execute_from_command_line(run_cmd)
