/* eslint-disable @typescript-eslint/no-namespace */
import { request } from '@umijs/max';
import { Modal } from 'antd';
import { globalLocaleText } from 'dds-utils/locale';
import { EnumTaskStatus } from '../constants';

export namespace NsApiAnnotator {
  export enum EnumModelType {
    Detection = 'ai_detection',
    SegmentByPolygon = 'ai_segmentation',
    SegmentByMask = 'ai_segmentation_mask',
    Pose = 'ai_pose',
    MaskEdgeStitching = 'ai_mask_edge_stitching',
    SegmentEverything = 'ai_segment_everything',
  }

  export type ModelParam<T extends EnumModelType> =
    T extends EnumModelType.Detection
      ? FetchAIDetectionReq
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

  export interface FetchAIDetectionReq {
    image: string;
    text: string;
  }

  export interface FetchAIPolygonSegmentReq {
    image: string;
    mask: string;
    polygons: number[][];
    clicks: {
      isPositive: boolean;
      position: number[];
    }[];
    rect?: number[];
  }

  export interface FetchAIMaskSegmentReq {
    image?: string; // required when first request
    imageId?: string;
    maskId: string;
    maskRle: number[];
    prompt: {
      type: string; // 'rect' | 'point' | 'stroke';
      isPositive: boolean;
      point?: number[]; // [x, y]
      rect?: number[]; // [xmin, ymin, xmax, ymax];
      stroke?: number[]; // [x1, y1, x2, y2];
      radius?: number;
    }[];
    area: number[]; // [xmin, ymin, xmax, ymax];
  }

  export interface FetchEdgeStitchingReq {
    image?: string; // base64
    imageId?: string;
    rleList: {
      maskRle: number[];
      categoryName: string;
    }[];
    stroke: number[]; // [x1, y1, x2, y2];
    radius: number;
  }

  export interface SegmentEverythingParams {
    pointsPerSide?: number; // default 32
    predIouThresh?: number; // default 0.89
    minMaskRegionArea?: number; // default 300
  }

  export interface FetchSegmentEverythingReq extends SegmentEverythingParams {
    image?: string;
    imageId?: string;
  }

  export interface FetchAIPoseEstimationReq {
    image: string;
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
  }

  export interface FetchAIDetectionRsp {
    objects: Array<{
      categoryName: string;
      boundingBox: IBoundingBox;
      score: number;
      normalizedScore: number;
    }>;
    suggestThreshold: number;
  }

  export interface FetchAIPolygonSegmentRsp {
    polygon: number[][];
    mask: string;
  }

  export interface FetchAIMaskSegmentRsp {
    maskRle: number[]; // rle
    maskId: string;
    imageId: string;
  }
  export interface FetchEdgeStitchingRsp {
    rleList: {
      maskRle: number[];
      categoryName: string;
    }[];
  }
  export interface FetchAIPoseEstimationRsp {
    objects: Array<{
      categoryName: string;
      boundingBox: IBoundingBox;
      points: number[];
      conf: number;
    }>;
  }

  export interface FetchSegmentEverythingRsp {
    rleList: {
      maskRle: number[];
    }[];
  }

  export interface fetchTaskUuid {
    taskUuid: string;
  }

  export interface FetchModelRsp<T extends EnumModelType> {
    error: string;
    status: EnumTaskStatus;
    uuid: string;
    result: ModelResult<T>;
  }
}

async function fetchTaskUuid(
  type: NsApiAnnotator.EnumModelType,
  params: any,
  options?: { [key: string]: any },
) {
  return request<NsApiAnnotator.fetchTaskUuid>(
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

function fetchTaskResults<T extends NsApiAnnotator.EnumModelType>(
  taskUuid: string,
  options?: { [key: string]: any },
) {
  return request<NsApiAnnotator.FetchModelRsp<T>>(
    `${process.env.MODEL_API_PATH}/task_statuses/${taskUuid}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

function fetchMaskTaskResults<T extends NsApiAnnotator.EnumModelType>(
  taskUuid: string,
  options?: { [key: string]: any },
) {
  return request<NsApiAnnotator.FetchModelRsp<T>>(
    `${process.env.MODEL_API_PATH}/mask_task_statuses/${taskUuid}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function pollTaskResults<T extends NsApiAnnotator.EnumModelType>(
  type: NsApiAnnotator.EnumModelType,
  taskUuid: string,
  maxAttempts = 5000,
  interval = 1000,
) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const fetchTaskResultsRequest = [
      NsApiAnnotator.EnumModelType.SegmentByMask,
      NsApiAnnotator.EnumModelType.MaskEdgeStitching,
      NsApiAnnotator.EnumModelType.SegmentEverything,
    ].includes(type)
      ? fetchMaskTaskResults
      : fetchTaskResults;
    const results = await fetchTaskResultsRequest<T>(taskUuid);

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

export async function fetchModelResults<T extends NsApiAnnotator.EnumModelType>(
  type: NsApiAnnotator.EnumModelType,
  params: NsApiAnnotator.ModelParam<T>,
) {
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
    } else {
      throw new Error(error.message);
    }
  }
}
