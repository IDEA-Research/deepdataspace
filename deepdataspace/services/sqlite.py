"""
deepdataspace.services.sqlite

The sqlite db service manager.
"""

from deepdataspace.services import config
from deepdataspace.services.config import log_and_save_env


class SQLite:
    """
    We don't need to 'start' sqlite, we just implement this to unify controller API.
    """

    def start(self):
        log_and_save_env("DDS_DB_ENGIN", config.DB_ENGIN)
        log_and_save_env("DDS_DB_HOST", config.DB_HOST)
        log_and_save_env("DDS_DB_PORT", config.DB_PORT)
        log_and_save_env("DDS_DB_NAME", config.DB_NAME)
        log_and_save_env("DDS_DB_USER", config.DB_USER)
        log_and_save_env("DDS_DB_PASS", config.DB_PASS)
        return True
