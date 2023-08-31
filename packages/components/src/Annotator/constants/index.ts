import { ReactComponent as RectIcon } from '../assets/rectangle.svg';
import { ReactComponent as SkeletonIcon } from '../assets/point.svg';
import { ReactComponent as MagicIcon } from '../assets/magic.svg';
import { ReactComponent as PolygonIcon } from '../assets/polygon.svg';
import { ReactComponent as CustomIcon } from '../assets/custom.svg';
import { ReactComponent as MaskIcon } from '../assets/brush.svg';
import { ReactComponent as UndoIcon } from '../assets/undo.svg';
import { ReactComponent as RedoIcon } from '../assets/redo.svg';
import { ReactComponent as RepeatIcon } from '../assets/repeat.svg';
import { ReactComponent as DeleteAllIcon } from '../assets/delete_all.svg';

export enum AnnotationType {
  Classification = 'Classification',
  Detection = 'Detection',
  Segmentation = 'Segmentation',
  Matting = 'Matting',
  KeyPoints = 'KeyPoints',
  Mask = 'Mask',
}

export enum DisplayOption {
  showAnnotations = 'showAnnotations',
  showAllCategory = 'showAllCategory',
  showImgDesc = 'showImgDesc',
  showBoxText = 'showBoxText',
  showSegFilling = 'showSegFilling',
  showSegContour = 'showSegContour',
  showMattingColorFill = 'showMattingColorFill',
  showKeyPointsLine = 'showKeyPointsLine',
  showKeyPointsBox = 'showKeyPointsBox',
}

export enum EnumTaskStatus {
  Waiting = 'waiting',
  Running = 'running',
  Success = 'success',
  Failed = 'failed',
}

/**
 * Zoom control related.
 */
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 20;
export const BUTTON_SCALE_STEP = 0.5;
export const WHEEL_SCALE_STEP = 0.1;

export enum EObjectType {
  Custom = 'Custom',
  Rectangle = 'Rectangle',
  Polygon = 'Polygon',
  Skeleton = 'Skeleton',
  Mask = 'Mask',
  Matting = 'Matting',
}

export enum EElementType {
  Rect = 'rect',
  Circle = 'circle',
  Polygon = 'polygon',
  None = 'none',
}

export enum EBasicToolItem {
  Drag = 'Drag',
  Rectangle = 'Rect',
  Polygon = 'Polygon',
  Skeleton = 'Skeleton',
  Mask = 'Mask',
}

export const EBasicToolTypeMap = {
  [EBasicToolItem.Drag]: EObjectType.Custom,
  [EBasicToolItem.Rectangle]: EObjectType.Rectangle,
  [EBasicToolItem.Polygon]: EObjectType.Polygon,
  [EBasicToolItem.Skeleton]: EObjectType.Skeleton,
  [EBasicToolItem.Mask]: EObjectType.Mask,
};

export enum ESubToolItem {
  PenAdd = 'PenAdd',
  PenErase = 'PenErase',
  BrushAdd = 'BrushAdd',
  BrushErase = 'BrushErase',
  AutoSegmentByBox = 'AutoSegmentByBox',
  AutoSegmentByClick = 'AutoSegmentByClick',
  AutoSegmentByStroke = 'AutoSegmentByStroke',
  AutoSegmentEverything = 'AutoSegmentEverything',
  AutoEdgeStitching = 'AutoEdgeStitching',
}

export enum EActionToolItem {
  SmartAnnotation = 'SmartAnnotation',
  Undo = 'Undo',
  Redo = 'Redo',
  RepeatPrevious = 'RepeatPrevious',
  DeleteAll = 'DeleteAll',
}

export type EToolType = EBasicToolItem;

export const OBJECT_ICON: Record<
  EObjectType,
  React.FunctionComponent<React.SVGProps<SVGSVGElement>>
> = {
  [EObjectType.Rectangle]: RectIcon,
  [EObjectType.Skeleton]: SkeletonIcon,
  [EObjectType.Polygon]: PolygonIcon,
  [EObjectType.Custom]: CustomIcon,
  [EObjectType.Mask]: MaskIcon,
  [EObjectType.Matting]: MaskIcon,
};

