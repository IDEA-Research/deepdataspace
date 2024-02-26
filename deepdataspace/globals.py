"""
deepdataspace.globals

The runtime global variables.

.. data:: MongoDB

    | The MongoDB client.
    | It's the underlying mongodb connection for every instance of :class:`deepdataspace.model._base.BaseModel`.

.. data:: Redis

    The Redis client. It is used for two purposes:

    #. caching
    #. celery broker

"""

import urllib.parse

import redis
import sentry_sdk
from pymongo import MongoClient

from deepdataspace.constants import RunningEnv
from deepdataspace.environs import ENV
from deepdataspace.environs import MONGODB_DBNAME
from deepdataspace.environs import MONGODB_HOST
from deepdataspace.environs import MONGODB_PASS
from deepdataspace.environs import MONGODB_PORT
from deepdataspace.environs import MONGODB_USER
from deepdataspace.environs import REDIS_DBNAME
from deepdataspace.environs import REDIS_HOST
from deepdataspace.environs import REDIS_PASS
from deepdataspace.environs import REDIS_PORT
from deepdataspace.environs import SENTRY_DSN
from deepdataspace.utils.os import get_os_username

# init mongodb client
_mongo_user = urllib.parse.quote_plus(MONGODB_USER)
_mongo_pass = urllib.parse.quote_plus(MONGODB_PASS)
_mongo_url = f"mongodb://{_mongo_user}:{_mongo_pass}@{MONGODB_HOST}:{MONGODB_PORT}/{MONGODB_DBNAME}"
_mongo_client = MongoClient(_mongo_url, authMechanism="SCRAM-SHA-256", maxPoolSize=None)
MongoDB = _mongo_client[MONGODB_DBNAME]

# init redis client
Redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DBNAME, password=REDIS_PASS)
