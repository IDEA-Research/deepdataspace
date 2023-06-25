FROM node:18-alpine AS frontend-builder

WORKDIR /frontend
COPY . ./
RUN npm install -g pnpm@8.4.0 && \
    pnpm install --frozen-lockfile && \
    pnpm run build:app

FROM python:3.10

WORKDIR /dds/source
COPY . ./
COPY --from=frontend-builder /frontend/packages/app/dist ./deepdataspace/server/static
COPY --from=frontend-builder /frontend/packages/app/dist/index.html ./deepdataspace/server/templates/index.html
RUN mkdir /dds/datasets && \
    mkdir /dds/samples && \
    python3 -m pip install -r requirements.txt && \
    python3 -m pip cache purge
