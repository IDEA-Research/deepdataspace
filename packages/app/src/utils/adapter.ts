/* eslint-disable @typescript-eslint/no-namespace */

import { LabelImageFile } from '@/types/annotator';
import { COCO } from '@/types/coco';
import { rleToCanvas } from 'dds-components/Annotator/tools/useMask';
import {
  calculatePolygonArea,
  convertToVerticesArray,
  getLimitRectFromPoints,
  getMaskInfoByCanvas,
  translateBoundingBoxToRect,
} from 'dds-components/Annotator/utils/compute';
import { Category } from '@/types';

export const convertToCocoDateset = (
  images: LabelImageFile[],
  categories: Category[],
) => {
  const cocoDataset: COCO.Dataset = {
    info: {
      year: new Date().getFullYear(),
      version: '1.0',
      description: 'Annotations in COCO format, labeled by DeepDataSpace',
      contributor: '',
      date_created: new Date().toISOString(),
    },
    images: [],
    categories: [],
    annotations: [],
  };

  // Create category mapping
  const categoryMap: Record<string, number> = {};
  categories.forEach((category, index) => {
    const categoryId = index;
    categoryMap[category.name] = categoryId;
    cocoDataset.categories.push({
      id: categoryId,
      name: category.name,
    });
  });

  // Convert image and annotation data
  images.forEach((image, index) => {
    const imageId = index;
    cocoDataset.images.push({
      id: imageId,
      file_name: image.fileName,
      width: image.width,
      height: image.height,
    });

    image.objects.forEach((annotation) => {
      const newAnnotation: COCO.Annotation = {
        id: cocoDataset.annotations.length,
        image_id: imageId,
        bbox: [],
        area: 0,
        segmentation: [],
        iscrowd: 0,
      };

      if (
        categoryMap &&
        annotation.categoryName &&
        categoryMap[annotation.categoryName] !== undefined
      ) {
        newAnnotation.category_id = categoryMap[annotation.categoryName];
      }

      if (annotation.boundingBox) {
        const { x, y, width, height } = translateBoundingBoxToRect(
          annotation.boundingBox,
          {
            width: image.width,
            height: image.height,
          },
        );
        const area = width * height;
        const bbox = [x, y, width, height];
        Object.assign(newAnnotation, { area, bbox });
      }

      if (annotation.segmentation) {
        const segmentation = annotation.segmentation.split('/').map((group) => {
          return group.split(',').map((pos) => parseFloat(pos));
        });

        const area = segmentation.reduce((sum, group) => {
          const vertices = convertToVerticesArray(group);
          const area = calculatePolygonArea(vertices);
          return sum + area;
        }, 0);

        const points: number[] = segmentation.flat();
        const pointObjs: IPoint[] = [];
        for (let i = 0; i < points.length; i += 2) {
          const [x, y] = points.slice(i, i + 2);
          pointObjs.push({ x, y });
        }
        const { x, y, width, height } = getLimitRectFromPoints(pointObjs);
        const bbox = [x, y, width, height];

        Object.assign(newAnnotation, { segmentation, bbox, area });
      }

      if (annotation.mask && annotation.mask.length > 0) {
        const rle = annotation.mask;
        const canvas = rleToCanvas(
          rle,
          { width: image.width, height: image.height },
          '#fff',
        );
        if (canvas) {
          const { area, bbox } = getMaskInfoByCanvas(canvas);
          const { x, y, width, height } = translateBoundingBoxToRect(bbox, {
            width: 1,
            height: 1,
          });
          Object.assign(newAnnotation, {
            segmentation: rle,
            area,
            bbox: [x, y, width, height],
          });
        } else {
          Object.assign(newAnnotation, { segmentation: rle });
        }
      }

      if (annotation.points && annotation.points.length > 0) {
        const { points, pointNames, lines, categoryName } = annotation;
        const keypoints: number[] = [];
        let num_keypoints = 0;
        for (let i = 0; i * 6 < points.length; i++) {
          keypoints.push(points[i * 6], points[i * 6 + 1], points[i * 6 + 4]);
          num_keypoints += 1;
        }

        Object.assign(newAnnotation, {
          keypoints,
          num_keypoints,
        });

        if (annotation.boundingBox) {
          const { x, y, width, height } = translateBoundingBoxToRect(
            annotation.boundingBox,
            {
              width: image.width,
              height: image.height,
            },
          );
          const area = width * height;
          const bbox = [x, y, width, height];
          Object.assign(newAnnotation, { area, bbox });
        }

        const targetCategory = cocoDataset.categories.find(
          (item) => item.name === categoryName,
        );
        if (targetCategory) {
          targetCategory.skeleton = convertToVerticesArray(lines!);
          targetCategory.keypoints = pointNames;
        }
      }

      cocoDataset.annotations.push(newAnnotation);
    });
  });

  return cocoDataset;
};
