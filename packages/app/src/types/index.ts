export interface Category {
  id: string;
  name: string;
}

export interface BaseObject {
  /** catagory */
  categoryId?: string;
  categoryName?: string;
  boundingBox?: IBoundingBox;
  /** y1,x1,y2,x2 -> x1,y1 */
  segmentation?: string;
  /** matting url */
  alpha?: string;
  /**
   * keypoints：[x, y, z, w, visible, conf, ...]. (Needs to be split manually.)
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
}

export interface BaseImage {
  id: string;
  url: string;
  urlFullRes: string;
}
