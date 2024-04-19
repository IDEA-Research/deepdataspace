#!/bin/bash

set -e

echo "deleting local env file..."
rm -f packages/app/.env.local

echo "compile frontend files..."
pnpm run --filter app build

echo "copy frontend files to python package dir..."
rm -rf deepdataspace/server/static/*
cp -R packages/app/dist/* deepdataspace/server/static/
cp deepdataspace/server/static/index.html deepdataspace/server/templates/

echo "frontend files updated!"
