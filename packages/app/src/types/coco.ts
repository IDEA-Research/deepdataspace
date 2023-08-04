/* eslint-disable @typescript-eslint/no-namespace */

export namespace COCO {
  export interface Info {
    year?: number;
    version?: string;
    description?: string;
    contributor?: string;
    url?: string;
    date_created?: string;
  }

  export interface Image {
    id: number;
    width: number;
    height: number;
    file_name: string;
    license?: number;
    flickr_url?: string;
    coco_url?: string;
    date_captured?: string;
  }

  export interface Annotation {
    id: number;
    image_id: number;
    category_id?: number;
    segmentation: number[][] | number[]; // polygons or RLE format
    area: number;
    bbox: number[];
    iscrowd?: number;
    keypoints?: number[];
    num_keypoints?: number;
  }

  export interface Category {
    id: number;
    name: string;
    supercategory?: string;
    keypoints?: string[];
    skeleton?: number[][];
  }

  export interface Dataset {
    info?: Info;
    images: Image[];
    annotations: Annotation[];
    categories: Category[];
  }
}
