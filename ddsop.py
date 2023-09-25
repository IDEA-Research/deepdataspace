#! python
"""
ddsop.py

Usage: ddsop.py [OPTIONS] COMMAND [ARGS]...

Options:
  --help  Show this message and exit.

Commands:
  delete_one   Delete a dataset.
  import_all   Trigger a background task of importing all datasets in a...
  import_coco  Generate a coco meta file.
  import_one   Trigger a background task of importing one dataset.
  lpexport     Export the labels of a label project.
  migrate      Run a migrate script.
  shell        Enter a Python interpreter shell with all dds configs loaded.
  useradd      Add a user by username.
  userban      Ban a user by username.
  userdel      Delete a user by username.
  useredit     Edit user attributes for a user by username.
  userreset    Reset password for a user by username.
  userunban    Unban a user by username.
"""

from deepdataspace.scripts import ddsop

if __name__ == "__main__":
    ddsop()
