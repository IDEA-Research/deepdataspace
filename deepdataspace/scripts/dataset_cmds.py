"""
deepdataspace.scripts.dataset_cmds

This file adds dataset related sub-command to ddsop command.
"""

import os

import pkg_resources

import click

from deepdataspace.scripts import ddsop


@ddsop.command("delete_one", help="Delete a dataset.")
@click.argument("dataset_dir")
def delete_one(dataset_dir):
    from deepdataspace.model import DataSet
    from deepdataspace.utils.string import get_str_md5

    dataset_dir = os.path.abspath(dataset_dir)

    dataset = DataSet.find_one({"id": get_str_md5(dataset_dir)})
    if dataset is None:
        print(f"dataset [{dataset_dir}] is not imported before, skip...")
        return

    DataSet.cascade_delete(dataset)


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
    print(f"task of importing dir[{data_dir}] is arranged")


@ddsop.command("import_one", help="Trigger a background task of importing one dataset.")
@click.argument("dataset_path")
@click.option("--force", "-f",
              default=False, is_flag=True,
              help="Force import the dataset, even though it is imported before.")
def import_one(dataset_path, force):
    from deepdataspace.task import import_and_process_dataset

    dataset_path = os.path.abspath(dataset_path)

    import_and_process_dataset.apply_async(args=(dataset_path,), kwargs={"enforce": force})
    print(f"task of importing dataset [{dataset_path}] is arranged")


@ddsop.command("import_coco", help="Generate a coco meta file.")
@click.argument("dataset_name")
@click.option("--directory", "-d",
              default=".",
              help="Where to generate the coco meta file, default to current directory.")
def import_coco(dataset_name, directory):
    directory = os.path.abspath(directory)
    targ_file = os.path.join(directory, f"{dataset_name}.py")

    if os.path.exists(targ_file):
        print(f"[{targ_file}] already exists, exit...")
        return

    tmpl_file = pkg_resources.resource_filename("deepdataspace", "samples/coco_dataset_meta.py")
    with open(tmpl_file, "r") as fp:
        tmpl = fp.read()
        tmpl = tmpl.replace('dataset_name = "instances_val2017"',
                            f'dataset_name = "{dataset_name}\"')

    os.makedirs(directory, exist_ok=True)
    with open(targ_file, "w") as fp:
        fp.write(tmpl)

    print(f"A template of coco meta file is generated in `{directory}`.\n"
          f"Please edit it as you need and import it by command:\n"
          f"  `ddsop import_one {targ_file}`")
