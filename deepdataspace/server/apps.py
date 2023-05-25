"""
deepdataspace.server.apps

The django start-up hook.
"""

from django.apps import AppConfig


class DjangoApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "deepdataspace.server"

    def ready(self):
        # This is for django.
        # But if DJANGO_SETTINGS_MODULE environment is set, celery will also set up django on start up,
        # which makes this effective for celery too.
        # See source code of .../site-packages/celery/fixups/django.py
        from deepdataspace.plugins import import_all_plugins

        import_all_plugins()
