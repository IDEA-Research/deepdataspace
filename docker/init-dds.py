import os
import sys
import time
import zipfile

sys.path.append(os.path.dirname(os.path.abspath("__file__")))

from deepdataspace.utils.network import download_by_requests
from deepdataspace.task import import_and_process_data_dir

sample_dir = "/dds/samples"
sample_file = f"{sample_dir}/dataset-samples.zip"


def download_samples():
    if os.path.exists(sample_file):
        print(f"Sample file {sample_file} already exists, skip downloading.")
        return False

    sample_url = "https://deepdataspace.oss-cn-shenzhen.aliyuncs.com/install_files/datasets/dataset-samples.zip"
    print(f"Downloading {sample_url} to {sample_file}")
    download_by_requests(sample_url, sample_file)

    with zipfile.ZipFile(sample_file, "r") as fp:
        fp.extractall(sample_dir)
    print(f"Extracted {sample_file} to {sample_dir}")


def import_samples():
    task_uuid = import_and_process_data_dir.apply_async(args=(sample_dir, False, True))
    print(task_uuid)


def main():
    download_samples()
    import_samples()


if __name__ == "__main__":
    main()
