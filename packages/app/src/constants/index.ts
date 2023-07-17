import { ReactComponent as RectIcon } from '@/assets/svg/rect.svg';
import { ReactComponent as SkeletonIcon } from '@/assets/svg/keypoints.svg';
import { ReactComponent as MagicIcon } from '@/assets/svg/magic.svg';
import { ReactComponent as PolygonIcon } from '@/assets/svg/polygon.svg';
import { ReactComponent as CustomIcon } from '@/assets/svg/custom.svg';
import { ReactComponent as MaskIcon } from '@/assets/svg/brush.svg';
import { ReactComponent as UndoIcon } from '@/assets/svg/undo.svg';
import { ReactComponent as RedoIcon } from '@/assets/svg/redo.svg';
import { ReactComponent as ClassifyIcon } from '@/assets/svg/classification.svg';
import { ReactComponent as DetectIcon } from '@/assets/svg/datasetDetection.svg';
import { ReactComponent as SegmentIcon } from '@/assets/svg/datasetSegment.svg';
import { ReactComponent as MattingIcon } from '@/assets/svg/datasetMatting.svg';
import { ReactComponent as KeypointIcon } from '@/assets/svg/datasetKeypoint.svg';
import { ReactComponent as DeleteAllIcon } from '@/assets/svg/delete_all.svg';

export const DEFAULT_NAME = 'Deep Data Space';

export const LOGO_SRC =
  'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg';

export const DEFAULT_PAGE_SIZE = 50;

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200];

export const IMG_PAGE_SIZE_OPTIONS = [8, 18, 28, 40, 50, 55, 78, 105, 128]; // [10, 20, 50, 100]

export const IMG_CLOUMN_COUNT_MAX = 8;

export enum AnnotationType {
  Classification = 'Classification',
  Detection = 'Detection',
  Segmentation = 'Segmentation',
  Matting = 'Matting',
  KeyPoints = 'KeyPoints',
}

export const ANNOTATION_TYPE_ICONS = {
  [AnnotationType.Classification]: ClassifyIcon,
  [AnnotationType.Detection]: DetectIcon,
  [AnnotationType.Segmentation]: SegmentIcon,
  [AnnotationType.Matting]: MattingIcon,
  [AnnotationType.KeyPoints]: KeypointIcon,
};

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

export const DISPLAY_OPTION_LABELS = {
  [DisplayOption.showAnnotations]: 'lab.displayOption.showAnnotations',
  [DisplayOption.showAllCategory]: 'lab.displayOption.showAllCategory',
  [DisplayOption.showImgDesc]: 'lab.displayOption.showImgDesc',
  [DisplayOption.showBoxText]: 'lab.displayOption.showBoxText',
  [DisplayOption.showSegFilling]: 'lab.displayOption.showSegFilling',
  [DisplayOption.showSegContour]: 'lab.displayOption.showSegContour',
  [DisplayOption.showMattingColorFill]:
    'lab.displayOption.showMattingColorFill',
  [DisplayOption.showKeyPointsLine]: 'lab.displayOption.showKeyPointsLine',
  [DisplayOption.showKeyPointsBox]: 'lab.displayOption.showKeyPointsBox',
};

export const BASE_DISPLAY_OPTIONS = [
  DisplayOption.showAnnotations,
  DisplayOption.showAllCategory,
  DisplayOption.showImgDesc,
];

/** By default, 6 types of line segments are provided. */
export const LABELS_STROKE_DASH = [[0], [2], [5], [10], [1, 5, 3], [5, 2, 10]];

/** By default, 6 types of color aplha are provided */
export const LABELS_COLOR_APLHA = [1, 0.4, 0.6, 0.8, 0.85, 0.9];

/** By default, 6 types of line width are provided */
export const LABELS_LINE_WIDTH = [1, 1.5, 1.75, 2, 2.25, 2.5];

export enum LabelDiffMode {
  Overlay = 'dataset.diffMode.overlay',
  Tiled = 'dataset.diffMode.tiled',
}

