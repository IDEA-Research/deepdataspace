import os


def pytest_configure(config):
    from deepdataspace import DDS
    from deepdataspace.services import config as dds_config

    # start a dds service for testing
    if not dds_config.load_all_env():
        cur_dir = os.path.dirname(os.path.abspath(__file__))
        config_file = os.path.join(cur_dir, "dds.test.yaml")
        DDS(quickstart=True, configfile=config_file).start()

    from deepdataspace.model import User

    # Delete all users for testing.
    # Normally all testing users are deleted by pytext fixture,
    # but if the test process is killed abruptly, fixtures will not be called and there might be junky data left.
    # So we are trying to delete all users manually here to ensure a clean test environment.
    User.delete_many({})
