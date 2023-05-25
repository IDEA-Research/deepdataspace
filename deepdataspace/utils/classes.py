"""
deepdataspace.utils.classes
"""

import copy
from threading import RLock


class SingletonMeta(type):
    """
    Any class whose metaclass is SingletonMeta will be a singleton class.
    """

    __instances = dict()
    __lock = RLock()

    @staticmethod
    def __copy__(self):
        name = self.__class__.__qualname__
        print(f"An instance of singleton class[{name}] already exists, returning it on __copy__")
        return self

    @staticmethod
    def __deepcopy__(self, *args, **kwargs):
        name = self.__class__.__qualname__
        print(f"An instance of singleton class[{name}] already exists, returning it on __deepcopy__")
        return self

    def __new__(mcs, name, bases, attrs):
        for base in bases:
            if isinstance(base, SingletonMeta):
                name = base.__qualname__
                raise RuntimeError(f"Singleton class[{name}] cannot be inherited by any class.")

        attrs["__copy__"] = SingletonMeta.__copy__
        attrs["__deepcopy__"] = SingletonMeta.__deepcopy__

        return super(SingletonMeta, mcs).__new__(mcs, name, bases, attrs)

    def __call__(cls, *args, **kwargs):
        name = cls.__qualname__
        instance = SingletonMeta.__instances.get(name, None)
        if instance is None:
            with SingletonMeta.__lock:
                instance = SingletonMeta.__instances.setdefault(name,
                                                                super(SingletonMeta, cls).__call__(*args, **kwargs))
        else:
            print(f"An instance of singleton class[{name}] already exists, returning it on instance initiation")
        return instance


def test():
    class A(metaclass=SingletonMeta):
        def __init__(self, k, v):
            self.k = k
            self.v = v

    a = A(1, 2)
    b = A(3, 4)
    c = a
    d = copy.copy(a)
    e = copy.deepcopy(a)
    assert len({id(a), id(b), id(c), id(d), id(e)}) == 1

    try:
        class B(A, metaclass=SingletonMeta):
            def __init__(self, k, v):
                self.k = k
                self.v = v
                super(B, self).__init__(k, v)
    except Exception as e:
        err = e
    else:
        err = None
    assert isinstance(err, RuntimeError)

    class C(metaclass=SingletonMeta):
        def __init__(self, k, v):
            self.k = k
            self.v = v

    a = C(1, 2)
    b = C(3, 4)
    c = a
    d = copy.copy(a)
    e = copy.deepcopy(a)
    assert len({id(a), id(b), id(c), id(d), id(e)}) == 1


if __name__ == "__main__":
    test()
