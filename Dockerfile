FROM node:18-alpine AS frontend-builder

WORKDIR /frontend
COPY . ./
RUN npm install -g pnpm@8.4.0 && \
    pnpm install --frozen-lockfile && \
    pnpm run build:app

FROM deepdataspace/python:3.8 AS dds-builder

WORKDIR /dds/source
COPY . ./
COPY --from=frontend-builder /frontend/packages/app/dist ./deepdataspace/server/static
COPY --from=frontend-builder /frontend/packages/app/dist/index.html ./deepdataspace/server/templates/index.html
RUN python3 setup.py sdist && \
    cd /dds/source/dist/ && \
    mv deepdataspace*.tar.gz deepdataspace.tar.gz

FROM deepdataspace/python:3.8
RUN mkdir -p /dds/runtime && \
    mkdir -p /dds/datasets && \
    rm -rf /root/.config/pip

WORKDIR /dds
COPY --from=dds-builder /dds/source/dist/deepdataspace.tar.gz /tmp/deepdataspace.tar.gz
RUN cd /tmp && \
    pip3 install deepdataspace.tar.gz && \
    pip cache purge

ENV PYTHONUNBUFFERED=1 DDS_IN_DOCKER=1
ADD Dockerfile /root/dds.Dockerfile
