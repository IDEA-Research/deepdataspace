import { DATA } from '@/services/type';
import {
  EBasicToolItem,
  EElementType,
  EObjectType,
  ESubToolItem,
  EToolType,
} from '@/constants';
import { RectAnchor } from '@/utils/compute';

export enum EObjectStatus {
  Unchecked,
  Checked,
  Commited,
}

export interface IAnnotationObject {
  type: EObjectType;
  label: string;
  hidden: boolean;
  rect?: IElement<IRect>;
  polygon?: IElement<IPolygonGroup>;
  keypoints?: {
    points: IElement<IPoint>[];
    lines: number[];
  };
  maskRle?: number[];
  maskCanvasElement?: any;
  conf?: number;
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

export interface EditState {
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
  focusEleType: EElementType;
  focusEleIndex: number;
  focusPolygonInfo: {
    index: number;
    pointIndex: number;
    lineIndex: number;
  };
  imageCacheId?: string;
}

export const enum EditorMode {
  View,
  Edit,
  Review,
}

export interface EditImageData extends DATA.BaseImage {
  objects: DATA.BaseObject[];
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

export const DEFAULT_EDIT_STATE: EditState = {
  isRequiring: false,
  allowMove: false,
  latestLabel: '',
  startRectResizeAnchor: undefined,
  startElementMovePoint: undefined,
  focusObjectIndex: -1,
  focusEleType: EElementType.Rect,
  focusEleIndex: -1,
  focusPolygonInfo: {
    index: -1,
    pointIndex: -1,
    lineIndex: -1,
  },
};
