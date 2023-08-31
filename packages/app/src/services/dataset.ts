import { IMG_FLAG } from '@/constants';
import { request } from '@umijs/max';
import { NsApiDataset } from '@/types/api';

// function sleep(time: number) {
//   return new Promise((resolve) => setTimeout(resolve, time));
// }

export async function fetchDatasetList(
  params: {
    pageNum: number;
    pageSize: number;
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.FetchDatasetListRsp>(`/api/v1/datasets`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function fetchDatasetDetail(
  params: {
    datasetId: string;
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.FetchDatasetDetailRsp>(
    `/api/v1/datasets/${params.datasetId}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function fetchImgList(
  params: {
    datasetId: string;
    categoryId?: string;
    flag?: IMG_FLAG;
    labelId?: string;
    pageNum: number;
    pageSize: number;
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.FetchImgListRsp>(`/api/v1/images`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function saveFlagReq(
  params: {
    datasetId: string;
    flagGroups: {
      flag: IMG_FLAG;
      ids: string[];
    }[];
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.FetchImgListRsp>(`/api/v1/image_flags`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function rerankByFlags(
  params: {
    datasetId: string;
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.AsyncTaskRsp>(`/api/v1/tasks/rerank_by_flags`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function queryAsyncTaskStatus(
  params: {
    name: string;
    id: string;
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.AsyncTaskRsp>(
    `/api/v1/tasks/${params.name}/${params.id}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function saveAnnotationsReq(
  params: {
    datasetId: string;
    imageId: string;
    annotations: {
      categoryName?: string;
      boundingBox?: IBoundingBox;
      points?: number[];
      pointColor?: string[];
      pointName?: string[];
      lines?: number[];
    }[];
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.FetchImgListRsp>(`/api/v1/annotations`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function fetchComparisonsImgList(
  params: {
    datasetId: string;
    labelId: string;
    precision: number;
    orderBy?: string;
    displayCategoryId?: string;
    pageNum: number;
    pageSize: number;
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.FetchImgListRsp>(`/api/v1/comparisons`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function labelClone(
  params: {
    datasetId: string;
    srcLabelId: string;
    dstLabelName?: string;
  },
  options?: { [key: string]: any },
) {
  return request<NsApiDataset.FetchImgListRsp>(`/api/v1/label_clone`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}
