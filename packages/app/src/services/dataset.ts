import { IMG_FLAG } from '@/constants';
import { request } from '@umijs/max';
import { API, EnumModelType, EnumTaskStatus, ModelParam } from './type';
import { Modal } from 'antd';
import { globalLocaleText } from '@/locales/helper';

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

async function fetchTaskUuid(
  type: EnumModelType,
  params: any,
  options?: { [key: string]: any },
) {
  return request<API.fetchTaskUuid>(
    `${process.env.MODEL_API_PATH}/tasks/${type}`,
    {
      method: 'POST',
      data: {
        ...params,
      },
      ...(options || {
        hideCodeErrorMsg: true,
      }),
    },
  );
}

function fetchTaskResults<T extends EnumModelType>(
  taskUuid: string,
  options?: { [key: string]: any },
) {
  return request<API.FetchModelRsp<T>>(
    `${process.env.MODEL_API_PATH}/task_statuses/${taskUuid}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function pollTaskResults<T extends EnumModelType>(
  taskUuid: string,
  maxAttempts = 5000,
  interval = 1000,
) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const results = await fetchTaskResults<T>(taskUuid);

    if (results.status === EnumTaskStatus.Success) {
      return results.result;
    }

    if (results.status === EnumTaskStatus.Failed) {
      throw new Error(results.error);
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, interval);
    });
    attempts++;
  }

  throw new Error('Max attempts exceeded');
}

export async function fetchModelResults<T extends EnumModelType>(
  type: EnumModelType,
  params: ModelParam<T>,
) {
  try {
    const { taskUuid } = await fetchTaskUuid(type, params);
    const result = await pollTaskResults<T>(taskUuid);
    return result;
  } catch (error: any) {
    // status 429 indicates warning for rate limit of AI annotate request
    if (error.response.status === 429) {
      Modal.info({
        title: globalLocaleText('smartAnnotation.rateLimit.title'),
        centered: true,
        content: globalLocaleText('smartAnnotation.rateLimit.content'),
        okText: globalLocaleText('smartAnnotation.rateLimit.okText'),
        onOk: () => {},
      });
    } else {
      throw new Error(error.message);
    }
  }
}
