/* eslint-disable @typescript-eslint/no-namespace */
import { COMPARE_RESULT } from '@/constants';
import { BaseImage, BaseObject } from '.';

export namespace NsDataSet {
  export interface DataSet {
    id: string;
    name: string;
    description: string;
    numImages: number;
    objectTypes: string[];
    flagExportLink: string;
    groupName: string;
    coverUrl: string;
  }

  export interface DatasetObject extends BaseObject {
    labelId: string;
    labelName: string;
    conf: number;
    /** GT/Pred/User */
    source: string;
    /** Comparison results between Object and GT：OK/FN/FP */
    compareResult: COMPARE_RESULT;
    /** Pred index matched in GT analysis mode. */
    matchedDetIdx?: number;
  }

  export interface DataSetImg extends BaseImage {
    desc: string;
    caption?: string;
    metadata: Record<string, string>;
    objects: Array<DatasetObject>;
    /** 0/1/2 */
    flag: number;
    /** Used in page. */
    selected?: boolean;
    curLabelId: string;
  }

  export interface Label {
    id: string;
    name: string;
    source: string;
    comparePrecisions: {
      /** The precision of the comparison between annotation set */
      precision: number;
      threshold: number;
      recall: number;
    }[];
    /** Used in page. */
    confidenceRange: [number, number];
  }
}