export const LABEL_DIFF_MODE_OPTIONS = [
  LabelDiffMode.Overlay,
  LabelDiffMode.Tiled,
];

export enum IMG_FLAG {
  /** For page default. */
  all = -1,
  /** Unflaged */
  unflaged = 0,
  /** Positive */
  picked = 1,
  /** Negative */
  rejected = 2,
}

export const IMG_FLAG_COLOR = {
  [IMG_FLAG.all]: 'transparent',
  [IMG_FLAG.unflaged]: '#8C8C8C',
  [IMG_FLAG.picked]: '#52C41A',
  [IMG_FLAG.rejected]: '#F5222D',
};

export const IMG_FLAG_RESULTS = [
  { value: IMG_FLAG.picked, tip: `save as 'positive'` },
  { value: IMG_FLAG.rejected, tip: `save as 'negative'` },
  { value: IMG_FLAG.unflaged, tip: `save as 'unset'` },
];

export const IMG_FLAG_OPTIONS = [
  { value: IMG_FLAG.all, name: 'all' },
  { value: IMG_FLAG.unflaged, name: 'unset' },
  { value: IMG_FLAG.picked, name: 'positive' },
  { value: IMG_FLAG.rejected, name: 'negative' },
];

export enum LABEL_SOURCE {
  'gt' = 'GT',
  'user' = 'User',
  'pred' = 'Pred',
}

export enum COMPARISONS_SORTBY {
  /** Sort by the number of missed detections in the image. */
  'fn' = 'fn',
  /** Sort by the number of false detections in the image. */
  'fp' = 'fp',
}

export const COMPARISONS_SORTBY_OPTOIONS = [
  { value: COMPARISONS_SORTBY.fn, name: 'FN count' },
  { value: COMPARISONS_SORTBY.fp, name: 'FP count' },
];

export enum COMPARE_RESULT {
  /** Ok */
  'ok' = 'OK',
  /** Missed detections (GT) */
  'fn' = 'FN',
  /** False detections (Pred) */
  'fp' = 'FP',
}

export const COMPARE_RESULT_FILL_COLORS = {
  [COMPARE_RESULT.ok]: '',
  [COMPARE_RESULT.fn]: 'rgba(255,0,0,0.4)',
  [COMPARE_RESULT.fp]: 'rgba(0,0,255,0.4)',
};

export const COMPARISONS_DISPLAY_OPTOIONS = [
  { value: LABEL_SOURCE.gt, name: 'GT - Matched' },
  { value: COMPARE_RESULT.fn, name: 'GT - FN' },
  { value: LABEL_SOURCE.pred, name: 'Prediction - Matched' },
  { value: COMPARE_RESULT.fp, name: 'Prediction - FP' },
];

// visible 0: not labeled, v=1: labeled but not visible, and v=2: labeled and visible
export enum KEYPOINTS_VISIBLE_TYPE {
  noLabeled = 0,
  labeledNotVisible = 1,
  labeledVisible = 2,
}

/**
 * Zoom control related.
 */
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 20;
export const BUTTON_SCALE_STEP = 0.5;
export const WHEEL_SCALE_STEP = 0.1;

export enum STORAGE_KEY {
  AUTH_TOKEN = 'auth_token',
}

export enum EUserStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export const DEFAULT_USER_ANNOTATION = 'UserAnnotation';

export enum EObjectType {
  Rectangle = 'Rectangle',
  Polygon = 'Polygon',
  Skeleton = 'Skeleton',
  Custom = 'Custom',
  Mask = 'Mask',
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
};

export const EDITOR_TOOL_ICON: Record<
  EActionToolItem,
  React.FunctionComponent<React.SVGProps<SVGSVGElement>>
> = {
  [EActionToolItem.SmartAnnotation]: MagicIcon,
  [EActionToolItem.Undo]: UndoIcon,
  [EActionToolItem.Redo]: RedoIcon,
  [EActionToolItem.DeleteAll]: DeleteAllIcon,
};

export enum DRAW_TYPE {
  rect = 'Rectangle',
  polygon = 'Polygon',
  keypoint = 'Keypoints',
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
