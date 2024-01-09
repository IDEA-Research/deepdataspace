/* eslint-disable @typescript-eslint/no-namespace */
import { Category } from 'dds-components/Annotator';
import { rleToCanvas } from 'dds-components/Annotator/tools/useMask';
import {
  calculatePolygonArea,
  convertToVerticesArray,
  getMaskInfoByCanvas,
  translateBoundingBoxToRect,
  translateRectToBoundingBox,
} from 'dds-components/Annotator/utils/compute';
import { idConverter } from './idConverter';
import { getImageDimensions } from 'dds-utils/file';
import { COCO, QsAnnotatorFile } from '../type';

interface IAnnotatorStates {
  info: COCO.Info;
  categories: Category[];
  images: QsAnnotatorFile[];
}

const IMPORT_CATEGORYID_PRIFIX = 'user_import_category';
const IMPORT_IMAGE_PRIFIX = 'user_import_image';
const IMPORT_ANNOT_PRIFIX = 'user_import_annot';

export const ddsRleToCocoRle = (ddsRle: number[], imageSize: ISize) => {
  const { width, height } = imageSize;
  const counts: number[] = [];

  let pos: number = 0;

  for (let i = 0; i < Math.floor(ddsRle.length / 2); i++) {
    counts.push(ddsRle[2 * i] - pos);
    counts.push(ddsRle[2 * i + 1]);
    pos = ddsRle[2 * i] + ddsRle[2 * i + 1];
  }

  if (pos < width * height) {
    counts.push(width * height - pos);
  }

  return {
    size: [imageSize.height, imageSize.width],
    counts: counts,
  };
};

export const convertToCocoDateset = async ({
  info,
  images,
  categories,
}: IAnnotatorStates) => {
  const cocoDataset: COCO.Dataset = {
    info: {},
    images: [],
    categories: [],
    annotations: [],
  };

  // update info
  cocoDataset.info = {
    ...info,
    year: new Date().getFullYear(),
    date_created: new Date().toISOString(),
  };

  const { getIntItemId: getIntCategoryId } = idConverter(
    IMPORT_CATEGORYID_PRIFIX,
    categories,
  );

  // export imported category (with original id) & created category
  const categoryMap: Record<string, number> = {};
  categories.forEach((category) => {
    let categoryId = getIntCategoryId(category.id);
    categoryMap[category.name] = categoryId;
    cocoDataset.categories.push({
      id: categoryId,
      name: category.name,
    });
  });

  // Convert image and annotation data
  const { getIntItemId: getIntImageId } = idConverter(
    IMPORT_IMAGE_PRIFIX,
    images,
  );

  for (const image of images) {
    const imageId = getIntImageId(image.id);

    let imageSize: ISize = {
      width: 0,
      height: 0,
    };

    if (!image.width || !image.height) {
      const size = await getImageDimensions(image.urlFullRes);
      imageSize = size;
    } else {
      imageSize.width = image.width;
      imageSize.height = image.height;
    }

    cocoDataset.images.push({
      id: imageId,
      file_name: image.name,
      ...imageSize,
    });

    image.objects.forEach((annotation) => {
      const newAnnotation: COCO.Annotation = {
        id: cocoDataset.annotations.length,
        image_id: imageId,
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
          imageSize,
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

        Object.assign(newAnnotation, { segmentation, area });
      }

      if (annotation.mask && annotation.mask.length > 0) {
        const ddsRle = annotation.mask;
        const canvas = rleToCanvas(ddsRle, imageSize, '#fff');
        const segmentation = ddsRleToCocoRle(ddsRle, imageSize);
        if (canvas) {
          const { area } = getMaskInfoByCanvas(canvas);
          Object.assign(newAnnotation, {
            segmentation,
            area,
          });
        } else {
          Object.assign(newAnnotation, { segmentation });
        }
      }

      if (annotation.points && annotation.points.length > 0) {
        const { points } = annotation;
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
      }

      cocoDataset.annotations.push(newAnnotation);
    });
  }

  cocoDataset.categories.sort((curr, next) => curr.id - next.id);

  cocoDataset.images.sort((curr, next) => curr.id - next.id);

  return cocoDataset;
};

