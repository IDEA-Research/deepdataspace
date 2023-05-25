"""
deepdataspace.server.settings

The django settings.
"""

import os.path
from pathlib import Path

from corsheaders.defaults import default_headers
from corsheaders.defaults import default_methods

from deepdataspace import constants
from deepdataspace import environs

BASE_DIR = os.path.abspath(Path(__file__).resolve().parent)

DJANGO_DIR = environs.DJANGO_DIR

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = environs.DJANGO_SECRET

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = environs.DEBUG

is_local = environs.ENV == constants.RunningEnv.Local

ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "deepdataspace.server",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.http.ConditionalGetMiddleware",
    "deepdataspace.server.middlewares.RequestPerfMiddleware",
]

ROOT_URLCONF = "deepdataspace.server.urls"

TEMPLATES = [
    {
        "BACKEND" : "django.template.backends.django.DjangoTemplates",
        "DIRS"    : [],
        "APP_DIRS": True,
        "OPTIONS" : {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# Static files
STATIC_ROOT = f"{BASE_DIR}/static"
STATIC_URL = "/static/"

# Database
if environs.DB_ENGIN == "sqlite3":
    if is_local:
        default_db = {
            "NAME": os.path.join(DJANGO_DIR, f"{environs.DB_NAME}.sqlite3"),
        }
    else:
        default_db = {
            "NAME": os.path.join(BASE_DIR, f"{environs.DB_NAME}.sqlite3"),
        }
else:
    default_db = {
        "NAME"    : environs.DB_NAME,
        "USER"    : environs.DB_USER,
        "PASSWORD": environs.DB_PASS,
        "HOST"    : environs.DB_HOST,
        "PORT"    : environs.DB_PORT,
    }
default_db["ENGINE"] = f"django.db.backends.{environs.DB_ENGIN}"
DATABASES = {"default": default_db}

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# For Logging
LOGGING = {
    "version"                 : 1,
    "disable_existing_loggers": False,
    "formatters"              : {
        "simple" : {
            "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s"
        },
        "verbose": {
            "format": "%(asctime)s %(levelname)s [%(filename)s:%(funcName)s:%(lineno)s] %(process)d %(thread)d %(message)s"
        },
    },
    "handlers"                : {
        "console": {
            "class"    : "logging.StreamHandler",
            "formatter": "simple",
        }
    },
    "root"                    : {
        "level"    : "INFO",
        "handlers" : ["console"] if environs.VERBOSE else [],
        "propagate": True,
    },
    "loggers"                 : {
        "django": {
            "level"    : "INFO",
            "handlers" : ["console"],
            "propagate": True,
        },
    }
}
if is_local:
    LOGGING["handlers"]["django"] = {
        "level"    : "INFO",
        "class"    : "logging.handlers.RotatingFileHandler",
        "filename" : environs.DJANGO_LOG_PATH,
        "maxBytes" : 1024 * 1024 * 100,  # 100 mb
        "formatter": "verbose",
    }
    LOGGING["loggers"]["django"]["handlers"].append("django")

# For DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES"    : [],
    "EXCEPTION_HANDLER"             : "deepdataspace.server.resources.common.handle_api_exception",
    "DEFAULT_RENDERER_CLASSES"      : ["rest_framework.renderers.JSONRenderer", ],
    "DEFAULT_PARSER_CLASSES"        : ["rest_framework.parsers.JSONParser", ]
}

# For CORS
CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = list(default_methods)
CORS_ALLOW_HEADERS = list(default_headers) + [
    "Token",
]

# For django running behind a proxy
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# For Login and Token
TOKEN_AGE = 3600 * 24
