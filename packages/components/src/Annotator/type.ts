import {
  EBasicToolItem,
  EElementType,
  ELabelType,
  EnumModelType,
  EObjectType,
  ESubToolItem,
  EToolType,
} from './constants';
import { RectAnchor } from './utils/compute';

export enum EActionType {
  Radio = 'radio',
  Checkbox = 'checkbox',
  Text = 'text',
}

export interface IAttribute {
  field: string;
  type: EActionType;
  required: boolean;
  options?: { label: string }[];
}

export type IAttributeValue = string | number | number[] | null;

export interface Category {
  id: string;
  name: string;
  labelName?: string;
  labelType?: ELabelType;
  renderColor?: string;
  description?: string;
  attributes?: IAttribute[];
  valueType?: EActionType;
  valueOptions?: { label: string }[];
}

export interface BaseObject {
  id?: string;
  /** catagory */
  categoryId?: string;
  categoryName?: string;
  boundingBox?: IBoundingBox;
  /** y1,x1,y2,x2 -> x1,y1 */
  segmentation?: string;
  /** matting url */
  alpha?: string;
  /**
   * keypoints: [x, y, visible, conf, ...]
   * (old mode)keypoints：[x, y, z, w, visible, conf, ...]. (Needs to be split manually.)
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
  /** point */
  point?: number[];
}

export interface DrawObject extends BaseObject {
  conf?: number;
  // custom styles
  customStyles?: Record<string, any>;
}

export interface AnnoItem extends Record<string, any> {
  id: string;
  url: string;
}

export enum EObjectStatus {
  Unchecked,
  Checked,
  Commited,
}

export interface VideoFramesData {
  id: string;
  list: AnnoItem[];
  objects: IAnnotationObject[][]; // objects[objectIndex][frameIndex]
  activeIndex: number;
}

export interface IAnnotationObject {
  type: EObjectType;
  labelId: string;
  hidden: boolean;
  color: string;
  customStyles?: Record<string, any>;
  attributes?: IAttributeValue[];
  status: EObjectStatus;

  // value
  rect?: IElement<IRect>;
  polygon?: IElement<IPolygonGroup>;
  keypoints?: {
    points: IElement<IPoint>[];
    lines: number[];
  };
  point?: IElement<IPoint>;
  maskRle?: number[];
  maskCanvasElement?: any;
  alpha?: string;
  alphaImageElement?: any;
  conf?: number;

  // for video frame attribute
  frameEmpty?: boolean;
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

export enum EPromptType {
  Rect = 'rect',
  Point = 'point',
  Stroke = 'stroke',
  EdgeStitch = 'edgeStitch',
  Modify = 'modify',
}

export type PromptItem = {
  type: EPromptType;
  isPositive: boolean;
  /** Rect */
  startPoint?: IPoint;
  rect?: IRect;
  /** Point */
  point?: IPoint;
  /** Stroke / EdgeStitching */
  stroke?: IPoint[];
  radius?: number;
  /** Modify */
  polygons?: number[][];
};

export interface IPrompt {
  creatingPrompt?: PromptItem;
  promptsQueue?: PromptItem[];
  sessionId?: string;
  activeRectWhileLoading?: IRect;
}

export interface IEditingAttribute {
  index: number; // Object Index || -1
  labelId: string;
  attributes: IAttribute[];
  values?: IAttributeValue[];
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
  selectedModel?: EnumModelType;
  brushSize: number;
  pointResolution: number;

  /** drawed */
  objectList: IAnnotationObject[];
  classifications: {
    labelId: string;
    labelValue: IAttributeValue;
    attributes?: IAttributeValue[];
  }[];

  /** drawing */
  activeClassName: string;
  activeObjectIndex: number;
  creatingObject?: ICreatingObject; // - editing / creating
  isBatchEditing: boolean; // active while handle batch predictions by model
  editingAttribute?: IEditingAttribute;
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
  latestLabelId: string;
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
  // TODO
  imageCacheIdForPolygon?: string;
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

export const DEFAULT_DRAW_DATA: DrawData = {
  initialized: false,

  /** Selected tool */
  selectedTool: EBasicToolItem.Drag,
  selectedSubTool: ESubToolItem.PenAdd,
  selectedModel: undefined,
  AIAnnotation: false,

  /** drawed */
  objectList: [],
  classifications: [],
  activeObjectIndex: -1,
  activeClassName: '',
  creatingObject: undefined,
  editingAttribute: undefined,
  brushSize: 20,
  pointResolution: 0.5,
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
  latestLabelId: '',
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
