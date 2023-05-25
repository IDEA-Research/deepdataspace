"""
deepdataspace.algos.refine_by_seed

This module provides a algorithm for resorting dataset by seed images.
"""

import logging

import numpy as np
from sklearn.svm import SVC

logger = logging.getLogger("algos.refine_by_seed")


def norm_embedding(embeddings, axis=0, keepdims=True):
    """
    :param embeddings: np.ndarray of embedding matrix
    :param axis: the axis normalized
    :param keepdims: if True return array will keepdims
    :return merge_dist: 1D-np.ndarray, similarity combine pos_dist and neg_dist
    """
    embeddings += 1e-10
    norm_embeddings = embeddings / np.linalg.norm(embeddings, axis=axis, keepdims=keepdims)
    return norm_embeddings


def calculate_mean_similarity(seed_embd, embeddings):
    """
    :param seed_embd: np.ndarray of seed images embedding matrix
    :param embeddings: np.ndarray of all images embedding matrix
    :return similarity_dist: np.ndarray of similarity of seed_embd and embeddings
    """
    norm_seed_embd = norm_embedding(seed_embd, axis=1)
    norm_embeddings = norm_embedding(embeddings, axis=1)
    cos_sim_dist = np.abs(np.dot(norm_embeddings, norm_seed_embd.T))
    mean_cos_sim_dist = np.mean(cos_sim_dist, axis=1)
    similarity_dist = 1 - mean_cos_sim_dist
    return similarity_dist


def calculate_min_similarity(seed_embd, embeddings):
    """
    :param seed_embd: np.ndarray of seed images embedding matrix
    :param embeddings: np.ndarray of all images embedding matrix
    :return similarity_dist: np.ndarray of similarity of seed_embd and embeddings
    """

    norm_seed_embd = norm_embedding(seed_embd, axis=1)
    norm_embeddings = norm_embedding(embeddings, axis=1)
    cos_sim_dist = np.abs(np.dot(norm_embeddings, norm_seed_embd.T))
    min_cos_sim_dist = np.max(cos_sim_dist, axis=1)
    similarity_dist = 1 - min_cos_sim_dist
    return similarity_dist


def merge_dist(pos_dist, neg_dist):
    """
    :param pos_dist: 1D-np.ndarray, similarity between positive seeds embd and all images embd
    :param neg_dist: 1D-np.ndarray, similarity between negtive seeds embd and all images embd
    :return merge_dist: 1D-np.ndarray, similarity combine pos_dist and neg_dist
    """

    merged_dist = pos_dist - neg_dist
    return merged_dist


def similarity_classifier(pos_seeds, neg_seeds, embeddings):
    """
    :param pos_seeds: a list of positive seed idx
    :param neg_seeds: a list of negative seed idx
    :param embeddings: np.ndarray of all images embedding matrix
    :return idx_list: a list of refined and re-sorted idx
    """
    pos_seed_embd = embeddings[pos_seeds] if pos_seeds else None
    neg_seed_embd = embeddings[neg_seeds] if neg_seeds else None

    pos_dist, neg_dist = np.array([0.]), np.array([0.])
    if not isinstance(pos_seed_embd, type(None)):
        pos_dist = calculate_mean_similarity(pos_seed_embd, embeddings)
        pos_dist = norm_embedding(pos_dist)
    if not isinstance(neg_seed_embd, type(None)):
        neg_dist = calculate_min_similarity(neg_seed_embd, embeddings)
        neg_dist = norm_embedding(neg_dist)
    merged_dist = merge_dist(pos_dist, neg_dist)
    idx_array = np.argsort(merged_dist)
    idx_list = idx_array.tolist()
    return idx_list


def train_svm_model(pos_seed_embd, neg_seed_embd):
    """
    :param pos_seed_embd: np.ndarray of pos seed images embedding matrix
    :param neg_seed_embd: np.ndarray of neg seed images embedding matrix
    :return model: a trained svc model
    """
    pos_y = np.ones(pos_seed_embd.shape[0])
    neg_y = np.zeros(neg_seed_embd.shape[0])
    X = np.concatenate((pos_seed_embd, neg_seed_embd), axis=0)
    Y = np.concatenate((pos_y, neg_y))
    model = SVC(kernel='linear')
    model.fit(X, Y)
    return model


def svm_classifier(pos_seeds, neg_seeds, embeddings):
    """
    :param pos_seeds: a list of positive seed idx
    :param neg_seeds: a list of negative seed idx
    :param embeddings: np.ndarray of all images embedding matrix
    :return idx_list: a list of refined and re-sorted idx
    """
    pos_seed_embd = embeddings[pos_seeds]
    neg_seed_embd = embeddings[neg_seeds]
    pos_seeds_arr = np.array(pos_seeds)
    neg_seeds_arr = np.array(neg_seeds)

    svm_model = train_svm_model(pos_seed_embd, neg_seed_embd)
    scores = svm_model.predict(embeddings)
    scores_arr = np.array(scores)

    scores_arr[pos_seeds_arr] = 1.0
    scores_arr[neg_seeds_arr] = 0.0

    pred_pos_idx = np.where(scores_arr == 1.0)[0]
    pred_pos_dist = calculate_mean_similarity(pos_seed_embd, embeddings[pred_pos_idx])
    pos_sorted_idx = np.argsort(pred_pos_dist)
    pred_pos_sorted_idx = pred_pos_idx[pos_sorted_idx]

    pred_neg_idx = np.where(scores_arr == 0.0)[0]
    pred_neg_dist = calculate_min_similarity(neg_seed_embd, embeddings[pred_neg_idx])
    neg_sorted_idx = np.argsort(pred_neg_dist)[::-1]
    pred_neg_sorted_idx = pred_neg_idx[neg_sorted_idx]

    idx_list = np.concatenate((pred_pos_sorted_idx, pred_neg_sorted_idx)).tolist()
    return idx_list


def refine(pos_seeds: list, neg_seeds: list, embeddings: np.ndarray):
    """
    :param pos_seeds: a list of positive seed id
    :param neg_seeds: a list of negative seed id
    :param embeddings: a np.ndarray of all images embedding matrix
    :return idx_list: a list of refined and re-sorted idx
    """

    num_imgs, feat_len = embeddings.shape
    if not pos_seeds and not neg_seeds:
        return list(range(num_imgs))
    if pos_seeds and neg_seeds:
        idx_list = svm_classifier(pos_seeds, neg_seeds, embeddings)
    else:
        idx_list = similarity_classifier(pos_seeds, neg_seeds, embeddings)
    return idx_list
