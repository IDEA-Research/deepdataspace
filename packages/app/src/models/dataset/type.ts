import {
  AnnotationType,
  BASE_DISPLAY_OPTIONS,
  COMPARISONS_SORTBY,
  DEFAULT_PAGE_SIZE,
  DisplayOption,
  IMG_FLAG,
  LabelDiffMode,
} from '@/constants';
import { DATA } from '@/services/type';
import { AnnotationImageHandle } from '@/components/AnnotationImage';

export interface Comparisons {
  label: DATA.Label;
  orderBy: COMPARISONS_SORTBY;
  precision: number;
  displays: string[];
  diffMode: LabelDiffMode;
  score: number;
}

/**
 * Saved in the URL.
 */
export interface PageState {
  datasetId: string;
  datasetName: string;
  page: number;
  pageSize: number;
  // config
  cloumnCount: number;
  // preview/edit status
  previewIndex: number;
  isSingleAnnotation: boolean;
  // filters
  filterValues: {
    categoryId?: string;
    displayAnnotationType?: AnnotationType;
    displayOptions: DisplayOption[];
    selectedLabelIds: string[];
    diffMode: LabelDiffMode;
  };
  // comparisons
  comparisons?: Comparisons;
  // flag tools
  flagTools?: {
    flagStatus: IMG_FLAG;
  };
}

export const DEFAULT_FILTER_VALUES = {
  categoryId: 'All',
  displayAnnotationType: undefined,
  displayOptions: [
    DisplayOption.showAnnotations,
    DisplayOption.showAllCategory,
  ],
  selectedLabelIds: [],
  diffMode: LabelDiffMode.Overlay,
};

export const DEFAULT_PAGE_STATE = {
  datasetId: '',
  datasetName: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  cloumnCount: 5,
  isSingleAnnotation: false,
  previewIndex: -1,
  filterValues: {
    ...DEFAULT_FILTER_VALUES,
  },
  comparisons: undefined,
  flagTools: undefined,
};

/**
 * Not saved in the URL.
 */
export interface PageData {
  // data
  imgList: DATA.DataSetImg[];
  total: number;
  screenLoading: string;
  // filters
  filters: {
    categories: DATA.Category[];
    annotationTypes: string[];
    displayOptions: DisplayOption[];
    labels: DATA.Label[];
  };
  // flag tools
  flagTools: {
    lastShiftIndex: number;
    lastSavedIndexs: number[];
    count: number;
  };
}

export interface DatasetInfo {
  name: string;
  description: string;
  isPublic: string;
}

export const DEFAULT_DATASET_INFO_STATE = {
  name: '',
  description: '',
  isPublic: 'false',
};

export const DEFALUE_PAGE_INNER_DATA = {
  imgList: [],
  total: 0,
  flagTools: {
    lastShiftIndex: -1,
    lastSavedIndexs: [],
    count: 0,
  },
};

export const DEFAULT_PAGE_DATA = {
  ...DEFALUE_PAGE_INNER_DATA,
  screenLoading: '',
  filters: {
    categories: [],
    annotationTypes: [],
    displayOptions: BASE_DISPLAY_OPTIONS,
    labels: [],
  },
};

export type AnnotationImageRender = (record: {
  data: DATA.DataSetImg;
  currentSize?: ISize;
  wrapWidth?: number;
  wrapHeight?: number;
  minHeight?: number;
  isPreview?: boolean;
  imgStyle?: React.CSSProperties;
  ref?: React.RefObject<AnnotationImageHandle> | null;
  onLoad?: (e: React.UIEvent<HTMLImageElement, UIEvent>) => void;
}) => JSX.Element | null;
