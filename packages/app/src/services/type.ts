/* eslint-disable @typescript-eslint/no-namespace */
import { COMPARE_RESULT, EUserStatus } from '@/constants';
import {
  EProjectStatus,
  EQaAction,
  ETaskImageStatus,
  ETaskStatus,
} from '@/pages/Project/constants';
import { EProjectRole } from '@/pages/Project/models/auth';

/** Definition of public API return. */
export interface CommonRsp<T> {
  code: number;
  message: string;
  data: T;
}

/** Definition of API return data. */
export namespace DATA {
  export interface DataSet {
    id: string;
    name: string;
    description: string;
    numImages: number;
    objectTypes: string[];
    flagExportLink: string;
    groupName: string;
    coverUrl: string;
  }

  export interface BaseObject {
    /** catagory */
    categoryId?: string;
    categoryName?: string;
    boundingBox?: IBoundingBox;
    /** y1,x1,y2,x2 -> x1,y1 */
    segmentation?: string;
    /** matting url */
    alpha?: string;
    /**
     * keypoints：[x, y, z, w, visible, conf, ...]. (Needs to be split manually.)
     * visible 0: not labeled, v=1: labeled but not visible, and v=2: labeled and visible.
     */
    points?: number[];
    /** [r, g, b, ...] */
    pointColors?: string[];
    pointNames?: string[];
    /** Keypoint connection. [start point index, end point index, ...] */
    lines?: number[];
    /** mask */
    maskRle?: number[];
  }

  export interface BaseImage {
    id: string;
    url: string;
    urlFullRes: string;
  }

  export interface AnnotationObject extends DATA.BaseObject {
    labelId: string;
    labelName: string;
    conf: number;
    /** GT/Pred/User */
    source: string;
    /** Comparison results between Object and GT：OK/FN/FP */
    compareResult: COMPARE_RESULT;
    /** Pred index matched in GT analysis mode. */
    matchedDetIdx?: number;
  }

  export interface DataSetImg extends DATA.BaseImage {
    desc: string;
    metadata: Record<string, string>;
    objects: Array<AnnotationObject>;
    /** 0/1/2 */
    flag: number;
    /** Used in page. */
    selected?: boolean;
    curLabelId: string;
  }

  export interface Category {
    id: string;
    name: string;
  }

  export interface Label {
    id: string;
    name: string;
    source: string;
    comparePrecisions: {
      /** The precision of the comparison between annotation set */
      precision: number;
      threshold: number;
      recall: number;
    }[];
    /** Used in page. */
    confidenceRange: [number, number];
  }

  /**
   * Project Manage
   */
  export interface Project {
    id: string;
    name: string;
    description: string;
    categories: string;
    preLabel: string;
    datasets: {
      id: string;
      name: string;
    }[];
    owner: {
      id: string;
      name: string;
    };
    managers: {
      id: string;
      name: string;
    }[];
    taskNumAccepted: number;
    taskNumRejected: number;
    taskNumReviewing: number;
    taskNumTotal: number;
    taskNumWaiting: number;
    taskNumWorking: number;
    status: EProjectStatus;
    batchSize: number;
    labelTimes: number;
    reviewTimes: number;
    /** Unit: ms */
    createdTs: number;
    /** Used in page. */
    userRoles?: EProjectRole[];
  }

  export interface ProjectWorker {
    id: string;
    taskId: string;
    projectId: string;
    userId: string;
    userName: string;
    labelNumWaiting: number;
    reviewNumWaiting: number;
    reviewNumRejected: number;
    reviewNumAccepted: number;
    role: EProjectRole;
  }

  export interface ProjectTask {
    id: string;
    idx: number;
    projectId: string;
    datasetId: string;
    labelLeader?: ProjectWorker;
    reviewLeader?: ProjectWorker;
    labelers: ProjectWorker[];
    reviewers: ProjectWorker[];
    numTotal: number;
    status: ETaskStatus;
    createdTs: number;
  }

  export interface TaskLabel {
    id: string;
    userId: string;
    userName: string;
    status: ETaskImageStatus;
    createdTs: number;
    annotations: DATA.BaseObject[];
  }

  export interface TaskReview {
    id: string;
    userId: string;
    userName: string;
    action: EQaAction;
    labelId: string;
    createdTs: number;
  }

  export interface TaskImage extends DATA.BaseImage {
    taskId: string;
    /** Pre-annotation data. */
    defaultLabels?: TaskLabel;
    labels: TaskLabel[];
    reviews: TaskReview[];
    /** Used in page. */
    labeled?: boolean;
  }
}

export enum EnumModelType {
  Detection = 'ai_detection',
  SegmentByPolygon = 'ai_segmentation',
  SegmentByMask = 'ai_segmentation_mask',
  Pose = 'ai_pose',
  MaskEdgeStitching = 'ai_mask_edge_stitching',
  SegmentEverything = 'ai_segment_everything',
}

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

export enum EnumTaskStatus {
  Waiting = 'waiting',
  Running = 'running',
  Success = 'success',
  Failed = 'failed',
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

/** Definition of API input and output. */
export namespace API {
  export interface FetchDatasetListRsp {
    datasetList: Array<DATA.DataSet>;
    total: number;
  }

  export interface FetchDatasetDetailRsp {
    categoryList: Array<DATA.Category>;
    labelList: Array<DATA.Label>;
    objectTypes: Array<string>;
  }

  export interface FetchImgListRsp {
    imageList: Array<DATA.DataSetImg>;
    total: number;
  }

  export interface AsyncTaskRsp {
    id: string;
    name: string;
    status: 'waiting' | 'running' | 'success' | 'fail';
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

  /**
   * User
   */
  export interface FetchUserInfoRsp {
    name: string;
    id: string;
    status: EUserStatus;
    isStaff: boolean;
  }

  export interface ReqLoginRsp {
    username: string;
    userId: string;
    token: string;
    isStaff: boolean;
  }

  /**
   * Project Manage
   */
  export interface FetchProjectListRsp {
    projectList: Array<DATA.Project>;
    total: number;
  }

  export interface FetchDatasetLintRsp {
    datasetList: {
      id: string;
      name: string;
      valid: boolean;
    }[];
  }

  export interface FetchUserLintRsp {
    userList: {
      id: string;
      name: string;
    }[];
  }

  export interface FetchProjectTasksRsp {
    taskList: Array<DATA.ProjectTask>;
    total: number;
  }

  export interface RequestLabelTaskRolesRsp {
    roleList: Array<DATA.ProjectWorker>;
  }

  export interface RequestLabelTaskConfigsRsp {
    categoryList: Array<DATA.Category>;
  }

  export interface RequestLabelTaskImagesRsp {
    imageList: Array<DATA.TaskImage>;
    total: number;
    pageSize: number;
    pageNum: number;
  }
}
