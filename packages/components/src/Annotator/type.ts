import {
  EBasicToolItem,
  EElementType,
  EObjectType,
  ESubToolItem,
  EToolType,
} from './constants';
import { RectAnchor } from './utils/compute';

export interface Category {
  id: string;
  name: string;
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
  mask?: number[];
}

export interface DrawObject extends BaseObject {
  conf?: number;
  labelId?: string;
  compareResult?: string;
}

export interface DrawImageData {
  id: string;
  url: string;
  urlFullRes: string;
  objects: DrawObject[];
  metadata?: Record<string, string>;
  caption?: string;
}

export enum EObjectStatus {
  Unchecked,
  Checked,
  Commited,
}

export interface IAnnotationObject {
  type: EObjectType;
  label: string;
  hidden: boolean;
  color: string; // hex
  rect?: IElement<IRect>;
  polygon?: IElement<IPolygonGroup>;
  keypoints?: {
    points: IElement<IPoint>[];
    lines: number[];
  };
  maskRle?: number[];
  maskCanvasElement?: any;
  alpha?: string;
  alphaImageElement?: any;
  conf?: number;
  labelId?: string;
  compareResult?: string;
  status: EObjectStatus;
}

export interface ICreatingMaskStep {
  tool: ESubToolItem;
  /** Add / Erase an area for Mask */
  positive: boolean;
  /** The points stroked by Pen Tool or Brush Tool */
  points: IPoint[];
  radius: number;
}

export interface ICreatingObject extends IAnnotationObject {
  /** To determine Which polygon corresponds to the creation of a new polygon */
  currIndex?: number;
  /** Starting stretching point when creating a new Rect/Skeleton object */
  startPoint?: IPoint;
  /** Currently drawing path creating by Pen Tool or Brush Tool */
  maskStep?: ICreatingMaskStep;
  /** Steps for creating mask object */
  tempMaskSteps?: ICreatingMaskStep[];
}

export enum EMaskPromptType {
  Rect = 'rect',
  Point = 'point',
  Stroke = 'stroke',
  EdgeStitch = 'edgeStitch',
}

export type MaskPromptItem = {
  type: EMaskPromptType;
  isPositive: boolean;
  startPoint?: IPoint;
  rect?: IRect;
  point?: IPoint;
  stroke?: IPoint[];
  radius?: number;
};

export interface IPrompt {
  creatingMask?: MaskPromptItem;
  maskPrompts?: MaskPromptItem[];
  segmentationClicks?: {
    point: IPoint;
    isPositive: boolean;
  }[];
  segmentationMask?: string;
  activeRectWhileLoading?: IRect;
}

/**
 * Need to be saved in history
 */
export interface DrawData {
  initialized: boolean;

  /** Selected tool */
  selectedTool: EToolType;
  selectedSubTool: ESubToolItem;
  AIAnnotation: boolean;
  brushSize: number;

  /** drawed */
  objectList: IAnnotationObject[];

  /** drawing */
  activeClassName: string;
  activeObjectIndex: number;
  creatingObject?: ICreatingObject; // - editing / creating
  isBatchEditing: boolean; // active while handle batch predictions by model
  limitConf: number;

  /** prompt actions */
  prompt: IPrompt;
}

export interface IImageDisplayOptions {
  brightness: number;
  contrast: number;
  saturate: number;
}

export interface IAnnotsDisplayOptions {
  colorByCategory: boolean; // color by category by instance
}

export interface EditState {
  isLoading: boolean;
  isLoadingError: boolean;
  isRequiring: boolean;
  allowMove: boolean;
  latestLabel: string;
  startRectResizeAnchor?: RectAnchor;
  startElementMovePoint?: {
    topLeftPoint: IPoint;
    mousePoint: IPoint;
    initPoint?: IPoint;
  };
  focusObjectIndex: number;
  foucsObjectAllIndexs: number[];
  focusEleType: EElementType;
  focusEleIndex: number;
  focusPolygonInfo: {
    index: number;
    pointIndex: number;
    lineIndex: number;
  };
  imageCacheId?: string;
  isCtrlPressed: boolean;
  hideCreatingObject: boolean;
  imageDisplayOptions: IImageDisplayOptions;
  annotsDisplayOptions: IAnnotsDisplayOptions;
}

export const enum EditorMode {
  View,
  Edit,
  Review,
}

export enum EQaAction {
  Accept = 'accept',
  Reject = 'reject',
  ForceAccept = 'force_accept',
}

export const DEFAULT_DRAW_DATA: DrawData = {
  initialized: false,

  /** Selected tool */
  selectedTool: EBasicToolItem.Drag,
  selectedSubTool: ESubToolItem.PenAdd,
  AIAnnotation: false,

  /** drawed */
  objectList: [],
  activeObjectIndex: -1,
  activeClassName: '',
  creatingObject: undefined,
  brushSize: 20,
  prompt: {},
  isBatchEditing: false,
  limitConf: 0,
};

export const DEFAULT_IMG_DISPLAY_OPTIONS: IImageDisplayOptions = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
};

export const DEFAULT_ANNOTS_DISPLAY_OPTIONS: IAnnotsDisplayOptions = {
  colorByCategory: true,
};

export const DEFAULT_EDIT_STATE: EditState = {
  isLoading: false,
  isLoadingError: false,
  isRequiring: false,
  allowMove: false,
  latestLabel: '',
  startRectResizeAnchor: undefined,
  startElementMovePoint: undefined,
  focusObjectIndex: -1,
  foucsObjectAllIndexs: [],
  focusEleType: EElementType.Rect,
  focusEleIndex: -1,
  focusPolygonInfo: {
    index: -1,
    pointIndex: -1,
    lineIndex: -1,
  },
  isCtrlPressed: false,
  hideCreatingObject: false,
  imageDisplayOptions: DEFAULT_IMG_DISPLAY_OPTIONS,
  annotsDisplayOptions: DEFAULT_ANNOTS_DISPLAY_OPTIONS,
};
