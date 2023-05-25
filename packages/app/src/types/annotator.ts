import { DATA } from '@/services/type';

export interface LabelImageFile extends DATA.BaseImage {
  fileName: string;
  width: number;
  height: number;
  objects: DATA.BaseObject[];
}
