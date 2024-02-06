/* eslint-disable @typescript-eslint/no-namespace */
import { request } from '@umijs/max';
import { Modal } from 'antd';
import { globalLocaleText } from 'dds-utils/locale';

import { EnumModelType, EnumTaskStatus } from '../constants';
import { IMask, ReqPromptItem } from '../type';

export namespace NsApiAnnotator {
  export type ModelParam<T extends EnumModelType> =
    T extends EnumModelType.Detection
      ? FetchAIDetectionReq
      : T extends EnumModelType.IVP
      ? FetchIVPReq
      : T extends EnumModelType.SegmentByPolygon
      ? FetchAIPolygonSegmentReq
      : T extends EnumModelType.SegmentByMask
      ? FetchAIMaskSegmentReq
      : T extends EnumModelType.MaskEdgeStitching
      ? FetchEdgeStitchingReq
      : T extends EnumModelType.SegmentEverything
      ? FetchSegmentEverythingReq
      : T extends EnumModelType.Pose
      ? FetchAIPoseEstimationReq
      : never;

  export type ModelResult<T extends EnumModelType> =
    T extends EnumModelType.Detection
      ? FetchAIDetectionRsp
      : T extends EnumModelType.IVP
      ? FetchIVPRsp
      : T extends EnumModelType.SegmentByPolygon
      ? FetchAIPolygonSegmentRsp
      : T extends EnumModelType.SegmentByMask
      ? FetchAIMaskSegmentRsp
      : T extends EnumModelType.MaskEdgeStitching
      ? FetchEdgeStitchingRsp
      : T extends EnumModelType.SegmentEverything
      ? FetchSegmentEverythingRsp
      : T extends EnumModelType.Pose
      ? FetchAIPoseEstimationRsp
      : never;

  export interface CommonReqParams {
    image?: string;
    sessionId?: string;
  }

  export interface FetchAIDetectionReq extends CommonReqParams {
    prompts: ReqPromptItem[];
  }

  export interface FetchIVPReq extends CommonReqParams {
    promptImage?: string;
    inferImage?: string;
    labelTypes: string[]; // ["bbox", "mask"]
    prompts: ReqPromptItem[];
  }

  export interface FetchAIPolygonSegmentReq extends CommonReqParams {
    density: number; // (0, 1) default 0.2
    prompts: ReqPromptItem[];
  }

  export interface FetchAIMaskSegmentReq extends CommonReqParams {
    prompts: ReqPromptItem[];
  }

  export interface FetchEdgeStitchingReq extends CommonReqParams {
    masks: IMask[];
    prompts: ReqPromptItem[];
  }

  export interface FetchSegmentEverythingReq extends CommonReqParams {
    pointsPerSide?: number; // default 32
    predIouThresh?: number; // default 0.89
    minMaskRegionArea?: number; // default 300
  }

  export interface FetchAIPoseEstimationReq extends CommonReqParams {
    objects?: Array<{
      bbox: [number, number, number, number];
      keypoints: number[]; // [x, y, visible, conf, ...]
    }>;
  }

  export interface FetchAIDetectionRsp {
    objects: Array<{
      bbox: [number, number, number, number];
      score: number;
    }>;
    suggestThreshold: number;
  }

  export interface FetchIVPRsp {
    objects: Array<{
      bbox?: number[];
      mask?: IMask;
      maskUrl?: string;
      score: number;
    }>;
  }

  export interface FetchAIPolygonSegmentRsp {
    polygons: number[][]; // [[x1, y1, x2, y2, ...], [xn, yn, xn+1, yn+1, ...], ....]
  }

  export interface FetchAIMaskSegmentRsp {
    mask: IMask;
  }
  export interface FetchEdgeStitchingRsp {
    masks: IMask[];
  }
  export interface FetchAIPoseEstimationRsp {
    objects: Array<{
      bbox: [number, number, number, number];
      keypoints: number[]; // [x, y, visible, conf, ...]
      score: number;
    }>;
  }

  export interface FetchSegmentEverythingRsp {
    masks: IMask[];
  }

  export interface fetchTaskUuid {
    taskUuid: string;
  }

  export interface FetchModelRsp<T extends EnumModelType> {
    error: string;
    status: EnumTaskStatus;
    uuid: string;
    sessionId: string;
    result: ModelResult<T>;
  }
}

async function fetchTaskUuid(
  type: EnumModelType,
  params: any,
  options?: { [key: string]: any },
) {
  const postUrl = process.env.MODEL_API_PATH
    ? `${process.env.MODEL_API_PATH}/tasks/${type}`
    : `/v1/algos/${type}`;
  return request<NsApiAnnotator.fetchTaskUuid>(postUrl, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {
      hideCodeErrorMsg: true,
    }),
  });
}

function fetchTaskResults<T extends EnumModelType>(
  taskUuid: string,
  options?: { [key: string]: any },
) {
  const getUrl = process.env.MODEL_API_PATH
    ? `${process.env.MODEL_API_PATH}/task_statuses/${taskUuid}`
    : `/v1/algos/tasks/${taskUuid}`;
  return request<NsApiAnnotator.FetchModelRsp<T>>(getUrl, {
    method: 'GET',
    ...(options || {}),
  });
}

export async function pollTaskResults<T extends EnumModelType>(
  type: EnumModelType,
  taskUuid: string,
  maxAttempts = 5000,
  interval = 1000,
) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const rsp = await fetchTaskResults<T>(taskUuid);

    if (rsp.status === EnumTaskStatus.Success) {
      return rsp;
    }

    if (rsp.status === EnumTaskStatus.Failed) {
      throw new Error(rsp.error);
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
  params: NsApiAnnotator.ModelParam<T>,
): Promise<NsApiAnnotator.FetchModelRsp<T>> {
  try {
    const { taskUuid } = await fetchTaskUuid(type, params);
    const result = await pollTaskResults<T>(type, taskUuid);
    return result;
  } catch (error: any) {
    // status 429 indicates warning for rate limit of AI annotate request
    if (error.response.status === 429) {
      Modal.info({
        title: globalLocaleText('DDSAnnotator.smart.rateLimit.title'),
        centered: true,
        content: globalLocaleText('DDSAnnotator.smart.rateLimit.content'),
        okText: globalLocaleText('DDSAnnotator.smart.rateLimit.okText'),
        onOk: () => {},
      });
    }
    throw new Error(error.message);
  }
}
