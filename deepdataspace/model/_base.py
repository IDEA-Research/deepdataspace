"""
deepdataspace.model._base

This module defines the common model apis.
"""

import abc
import logging
import time
from threading import Lock
from typing import ClassVar
from typing import Dict
from typing import List
from typing import Tuple

from pydantic import BaseModel as _Base
from pymongo import WriteConcern
from pymongo.collection import Collection
from pymongo.operations import UpdateOne
from pymongo.typings import _DocumentType

from deepdataspace.globals import MongoDB

_lock_lock = Lock()  # the lock for creating a batch operation lock for a collection
_batch_lock = {}  # a dict of batch operation lock for every collection, {'collection_name': batch_op_lock, }
_batch_save_queue = {}  # a dict of batch save queue for every collection, {'collection_name': batch_save_queue, }
_batch_update_queue = {}  # a dict of batch update queue for every collection, {'collection_name': batch_update_queue, }
_batch_insert_queue = {}  # a dict of batch insert queue for every collection, {'collection_name': batch_insert_queue, }

logger = logging.getLogger("model.base")


def current_ts():
    """
    Get current timestamp in millisecond.
    """
    return int(time.time() * 1000)


class BaseModel(_Base):
    """
    | Base model for all models.
    | Every model represents a mongodb collection.
    """

    class Config:
        underscore_attrs_are_private = True

    db: ClassVar = MongoDB
    cache: ClassVar = {}

    @classmethod
    @abc.abstractmethod
    def get_collection(cls, *args, **kwargs) -> Collection[_DocumentType]:
        """
        Derived model class should implement this function to get the mongodb collection.
        """

        raise NotImplementedError

    @classmethod
    def from_dict(cls, data: dict):
        """
        Convert a python dict to a model object.
        """

        obj = cls.parse_obj(data)
        return obj

    def to_dict(self, include: list = None, exclude: list = None):
        """
        Convert a model object to a python dict.
        """

        include = set(include) if include else None
        exclude = set(exclude) if exclude else None
        return self.dict(include=include, exclude=exclude)

    @classmethod
    def convert_id_for_python(cls, data: dict):
        """
        Convert the mongo '_id' field to 'id' field, without the prefix underscore.
        """

        if "_id" in data:
            data["id"] = data.pop("_id")
        return data

    @classmethod
    def convert_id_for_mongo(cls, data: dict):
        """
        Convert the python 'id' field to '_id' field, with the prefix underscore.
        """

        if "id" in data:
            data["_id"] = data.pop("id")

    @classmethod
    def _from_mongo_doc(cls, data: dict):
        """
        Convert a mongo document to a model object.
        """

        cls.convert_id_for_python(data)
        return cls.from_dict(data)

    @classmethod
    def find_many(cls,
                  filters: dict,
                  includes: dict = None,
                  sort: List[Tuple[str, int]] = None,
                  skip: int = None,
                  size: int = None,
                  to_dict: bool = False):
        """
        Find objects matching the filters, retuning an iterable generator.

        :param filters: the filters to match.
                        This is the same as mongodb filter parameter,
                        except that it will convert 'id' to '_id' before a mongodb query.
        :param includes: the fields to include in the result.
        :param sort: a list of sort conditions.
                     Every condition is a tuple of (field_name, sort_order).
                     sort_order 1 for ascending, -1 for descending.
        :param skip: the number of documents to skip.
        :param size: the number of documents to return.
        :param to_dict: If true, python dicts will be yield instead of model objects.
                        The performance is better if we are returning a large number of objects in a json response.
        """

        cls.convert_id_for_mongo(filters)
        co = cls.get_collection()
        cursor = co.find(filters, includes)

        if sort:
            cursor = cursor.sort(sort)
        if skip is not None:
            cursor = cursor.skip(skip)
        if size is not None:
            cursor = cursor.limit(size)

        for item in cursor:
            if to_dict is True:
                yield cls.convert_id_for_python(item)
            else:
                yield cls._from_mongo_doc(item)

    @classmethod
    def find_one(cls, filters: dict):
        """
        Find one object matching the filters.
        """

        cls.convert_id_for_mongo(filters)
        co = cls.get_collection()
        instance = co.find_one(filters)
        if instance is None:
            return None

        return cls._from_mongo_doc(instance)

    @classmethod
    def count_num(cls, filters: dict):
        """
        Count the number of objects matching the filters.
        """

        cls.convert_id_for_mongo(filters)
        return cls.get_collection().count_documents(filters)

    @classmethod
    def update_one(cls, filters: dict, set_data: dict = None, unset_data: dict = None):
        """
        Update one object matching the filters.

        :param filters: the filters to match.
        :param set_data: the fields to set.
        :param unset_data: the fields to delete.
        """

        cls.convert_id_for_mongo(filters)
        set_data = set_data or dict()
        unset_data = unset_data or dict()
        return cls.get_collection().update_one(filters, {"$set": set_data, "$unset": unset_data})

    @classmethod
    def update_many(cls, filters: dict, set_data: dict = None, unset_data: dict = None):
        """
        Update all objects matching the filters.
        """

        cls.convert_id_for_mongo(filters)
        set_data = set_data or dict()
        unset_data = unset_data or dict()
        return cls.get_collection().update_many(filters, {"$set": set_data, "$unset": unset_data})

    @classmethod
    def _get_batch_op_lock(cls):
        """
        Get the batch operation lock for current thread.
        """

        cls_id = cls.get_cls_id()

        if _batch_lock.get(cls_id, None) is None:
            with _lock_lock:
                _batch_lock[cls_id] = Lock()

        op_lock = _batch_lock[cls_id]
        return op_lock

    @classmethod
    def batch_update(cls, filters: dict, set_data: dict = None, unset_data: dict = None, batch_size: int = 20):
        """
        This is almost the same as update_one, except that it will batch the update operations.
        The performance is better if we are updating a large number of objects.

        :param filters: the filters to match.
        :param set_data: the fields to set.
        :param unset_data: the fields to delete.
        :param batch_size: the batch size. We will only send the update operations to mongodb when the batch is full.
        """

        cls.convert_id_for_mongo(filters)
        set_data = set_data or dict()
        unset_data = unset_data or dict()
        if not set_data and not unset_data:
            return

        co = cls.get_collection()
        if co is None:
            return None
        wc = WriteConcern(w=0)
        co = co.with_options(write_concern=wc)

        op = UpdateOne(filters, {"$set": set_data, "$unset": unset_data})

        # make sure only one thread is batch updating at the same time.
        # so the update order will be preserved.
        cls_id = cls.get_cls_id()
        op_lock = cls._get_batch_op_lock()
        with op_lock:
            queue = _batch_update_queue.setdefault(cls_id, [])
            queue.append(op)
            if len(queue) >= batch_size:  # the batch queue is full, send all the update operations to mongodb.
                co.bulk_write(queue)
                _batch_update_queue[cls_id] = []

    @classmethod
    def finish_batch_update(cls):
        """
        Send all the update operations left in batch queue to mongodb.
        This must be called after all the batch_update calls.
        """

        cls_id = cls.get_cls_id()
        op_lock = cls._get_batch_op_lock()
        with op_lock:
            co = cls.get_collection()
            wc = WriteConcern(w=0)
            co = co.with_options(write_concern=wc)
            queue = _batch_update_queue.setdefault(cls_id, [])
            if queue:
                co.bulk_write(queue)
                _batch_update_queue[cls_id] = []

    @classmethod
    def aggregate(cls, pipeline: List[Dict]):
        """
        Do an aggregation on the collection.
        """
        return cls.get_collection().aggregate(pipeline)

    def save(self, refresh=False):
        """
        Save current object to mongodb.
        If refresh is True, the object will be re-fetched from mongodb after saving.
        """

        co = self.get_collection()
        if co is None:
            return None

        # we can't save it to mongodb if it doesn't have an id.
        _id = self.__dict__.get("id", None)
        if _id is None:
            return None

        data = self.to_dict()
        data.pop("id", None)
        co.update_one({"_id": _id}, {"$set": data}, upsert=True)

        if refresh is True:
            new_self = co.find_one({"_id": _id})
            new_self.pop("_id", None)
            self.__dict__.update(new_self)
        return self

    def batch_save(self, batch_size: int = 20, set_on_insert: Dict = None):
        """
        The same as self.save function, but the performance is better if we are saving a large number of objects.

        :param batch_size: the batch size. We will only write to mongodb when the batch is full.
        :param set_on_insert: the fields only need to be set when we are inserting a new object.
        """
        cls = self.__class__
        co = cls.get_collection()
        if co is None:
            return None
        wc = WriteConcern(w=0)
        co = co.with_options(write_concern=wc)

        _id = self.__dict__.get("id", None)
        if _id is None:
            return None

        data = self.to_dict()
        data.pop("id", None)

        # delete fields from data if they are in set_on_insert
        set_on_insert = set_on_insert or {}
        for key in set_on_insert:
            data.pop(key, None)

        op = UpdateOne({"_id": _id}, {"$set": data, "$setOnInsert": set_on_insert}, upsert=True, )

        cls_id = cls.get_cls_id()
        op_lock = cls._get_batch_op_lock()
        with op_lock:
            queue = _batch_save_queue.setdefault(cls_id, [])
            queue.append(op)
            if len(queue) >= batch_size:
                co.bulk_write(queue)
                _batch_save_queue[cls_id] = []

    @classmethod
    def finish_batch_save(cls):
        """
        This must be called after all the batch_save calls.
        """

        cls_id = cls.get_cls_id()
        if _batch_lock.get(cls_id, None) is None:
            with _lock_lock:
                _batch_lock[cls_id] = Lock()

        op_lock = _batch_lock[cls_id]
        with op_lock:
            co = cls.get_collection()
            wc = WriteConcern(w=0)
            co = co.with_options(write_concern=wc)
            queue = _batch_save_queue.setdefault(cls_id, [])
            if queue:
                co.bulk_write(queue)
                _batch_save_queue[cls_id] = []

    def delete(self):
        """
        Delete current object from mongodb.
        """

        co = self.get_collection()
        if co is None:
            return None

        _id = self.__dict__.get("id", None)
        if _id is None:
            return None

        return co.delete_one({"_id": _id})

    @classmethod
    def delete_many(cls, filters: dict):
        """
        Delete all objects matching the filters.
        """

        cls.convert_id_for_mongo(filters)
        return cls.get_collection().delete_many(filters)

    @classmethod
    def get_cls_id(cls):
        """
        | Get the class id.
        | This is used to generate a unique name for this model.
        | Most of the time, this is the same as the class name. But it can be overridden in some cases.
        """

        return cls.__name__
