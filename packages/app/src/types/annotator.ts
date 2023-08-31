import { BaseImage, BaseObject } from '.';

export interface LabelImageFile extends BaseImage {
  fileName: string;
  objects: BaseObject[];
  width?: number;
  height?: number;
}
