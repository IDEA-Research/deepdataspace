#! python
"""
dds.py

This script starts the dds tool.

Usage: dds.py [OPTIONS] [DATA_DIR]

Options:
  --quickstart       Quick start dds with sample datasets instead of a
                     specified DATA_DIR, default false. This overwrites the
                     DATA_DIR argument.
  -V, --verbose      Display detailed logs on console, default false.
  -P, --public       Enable public access from your network neighbors, default
                     false. This sets the service host by an auto-detected
                     outward IP address.
  --host TEXT        Set the http service host. This overwrites the '--public'
                     flag.
  --port TEXT        Set the http service port, default 8765.
  --reload           Auto reload service on code change, for development only.
  --configfile TEXT  Load the target yaml file to initialize more
                     configurations. The command line options take precedence
                     of the config file.
  --help             Show this message and exit.
"""
import os

os.environ["DDS_STARTING"] = "1"

from deepdataspace.scripts.start import start_dds


def main():
    start_dds()


if __name__ == "__main__":
    main()
