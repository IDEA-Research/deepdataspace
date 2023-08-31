import {
  AnnotationType,
  BASE_DISPLAY_OPTIONS,
  COMPARISONS_SORTBY,
  DEFAULT_PAGE_SIZE,
  DisplayOption,
  IMG_FLAG,
  LabelDiffMode,
} from '@/constants';
import { Category } from '@/types';
import { NsDataSet } from '@/types/dataset';

export interface Comparisons {
  label: NsDataSet.Label;
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
  imgList: NsDataSet.DataSetImg[];
  total: number;
  screenLoading: string;
  // filters
  filters: {
    categories: Category[];
    annotationTypes: string[];
    displayOptions: DisplayOption[];
    labels: NsDataSet.Label[];
  };
  // flag tools
  flagTools: {
    lastShiftIndex: number;
    lastSavedIndexs: number[];
    count: number;
  };
}

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
  hasEmbedFile: false,
  filters: {
    categories: [],
    annotationTypes: [],
    displayOptions: BASE_DISPLAY_OPTIONS,
    labels: [],
  },
};
