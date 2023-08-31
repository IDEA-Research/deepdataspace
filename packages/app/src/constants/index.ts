import { ReactComponent as ClassifyIcon } from '@/assets/svg/classification.svg';
import { ReactComponent as DetectIcon } from '@/assets/svg/datasetDetection.svg';
import { ReactComponent as SegmentIcon } from '@/assets/svg/datasetSegment.svg';
import { ReactComponent as MattingIcon } from '@/assets/svg/datasetMatting.svg';
import { ReactComponent as KeypointIcon } from '@/assets/svg/datasetKeypoint.svg';

export const DEFAULT_NAME = 'Deep Data Space';

export const LOGO_SRC =
  'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg';

export const DEFAULT_PAGE_SIZE = 50;

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200];

export const IMG_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]; // [10, 20, 50, 100]

export const IMG_CLOUMN_COUNT_MAX = 8;

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

export const ANNOTATION_TYPE_ICONS = {
  [AnnotationType.Classification]: ClassifyIcon,
  [AnnotationType.Detection]: DetectIcon,
  [AnnotationType.Segmentation]: SegmentIcon,
  [AnnotationType.Matting]: MattingIcon,
  [AnnotationType.KeyPoints]: KeypointIcon,
  [AnnotationType.Mask]: MattingIcon,
};

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

/**
 * User
 */
export enum STORAGE_KEY {
  AUTH_TOKEN = 'auth_token',
}

export enum EUserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Activating = 'activating',
}

export enum ImageSource {
  Upload = 'self_uploaded',
  DirectUrl = 'direct_url',
}

export enum EnumTaskStatus {
  Waiting = 'waiting',
  Running = 'running',
  Success = 'success',
  Failed = 'failed',
  Fail = 'fail',
}