export const EDITOR_TOOL_ICON: Record<
  EActionToolItem,
  React.FunctionComponent<React.SVGProps<SVGSVGElement>>
> = {
  [EActionToolItem.SmartAnnotation]: MagicIcon,
  [EActionToolItem.Undo]: UndoIcon,
  [EActionToolItem.Redo]: RedoIcon,
  [EActionToolItem.RepeatPrevious]: RepeatIcon,
  [EActionToolItem.DeleteAll]: DeleteAllIcon,
};

// visible 0: not labeled, v=1: labeled but not visible, and v=2: labeled and visible
export enum KEYPOINTS_VISIBLE_TYPE {
  noLabeled = 0,
  labeledNotVisible = 1,
  labeledVisible = 2,
}

/** 17-point human body model. */
export const BODY_TEMPLATE = {
  categoryName: 'person',
  boundingBox: {
    xmax: 0.44072164948453607,
    xmin: 0.2654639175257732,
    ymax: 0.5698739977090492,
    ymin: 0.09335624284077892,
  },
  points: [
    175.25773195876286, 61.21134020618557, 0.0, 1.0, 2.0, 1.0,
    179.9828178694158, 41.45189003436426, 0.0, 1.0, 2.0, 1.0,
    170.96219931271477, 41.881443298969074, 0.0, 1.0, 2.0, 1.0,
    189.86254295532646, 51.33161512027492, 0.0, 1.0, 2.0, 1.0,
    163.23024054982818, 50.47250859106529, 0.0, 1.0, 2.0, 1.0,
    192.86941580756016, 68.08419243986253, 0.0, 1.0, 2.0, 1.0, 158.295150820924,
    67.63982699371964, 0.0, 1.0, 2.0, 1.0, 202.74914089347078,
    99.87113402061856, 0.0, 1.0, 2.0, 1.0, 150.34364261168383,
    99.87113402061856, 0.0, 1.0, 2.0, 1.0, 208.76288659793815,
    127.36254295532646, 0.0, 1.0, 2.0, 1.0, 142.61168384879724,
    129.0807560137457, 0.0, 1.0, 2.0, 1.0, 182.13058419243984,
    126.50343642611685, 0.0, 1.0, 2.0, 1.0, 162.2279495990836,
    125.4739898092191, 0.0, 1.0, 2.0, 1.0, 184.70790378006873,
    175.4725085910653, 0.0, 1.0, 2.0, 1.0, 158.78675066819395,
    176.9759450171821, 0.0, 1.0, 2.0, 1.0, 190.29209621993127,
    208.11855670103094, 0.0, 1.0, 2.0, 1.0, 152.92096219931273,
    206.82989690721652, 0.0, 1.0, 2.0, 1.0,
  ],
  lines: [
    15, 13, 13, 11, 16, 14, 14, 12, 11, 12, 5, 11, 6, 12, 5, 6, 5, 7, 6, 8, 7,
    9, 8, 10, 1, 2, 0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6,
  ],
  pointColors: [
    '128',
    '0',
    '0',
    '255',
    '178',
    '102',
    '230',
    '230',
    '0',
    '255',
    '51',
    '255',
    '153',
    '204',
    '255',
    '255',
    '128',
    '0',
    '0',
    '255',
    '255',
    '128',
    '0',
    '255',
    '51',
    '153',
    '255',
    '169',
    '165',
    '139',
    '255',
    '0',
    '0',
    '102',
    '255',
    '102',
    '184',
    '97',
    '134',
    '128',
    '128',
    '0',
    '255',
    '190',
    '255',
    '0',
    '128',
    '0',
    '0',
    '0',
    '255',
  ],
  pointNames: [
    'nose',
    'left_eye',
    'right_eye',
    'left_ear',
    'right_ear',
    'left_shoulder',
    'right_shoulder',
    'left_elbow',
    'right_elbow',
    'left_wrist',
    'right_wrist',
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle',
  ],
};
