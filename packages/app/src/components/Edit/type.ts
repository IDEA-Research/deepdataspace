import { DATA } from '@/services/type';
import {
  EBasicToolItem,
  EElementType,
  EObjectType,
  ESubToolItem,
  EToolType,
} from '@/constants';
import { RectAnchor } from '@/utils/compute';

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

export type PromptItem = {
  type: ESubToolItem;
  isPositive: boolean;
  rect?: IRect;
  point?: IPoint;
  stroke?: IPoint[];
};

/**
 * Need to be saved in history
 */
export interface DrawData {
  initialized: boolean;

  /** Selected tool */
  selectedTool: EToolType;
  selectedSubTool: ESubToolItem;
  AIAnnotation: boolean;

  /** drawed */
  objectList: IAnnotationObject[];
  activeClassName: string;
  activeObjectIndex: number;
  creatingObject?: ICreatingObject;
  segmentationClicks?: {
    point: IPoint;
    isPositive: boolean;
  }[];
  segmentationMask?: string;
  brushSize: number;

  /** prompt actions */
  prompt?: PromptItem[];
  activeRectWhileLoading?: IRect;
}

export interface EditState {
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
  segmentationClicks: undefined,
  segmentationMask: undefined,
  brushSize: 20,
  prompt: undefined,
};

export const DEFAULT_EDIT_STATE: EditState = {
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
  focusMaskCanvasList: undefined,
};
