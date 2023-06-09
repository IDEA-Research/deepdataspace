# DeepDataSpace


---

<div align="center">
<p align="center">

<!-- prettier-ignore -->
<img src="https://deepdataspace.oss-cn-shenzhen.aliyuncs.com/public/dds-log-sm.png" height="55px"> &nbsp;

**The Go-To Choice for CV Data Visualization, Annotation, and Model Analysis.**

---

<!-- prettier-ignore -->
<a href="https://deepdataspace.com">Website</a> •
<a href="https://docs.deepdataspace.com">Docs</a> •
<a href="https://docs.deepdataspace.com/tutorials">Tutorials</a> •

![codecov](https://codecov.io/gh/deepdataspace/deepdataspace/branch/main/graph/badge.svg?token=7KEQMEAAD2)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fdeepdataspace.com)](https://deepdataspace.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

[![PyPI python](https://img.shields.io/pypi/pyversions/deepdataspace)](https://pypi.org/project/deepdataspace)
[![PyPI version](https://img.shields.io/pypi/v/deepdataspace)](https://pypi.org/project/deepdataspace)
![PyPI - Downloads](https://img.shields.io/pypi/dm/deepdataspace)

[![DeepDataSpace](https://user-images.githubusercontent.com/10917115/240789070-6c8b53c1-8689-41da-a978-a791b6e293ec.png)](https://deepdataspace.com)

</p>
</div>

---

Deep Data Space (DDS) is an open-source dataset tool with these features out-of-box:

- [x] interactive dataset visualization and exploration
- [x] intelligent annotation with a collaborative workflow
- [ ] efficient model management and performance analysis

## 1. Installation

### 1.1 Prerequisites
DeepDataSpace(DDS) requires **Python 3.8 - 3.10** and runs on the following platforms:
- Mac, x86/arm64
- Windows 10, x86/x64
- Ubuntu 18.04/20.04/22.04, x86/x64

### 1.2 Installing from PyPI

```bash
python3 -m pip install pip --upgrade
python3 -m pip install deepdataspace
```

## 2. Quick Start

The `dds` command will be available once the `deepdataspace` is installed, with which you can quickly start the DDS
tool.

```bash
dds --quickstart

# Started DDS[${pid}] at http://127.0.0.1:8765.
# The DDS tool is importing datasets inside dir in the background: $HOME/.deepdataspace/dataset-samples.
# Explore other useful commands by: ddsop --help.
# You can quit the DDS tool with Ctrl+C.
```

It takes a while the first time you start the DDS tool, as it is downloading extra dependencies to set up a runtime
environment.  
Once the DDS tool is started, visit [http://127.0.0.1:8765](http://127.0.0.1:8765) and you will see the flowing sample datasets:  

https://user-images.githubusercontent.com/10917115/240788538-f1fa8d52-7d93-4fe3-bf42-55284074febd.mp4

## 3. Alternative Installation Methods

### 3.1 Installing from Source Code

```bash

# clone the source code
git clone https://github.com/IDEA-Research/deepdataspace.git

# prepare the node environment（if you haven't installed the Pnpm and Node environment yet）
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm env use --global lts

# compile frontend files
pnpm i
pnpm run build:app

# copy frontend files to python package dir
rm -rf deepdataspace/server/static/*
cp -R packages/app/dist/* deepdataspace/server/static/
cp deepdataspace/server/static/index.html deepdataspace/server/templates/

# install the package
python3 -m pip install pip --upgrade
python3 -m pip install -r requirements.txt
python3 setup.py install
```

After the installation, you can start DDS the same way as above:
```
dds --quickstart
```

### 3.2 Installing from Docker Image
#### Step 1: Preparation

```shell
# pull the latest docker image
docker pull deepdataspace/dds

# create a docker volume for dds to persistent data
docker volume create dds-runtime

# choose a visiting port for DDS
export DDS_PORT=8765
```

#### Step 2: Start DDS in quickstart mode

```shell
# start the DDS in quickstart mode
# DDS will download some sample datasets and import them
docker run -it --name dds --rm \
    -p $DDS_PORT:8765  \
    -v dds-runtime:/dds/runtime \
    deepdataspace/dds \
    dds --quickstart -V
```

If everything goes well, you can start visit DDS at [http://127.0.0.1:8765](http://127.0.0.1:8765)

#### Step 3: Mount your dataset directory(**Optional**)

If you start DDS in `quickstart` mode, DDS will try to download some sample datasets and import them for you.  
But most frequently, you want DDS to import your local dataset files. This is possible by mouting your local dataset directory to `/dds/datasets` inside container.

```
# assume $PWD/datasets is your local dataset directory
mkdir -p datasets

# start the container without quickstart mode
docker run -it --name dds --rm \
    -p 54321:8765  \
    -v dds-runtime:/dds/runtime \
    -v $PWD/datasets:/dds/datasets:ro \
    deepdataspace/dds \
    dds -V
```

## 4. Documentation

Visit our [documentation](https://docs.deepdataspace.com) for more details on how to utilize the powers of DDS.

- [Quick Start](https://docs.deepdataspace.com/quick-start)
- [Tutorials](https://docs.deepdataspace.com/tutorials)
- [API Reference](https://python-docs.deepdataspace.com)

## 5. Uninstallation

For users who installed DDS from PyPi or source code, just uninstall DDS with `pip` and delete the runtime files. 
```shell
pip uninstall deepdataspace

rm -rf ~/.deepdataspace/* # use with caution, it will delete all datasets imported before
```

For users who installed DDS from docker image, just stop the container and remove the docker image and volume.  
```
docker stop dds
docker rmi deepdataspace/dds
docker volume remove dds-runtime # use with caution, it will delete all datasets imported before
```

## 6. License
This project is released under the [Apache 2.0 License](https://github.com/IDEA-Research/deepdataspace/blob/main/LICENSE).
```text
Copyright 2023-present, IDEA

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
