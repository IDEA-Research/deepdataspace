"""
deepdataspace.scripts.dataset_cmds

This file adds dataset related sub-command to ddsop command.
"""

import os

import click

from deepdataspace.scripts import ddsop


@ddsop.command("delete_one", help="Delete a dataset.")
@click.argument("dataset_dir")
def delete_one(dataset_dir):
    from deepdataspace.model import Image
    from deepdataspace.model import Label
    from deepdataspace.model import DataSet
    from deepdataspace.model import Category
    from deepdataspace.utils.string import get_str_md5

    dataset_dir = os.path.abspath(dataset_dir)

    dataset = DataSet.find_one({"id": get_str_md5(dataset_dir)})
    if dataset is None:
        print(f"dataset [{dataset_dir}] is not imported before, skip...")
        return

    dataset_id = dataset.id
    print(f"dataset [{dataset_id}] is found, deleting...")

    print(f"dataset [{dataset_id}] is found, deleting categories...")
    Category.delete_many({"dataset_id": dataset_id})

    print(f"dataset [{dataset_id}] is found, deleting labels...")
    Label.delete_many({"dataset_id": dataset_id})

    print(f"dataset [{dataset_id}] is found, deleting images...")
    Image(dataset_id).get_collection().drop()

    DataSet.delete_many({"id": dataset_id})
    print(f"dataset [{dataset_id}] is deleted.")


@ddsop.command("delete_all", help="Delete all datasets imported before.")
@click.option('--confirm', prompt="You are deleting all datasets, are you sure?[y/N]")
def delete_all(confirm):
    if confirm.lower() != "y":
        print("Abort.")
        return

    from deepdataspace.globals import MongoDB

    collections = MongoDB.list_collection_names()
    collections = sorted(collections)
    print(f"found {len(collections)} to delete")

    for collection in collections:
        print(f"collection [{collection}] found, deleting...")
        MongoDB.drop_collection(collection)
    print(f"{len(collections)} collections deleted")


@ddsop.command("import_all", help="Trigger a background task of importing all datasets in a data dir.")
@click.option("--data_dir", "-d",
              default=None,
              help="Which data dir to import, default to the dir set by dds command.")
@click.option("--force", "-f",
              default=False, is_flag=True,
              help="Force import the data dir, even though it is imported before.")
def import_all(data_dir, force):
    from deepdataspace.task import import_and_process_data_dir

    if data_dir is None:
        data_dir = os.environ["DDS_DATA_DIR"]
    else:
        data_dir = os.path.abspath(data_dir)

    import_and_process_data_dir.apply_async(args=(data_dir,), kwargs={"enforce": force})
    print(f"task of importing dir[{data_dir}] is arranged, you can check the logs by command: ddsop logs -c")


@ddsop.command("import_one", help="Trigger a background task of importing one dataset.")
@click.argument("dataset_dir")
@click.option("--force", "-f",
              default=False, is_flag=True,
              help="Force import the dataset, even though it is imported before.")
def import_one(dataset_dir, force):
    from deepdataspace.task import import_and_process_dataset

    dataset_dir = os.path.abspath(dataset_dir)

    import_and_process_dataset.apply_async(args=(dataset_dir,), kwargs={"enforce": force})
    print(f"task of importing dataset [{dataset_dir}] is arranged, you can check the logs by command: ddsop logs -c")
