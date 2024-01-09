#! python
"""
deepdataspace.scripts.start

This script implements the dds command to start the dds tool.

Usage: dds.py [OPTIONS] [DATA_DIR]

Options:
  --quickstart    Quick start dds with sample datasets instead of a specified
                  DATA_DIR, default false. This overwrites the DATA_DIR
                  argument.
  -V, --verbose   Display detailed logs on console, default false.
  -P, --public    Enable public access from your network neighbors, default
                  false. This sets the service host by an auto-detected
                  outward IP address.
  --host TEXT     Set the http service host. This overwrites the '--public'
                  flag.
  --port INTEGER  Set the http service port, default 8765.
  --reload        Auto reload service on code change, for development only.
  --help          Show this message and exit.
"""
import os

import click

from deepdataspace.services import DDS


@click.command()
@click.argument("data_dir", required=False)
@click.option("--quickstart",
              is_flag=True, default=None,
              help="Quick start dds with sample datasets instead of a specified DATA_DIR, default false. "
                   "This overwrites the DATA_DIR argument.")
@click.option("--verbose", "-V", is_flag=True, default=None,
              help="Display detailed logs on console, default false.")
@click.option("--public", "-P", is_flag=True, default=None,
              help="Enable public access from your network neighbors, default false. "
                   "This sets the service host by an auto-detected outward IP address.")
@click.option("--host",
              help=f"Set the http service host. This overwrites the '--public' flag.")
@click.option("--port",
              help="Set the http service port, default 8765.")
@click.option("--reload", is_flag=True, default=None,
              help="Auto reload service on code change, for development only.")
@click.option("--configfile", "-C",
              help="Load the target yaml file to initialize more configurations. "
                   "The command line options take precedence of the config file.")
def start_dds(data_dir, quickstart, verbose, public, host, port, reload, configfile):
    dds = DDS(data_dir, quickstart, verbose, public, host, port, reload, configfile, from_cmdline=True)
    dds.start()
