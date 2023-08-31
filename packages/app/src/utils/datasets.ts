import {
  AnnotationType,
  BASE_DISPLAY_OPTIONS,
  DisplayOption,
  LABELS_COLOR_APLHA,
  LABELS_LINE_WIDTH,
  LABELS_STROKE_DASH,
  LABEL_SOURCE,
} from '@/constants';
import { NsDataSet } from '@/types/dataset';
import { includes } from 'lodash';

/**
 * set cover image based on dataset type
 * @param type
 */
export const generateDefaultCover = (type: string[]) => {
  let _img_index: number = 0;

  if (includes(type, 'Classification')) {
    _img_index = 1;
  }
  if (includes(type, 'Detection')) {
    _img_index = 2;
  }
  if (includes(type, 'Segmentation')) {
    _img_index = 3;
  }
  if (includes(type, 'Matting')) {
    _img_index = 4;
  }
  if (includes(type, 'KeyPoints')) {
    _img_index = 5;
  }

  return require(`@/assets/images/cards/card_cover_${_img_index}.png`);
};

/**
 * Get label custom style
 * @param labelId
 * @param selectedIds
 * @param notOverlayDiff
 * @returns {colorAplha, strokeDash, lineWidth}
 */
export const getLabelCustomStyles = (
  labelId?: string,
  selectedIds?: string[],
  notOverlayDiff?: boolean,
) => {
  if (!labelId || !selectedIds || notOverlayDiff) {
    return {
      colorAplha: LABELS_COLOR_APLHA[0],
      strokeDash: LABELS_STROKE_DASH[0],
      lineWidth: LABELS_LINE_WIDTH[0],
    };
  }

  /**
   * Sort the selected results and assign styles in order.
   */
  const index = selectedIds.indexOf(labelId);
  return {
    colorAplha: LABELS_COLOR_APLHA[index] || LABELS_COLOR_APLHA[0],
    strokeDash: LABELS_STROKE_DASH[index] || LABELS_STROKE_DASH[0],
    lineWidth: LABELS_LINE_WIDTH[index] || LABELS_LINE_WIDTH[0],
  };
};

/**
 * Get the display options for the corresponding annotation type.
 * @param selectedOptions
 * @param type
 * @returns
 */
export const getDefaultDisplayOptions = (
  selectedOptions: DisplayOption[],
  type?: AnnotationType,
) => {
  let addOptions: DisplayOption[] = [];
  let addSelectedOptions: DisplayOption[] = [];
  const selectedDefaultOption = selectedOptions.filter((item) =>
    BASE_DISPLAY_OPTIONS.includes(item),
  );
  if (type === AnnotationType.Detection) {
    addOptions = [DisplayOption.showBoxText];
    addSelectedOptions = addOptions;
  } else if (type === AnnotationType.Segmentation) {
    addOptions = [DisplayOption.showSegFilling, DisplayOption.showSegContour];
    addSelectedOptions = addOptions;
  } else if (type === AnnotationType.Matting) {
    addOptions = [DisplayOption.showMattingColorFill];
  } else if (type === AnnotationType.KeyPoints) {
    addOptions = [
      DisplayOption.showKeyPointsLine,
      DisplayOption.showKeyPointsBox,
    ];
    addSelectedOptions = addOptions;
  }

  return [
    [...BASE_DISPLAY_OPTIONS, ...addOptions],
    [...selectedDefaultOption, ...addSelectedOptions],
  ];
};

/**
 * Get labels when tiling for diff.
 * @param arr
 * @param selectedLabelIds
 * @param annotationType
 * @returns
 */
export const getDiffLabels = (
  arr: NsDataSet.Label[],
  selectedLabelIds: string[],
  annotationType?: AnnotationType,
): NsDataSet.Label[] => {
  const result: NsDataSet.Label[] = [];
  if (annotationType === AnnotationType.Matting) {
    // Add the original image column. (Matting)
    result.push({
      id: 'origin',
      name: 'Origin image',
      source: LABEL_SOURCE.gt,
      comparePrecisions: [],
      confidenceRange: [0, 1],
    });
  }
  if (selectedLabelIds.length) {
    selectedLabelIds.forEach((id) => {
      const label = arr.find((item) => item.id === id);
      if (label) result.push({ ...label });
    });
  }
  return result;
};

/**
 * Expand the data for tiled comparison.
 * @param arr
 * @param selectedLabelIds
 * @param annotationType
 * @returns
 */
export const doubleImgList = (
  arr: NsDataSet.DataSetImg[],
  selectedLabelIds: string[],
  annotationType?: AnnotationType,
): NsDataSet.DataSetImg[] => {
  const result: NsDataSet.DataSetImg[] = [];
  if (selectedLabelIds.length) {
    arr.forEach((item) => {
      if (annotationType === AnnotationType.Matting) {
        // Add the original image column. (Matting)
        result.push({ ...item });
      }

      result.push(
        ...new Array(selectedLabelIds.length).fill({}).map((_, index) => {
          const theItem = { ...item };
          theItem.curLabelId = selectedLabelIds[index];
          return theItem;
        }),
      );
    });
    return result;
  }
  return arr;
};
