/* eslint-disable @typescript-eslint/no-namespace */
import { request } from '@umijs/max';
import { Modal } from 'antd';
import { globalLocaleText } from 'dds-utils/locale';
import { EnumModelType, EnumTaskStatus } from '../constants';

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

  export interface FetchAIDetectionReq {
    image: string;
    text: string;
  }

  export interface FetchIVPReq {
    promptImage: string;
    inferImage: string;
    prompts: {
      type: string; // 'rect' | 'point'
      isPositive: boolean;
      rect?: number[]; // [xmin, ymin, xmax, ymax];
      point?: number[]; // [x, y]
    }[];
    labelTypes: string[]; // ["bbox", "mask"]
  }

  export interface FetchAIPolygonSegmentReq {
    image: string; // image_id://  | base64://  | http://  | https://
    density: number; // (0, 1) default 0.2
    area: number[]; // [xmin, ymin, xmax, ymax];
    prompts: {
      type: string; // 'rect' | 'point' | 'stroke' | 'modify';
      isPositive: boolean; //
      rect?: number[]; // [xmin, ymin, xmax, ymax];
      point?: number[]; // [x, y]
      stroke?: number[]; // [x1, y1, x2, y2, ...];
      radius?: number; // brush size while using stroke prompt
      polygons?: number[][]; // [[x1, y1, x2, y2, ...], [xn, yn, xn+1, yn+1, ...], ....];
    }[];
    sessionId?: string;
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

  export interface FetchIVPRsp {
    objects: Array<{
      bbox?: number[];
      mask?: number[];
      score: number;
    }>;
  }

  export interface FetchAIPolygonSegmentRsp {
    image: string; // image_id://
    sessionId: string;
    polygons: number[][]; // [[x1, y1, x2, y2, ...], [xn, yn, xn+1, yn+1, ...], ....]
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
  export interface FetchUploadSignatureRsp {
    downloadUrl: string;
    uploadUrl: string;
  }

  export interface FetchBetchUploadSignatureRsp {
    fileUrls: {
      fileName: string;
      downloadUrl: string;
      uploadUrl: string;
    }[];
  }
}

async function fetchTaskUuid(
  type: EnumModelType,
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

function fetchTaskResults<T extends EnumModelType>(
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

function fetchMaskTaskResults<T extends EnumModelType>(
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

export async function pollTaskResults<T extends EnumModelType>(
  type: EnumModelType,
  taskUuid: string,
  maxAttempts = 5000,
  interval = 1000,
) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const fetchTaskResultsRequest = [
      EnumModelType.SegmentByMask,
      EnumModelType.MaskEdgeStitching,
      EnumModelType.SegmentEverything,
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

export async function fetchModelResults<T extends EnumModelType>(
  type: EnumModelType,
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

export async function fetchUploadSignature(
  params: {
    fileName: string;
  },
  options?: { [key: string]: any },
) {
  return request<NsApiAnnotator.FetchUploadSignatureRsp>(
    `${process.env.MODEL_API_PATH}/upload_signature`,
    {
      method: 'POST',
      data: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

export async function fetchBatchUploadSignature(
  params: {
    fileNames: string[];
  },
  options?: { [key: string]: any },
) {
  return request<NsApiAnnotator.FetchBetchUploadSignatureRsp>(
    `${process.env.MODEL_API_PATH}/batch_upload_signatures`,
    {
      method: 'POST',
      data: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

export const putFile = async (
  uploadUrl: string,
  file?: File,
  contentType?: string,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!file) reject(null);
    fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType || '',
      },
      body: file,
    })
      .then((response) => {
        if (response.status === 200) {
          resolve(response);
        } else {
          console.error('Upload file error: ', uploadUrl, response);
          reject(null);
        }
      })
      .catch((error) => {
        console.error('Upload file error: ', uploadUrl, error);
        reject(null);
      });
  });
};

export async function getOssUrlByBlobUrl(
  fileName: string,
  blobUrl: string,
): Promise<string> {
  try {
    const { downloadUrl, uploadUrl } = await fetchUploadSignature({ fileName });
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }
    const blobData = await response.blob();
    await putFile(uploadUrl, blobData as File);
    return downloadUrl;
  } catch (error: any) {
    throw new Error('Failed to get oss url', error.message);
  }
}
