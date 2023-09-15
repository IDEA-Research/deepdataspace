import os

from setuptools import setup

version = "0.8.0"

description = "A tool for CV dataset labeling, visualizing and analysing"
with open("README.md", "r", encoding="utf8") as fp:
    long_description = fp.read()

url = "https://github.com/IDEA-Research/deepdataspace"
author = "cvr@idea"

install_requires = [
    "celery==5.2.7",
    "click==8.1.3",
    "cryptography==41.0.2",
    "Django==4.1.10",
    "djangorestframework==3.14.0",
    "django-cors-headers==3.13.0",
    "numpy==1.22.0",
    "psutil==5.9.2",
    "pydantic==1.10.2",
    "pymongo==4.2.0",
    "PyYAML==6.0",
    "redis==4.4.4",
    "requests==2.31.0",
    "scikit-learn==1.0.2",
    "sentry-sdk==1.19.1",
    "tqdm==4.64.1",
    "whitenoise==6.2.0",
]

classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Science/Research",
    "Topic :: Scientific/Engineering :: Artificial Intelligence",
    "Topic :: Scientific/Engineering :: Image Processing",
    "Topic :: Scientific/Engineering :: Image Recognition",
    "Topic :: Scientific/Engineering :: Information Analysis",
    "Topic :: Scientific/Engineering :: Visualization",
    "Operating System :: MacOS :: MacOS X",
    "Operating System :: POSIX :: Linux",
    "Operating System :: Microsoft :: Windows",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
]


def find_packages(pkg_dir: str):
    found = []

    for top, dirs, files in os.walk(pkg_dir):
        has_init = False
        has_python = False
        for file in files:
            if file == "__init__.py":
                has_init = True
            if file.endswith(".py"):
                has_python = True

        if has_init and has_python:
            found.append(top)

    return found


def get_version():
    return os.environ.get("DDS_PACKAGE_VERSION", None) or version


setup(name="deepdataspace",
      version=get_version(),
      description=description,
      long_description=long_description,
      long_description_content_type="text/markdown",
      url=url,
      author=author,
      packages=find_packages("deepdataspace"),
      include_package_data=True,
      py_modules=["dds", "ddsop"],
      entry_points={
          "console_scripts": [
              "dds=dds:main",
              "ddsop=ddsop:ddsop",
          ],
      },
      install_requires=install_requires,
      classifiers=classifiers,
      )
