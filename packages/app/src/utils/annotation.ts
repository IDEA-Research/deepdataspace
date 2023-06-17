import {
  AnnotationType,
  BASE_DISPLAY_OPTIONS,
  COMPARE_RESULT,
  COMPARE_RESULT_FILL_COLORS,
  DisplayOption,
  LABELS_COLOR_APLHA,
  LABELS_LINE_WIDTH,
  LABELS_STROKE_DASH,
  LABEL_SOURCE,
} from '@/constants';
import { DATA } from '@/services/type';

/**
 * Calculate the scaled width and height.
 * @param imgWidth
 * @param imgHeight
 * @param maxWidth
 * @param maxHeight
 * @returns [number,number] [width, height]
 */
export const zoomImgSize = (
  imgWidth: number,
  imgHeight: number,
  contianerWidth?: number,
  contianerHeight?: number,
): [number, number, number] => {
  if (!imgWidth || !imgHeight) return [0, 0, 1];
  // Only restrict the container width or height.
  if (!contianerWidth) {
    return [
      (imgWidth / imgHeight) * (contianerHeight || 0),
      contianerHeight || 0,
      1,
    ];
  }
  if (!contianerHeight) {
    return [
      contianerWidth || 0,
      (imgHeight / imgWidth) * (contianerWidth || 0),
      1,
    ];
  }
  let newWidth = imgWidth,
    newHeight = imgHeight,
    scale = 1;
  if (imgWidth / imgHeight >= contianerWidth / contianerHeight) {
    // Scale based on container width.
    newWidth = contianerWidth;
    newHeight = (imgHeight * contianerWidth) / imgWidth;
    scale = contianerWidth / imgWidth;
  } else {
    // Scale based on container height.
    newHeight = contianerHeight;
    newWidth = (imgWidth * contianerHeight) / imgHeight;
    scale = contianerHeight / imgHeight;
  }
  return [newWidth || 0, newHeight || 0, scale];
};

/** translate bounding box to rect */
export const getBoundingBoxRect = (
  rect: IBoundingBox | undefined,
  clientSize: ISize,
): IRect => {
  const x = clientSize.width * Number(rect?.xmin);
  const y = clientSize.height * Number(rect?.ymin);
  const width = clientSize.width * (Number(rect?.xmax) - Number(rect?.xmin));
  const height = clientSize.height * (Number(rect?.ymax) - Number(rect?.ymin));
  return { x, y, width, height };
};

/** transtlate segmentation path */
export const getSegmentationPathD = (
  seg: string,
  naturalSize: ISize,
  clientSize: ISize,
) => {
  if (!seg) return '';

  let d = '';
  const paths = seg.split('/');
  paths?.forEach((item) => {
    const nums = item.split(',').map(Number);
    // Canvas ratio conversion.
    for (let i = 0; i < nums.length; i += 2) {
      nums[i] = (nums[i] * naturalSize.width) / clientSize.width; // x
      nums[i + 1] = (nums[i + 1] * naturalSize.height) / clientSize.height; // y
    }
    if (nums) {
      let path = 'M' + String(nums[0]) + ' ' + String(nums[1]);
      for (let t = 2; t < nums.length; t += 2) {
        path += 'L' + String(nums[t]) + ' ' + String(nums[t + 1]);
      }
      path += ' Z';
      d += path + ' ';
    }
  });
  if (d.includes('NaN')) {
    return '';
  }
  return d;
};

/** translate points */
export const getCanvasPoint = (
  [x = 0, y = 0]: number[],
  naturalSize: ISize,
  clientSize: ISize,
) => {
  return {
    x: (x / naturalSize.width) * clientSize.width,
    y: (y / naturalSize.height) * clientSize.height,
  };
};

/** Convert to coordinates in image coordinate system. */
export const getNaturalPoint = (
  [x = 0, y = 0]: number[],
  naturalSize: ISize,
  clientSize: ISize,
): IPoint => {
  return {
    x: (x / clientSize.width) * naturalSize.width,
    y: (y / clientSize.height) * naturalSize.height,
  };
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
  arr: DATA.Label[],
  selectedLabelIds: string[],
  annotationType?: AnnotationType,
): DATA.Label[] => {
  const result: DATA.Label[] = [];
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
  arr: DATA.DataSetImg[],
  selectedLabelIds: string[],
  annotationType?: AnnotationType,
): DATA.DataSetImg[] => {
  const result: DATA.DataSetImg[] = [];
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

/**
 * Convert image to base64.
 * @param imgUrl
 * @returns
 */
export const getImageBase64 = async (imgUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.URL = window.URL || window.webkitURL;

    const xhr = new XMLHttpRequest();
    xhr.open('get', imgUrl, true);
    xhr.responseType = 'blob';
    xhr.send();
    xhr.onload = function () {
      if (this.status === 200) {
        const blob = this.response;
        const oFileReader = new FileReader();
        oFileReader.onloadend = function (e) {
          const base64 = e.target?.result;
          resolve(base64 as string);
        };
        oFileReader.onerror = function (e) {
          reject(e);
        };
        oFileReader.readAsDataURL(blob);
      }
    };
    xhr.onerror = function (e) {
      reject(e);
    };
  });
};

export const isBase64 = (str: string) => {
  const base64Regex = /^data:image\/(png|jpe?g|gif|svg|webp);base64,/i;
  return base64Regex.test(str);
};

/**
 * Get box fill color
 * @param object
 * @param isComparisons
 * @returns
 */
export const getBoxFillColor = (
  compareResult?: COMPARE_RESULT,
  isComparisons?: boolean,
) => {
  if (
    isComparisons &&
    compareResult &&
    COMPARE_RESULT_FILL_COLORS[compareResult]
  ) {
    return COMPARE_RESULT_FILL_COLORS[compareResult];
  }
  return '';
};

/**
 * Generate corresponding canvas coordinates based on the segmentation data returned by the API.
 * @param seg
 * @param naturalSize
 * @param clientSize
 * @returns
 */
export const getSegmentationPoints = (
  seg: string,
  naturalSize: ISize,
  clientSize: ISize,
): IPoint[][] => {
  const groups: IPoint[][] = [];
  if (!seg) return groups;
  const paths = seg.split('/');
  paths?.forEach((item) => {
    const points = [];
    const nums = item.split(',').map(Number);
    for (let i = 0; i < nums.length; i += 2) {
      const point = getCanvasPoint(
        [nums[i], nums[i + 1]],
        naturalSize,
        clientSize,
      );
      points.push(point);
    }
    groups.push(points);
  });
  return groups;
};
