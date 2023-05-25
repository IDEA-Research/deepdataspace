import { IMG_FLAG } from '@/constants';
import { request } from '@umijs/max';
import { API } from './type';

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
  return request<API.FetchDatasetListRsp>(`/api/v1/datasets`, {
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
  return request<API.FetchDatasetDetailRsp>(
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
  return request<API.FetchImgListRsp>(`/api/v1/images`, {
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
  return request<API.FetchImgListRsp>(`/api/v1/image_flags`, {
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
  return request<API.AsyncTaskRsp>(`/api/v1/tasks/rerank_by_flags`, {
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
  return request<API.AsyncTaskRsp>(
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
  return request<API.FetchImgListRsp>(`/api/v1/annotations`, {
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
  return request<API.FetchImgListRsp>(`/api/v1/comparisons`, {
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
  return request<API.FetchImgListRsp>(`/api/v1/label_clone`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function fetchAiDetectionReq(
  params: {
    imagePath: string;
    targets: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.FetchAiDetectionRsp>(
    `${process.env.MODEL_API_PATH}/aidetection`,
    {
      method: 'POST',
      data: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

export async function fetchAIPoseEstimationReq(
  params: {
    imagePath: string;
    targets: string;
    template: {
      lines: number[];
      pointNames: string[];
      pointColors: string[];
    };
    objects?: Array<{
      categoryName: string;
      boundingBox: IBoundingBox;
      points: number[];
    }>;
  },
  options?: { [key: string]: any },
) {
  return request<API.FetchAIPoseEstimationRsp>(
    `${process.env.MODEL_API_PATH}/aipose`,
    {
      method: 'POST',
      data: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

export async function fetchAISegmentationReq(
  params: {
    imagePath: string;
    categoryName: string;
    clicks: {
      isPositive: boolean;
      position: number[];
    }[];
    polygons: number[][];
    mask: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.FetchAISegmentationRsp>(
    `${process.env.MODEL_API_PATH}/aisegmentation`,
    {
      method: 'POST',
      data: {
        ...params,
      },
      ...(options || {}),
    },
  );
}
