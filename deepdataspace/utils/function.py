"""
deepdataspace.utils.function

Convenient functions about python function.
"""

import cProfile
import pstats
import time
from contextlib import contextmanager


@contextmanager
def count_block_time(block_id: str, logger=print):
    """
    Count the time cost of a code block, and log it by the logger.
    :param block_id: an alias name to the code block.
    :param logger: the time cost logger, must be a callable, such as logger.info, default is print.

    Example:
        import time

        with count_block_time("test", print):
            time.sleep(1)

        >>time cost of block[test]: 1000ms
    """

    start = int(time.time() * 1000)
    try:
        yield
    finally:
        end = int(time.time() * 1000)
        logger(f"time cost of block[{block_id}]: {end - start}ms")


@contextmanager
def profile_perf(report_file: str, turn_on: bool = True):
    """
    Profile the performance of a code block, and save the result to report_file.
    :param report_file: the target path where the performance data is saved to.
    :param turn_on: only run the profile this is True or evaluates to True.
    """
    profile = cProfile.Profile()

    if turn_on:
        profile.enable()

    try:
        yield
    finally:
        if turn_on is True:
            profile.disable()
            stats = pstats.Stats(profile).sort_stats("cumulative")
            stats.dump_stats(report_file)


def retry(times: int, sleep: int = 0, exceptions: tuple = (Exception,)):
    """
    Retry a function or a method.
    :param times: retry times.
    :param sleep: sleep time between retries.
    :param exceptions: the exceptions that will be caught and retry.

    Example:
        @retry(3, 1)
        def test():
            print("test")
            raise Exception

        test()
    """

    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    time.sleep(sleep)
            return func(*args, **kwargs)

        return wrapper

    return decorator