export const convertCocoDatasetToAnnotStates = (
  dataset: COCO.Dataset,
  currStates: IAnnotatorStates,
): IAnnotatorStates => {
  const {
    info: cocoInfo,
    categories: cocoCategories,
    images: cocoImages,
    annotations: cocoAnnots,
  } = dataset;
  const {
    info: currInfo,
    categories: currCategories,
    images: currUploadImages,
  } = currStates;

  const { getStringItemId: getStringCategoryID } = idConverter(
    IMPORT_CATEGORYID_PRIFIX,
    [],
  );
  const { getStringItemId: getStringImageID } = idConverter(
    IMPORT_IMAGE_PRIFIX,
    [],
  );
  const { getStringItemId: getStringAnnotID } = idConverter(
    IMPORT_ANNOT_PRIFIX,
    [],
  );

  const res: IAnnotatorStates = {
    info: { ...currInfo, ...cocoInfo },
    categories: currCategories,
    images: currUploadImages,
  };

  if (cocoCategories && cocoCategories.length > 0) {
    res.categories = cocoCategories?.map(({ id, name }) => ({
      id: getStringCategoryID(id),
      name,
    }));
  }

  if (cocoImages && cocoImages.length > 0) {
    const imageMap = new Map(res.images.map((image) => [image.name, image]));

    cocoImages.forEach((cocoImage) => {
      const image = imageMap.get(cocoImage.file_name);
      if (image) {
        image.id = getStringImageID(cocoImage.id);
        image.width = cocoImage.width;
        image.height = cocoImage.height;
      }
    });
  }

  if (cocoAnnots && cocoAnnots.length > 0) {
    const cocoImageMap = new Map(cocoImages.map((image) => [image.id, image]));
    const uploadImageMap = new Map(
      res.images.map((image) => [image.id, image]),
    );

    cocoAnnots.forEach((cocoAnnot) => {
      const {
        id: cocoAnnotId,
        image_id: cocoImageId,
        category_id: cocoCategoryId,
        bbox: cocoBbox,
      } = cocoAnnot;

      const cocoImageData = cocoImageMap.get(cocoImageId);
      const targetImageData = uploadImageMap.get(getStringImageID(cocoImageId));

      if (cocoImageData && targetImageData) {
        const { width: imgWidth, height: imgHeight } = cocoImageData;
        const [x, y, width, height] = cocoBbox!;
        const newObject = {
          id: getStringAnnotID(cocoAnnotId),
          categoryId: getStringCategoryID(cocoCategoryId!),
          categoryName: cocoCategories?.find(
            (item) => item.id === cocoCategoryId,
          )?.name,
          boundingBox: translateRectToBoundingBox(
            { x, y, width, height },
            { width: imgWidth, height: imgHeight },
          ),
        };

        if (!targetImageData.objects) {
          targetImageData.objects = [];
        }
        targetImageData.objects.push(newObject);
      }
    });
  }
  return res;
};

export const validateCocoData = (
  data: any,
): {
  success: boolean;
  message?: string;
} => {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      message: 'Format Error',
    };
  }

  if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
    return {
      success: false,
      message: 'Field Images Empty',
    };
  }

  if (
    !data.images.every(
      (img: any) =>
        typeof img === 'object' &&
        img.hasOwnProperty('id') &&
        img.hasOwnProperty('file_name'),
    )
  ) {
    return {
      success: false,
      message: 'Invalid Image Data',
    };
  }

  if (!data.annotations || !Array.isArray(data.annotations)) {
    return {
      success: false,
      message: 'Annotations Format Error',
    };
  }

  if (
    !data.annotations.every(
      (ann: any) =>
        typeof ann === 'object' &&
        ann.hasOwnProperty('id') &&
        ann.hasOwnProperty('image_id'),
    )
  ) {
    return {
      success: false,
      message: 'Invalid Annotation Data',
    };
  }

  if (!data.categories || !Array.isArray(data.categories)) {
    return {
      success: false,
      message: 'Categories Format Error',
    };
  }

  if (
    !data.categories.every(
      (cat: any) =>
        typeof cat === 'object' &&
        cat.hasOwnProperty('id') &&
        cat.hasOwnProperty('name'),
    )
  ) {
    return {
      success: false,
      message: 'Invalid Category Data',
    };
  }

  const checkFieldsId = (array: any[], fieldName: string) => {
    const ids = new Set();
    for (const item of array) {
      if (typeof item.id === undefined) {
        return {
          success: false,
          message: `Missing ${fieldName} ID`,
        };
      }
      if (!Number.isInteger(item.id)) {
        return {
          success: false,
          message: `Int ID Required for ${fieldName}`,
        };
      }
      if (ids.has(item.id)) {
        return {
          success: false,
          message: `Duplicate ${fieldName} ID`,
        };
      }
      ids.add(item.id);
    }
  };

  const validationResults = [
    checkFieldsId(data.images, 'Image'),
    checkFieldsId(data.annotations, 'Annotation'),
    checkFieldsId(data.categories, 'Category'),
  ];

  for (const result of validationResults) {
    if (result) {
      return result;
    }
  }

  return {
    success: true,
  };
};
