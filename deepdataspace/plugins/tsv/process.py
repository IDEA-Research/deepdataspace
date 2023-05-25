"""
deepdataspace.plugins.tsv.process

Implement all processors for tsv dataset.
"""

import os
import json
import logging
from typing import List

import numpy as np

from deepdataspace.model.image import Image
from deepdataspace.constants import DatasetType
from deepdataspace.algos.refine_by_seed import refine
from deepdataspace.process.processor import BaseProcessor

logger = logging.getLogger("plugins.tsv.process")


class RankByFlags(BaseProcessor):

    @classmethod
    def dependencies(cls) -> List[str]:
        return []

    @classmethod
    def should_auto_run(cls) -> bool:
        return False

    def can_process(self):
        return self.dataset.type == DatasetType.TSV

    def process_dataset(self):
        logger.info(f"process_dataset starts, dataset_id={self.dataset_id}, subset_name={self.dataset.name}")

        embd_file = self.dataset.files.get("Embedding", None)
        if embd_file is None or not os.path.exists(embd_file):
            logger.warning(f"dataset[{self.dataset.name}] dose not have an embedding file, skip task")
            return

        # load seeds
        dataset = self.dataset
        pos_ids = [img.id for img in Image(dataset.id).find_many({"flag": 1})]
        neg_ids = [img.id for img in Image(dataset.id).find_many({"flag": 2})]

        # load embeddings
        with open(embd_file, "r") as fp:
            embeddings = [json.loads(line) for line in fp]
        embeddings = np.array(embeddings)

        # rerank by seeds and embeddings
        sorted_ids = refine(pos_ids, neg_ids, embeddings)

        # update idx field to rerank images
        for new_idx, _id in enumerate(sorted_ids):
            Image(dataset.id).batch_update({"id": int(_id)}, {"idx": int(new_idx)})
        Image(dataset.id).finish_batch_update()
