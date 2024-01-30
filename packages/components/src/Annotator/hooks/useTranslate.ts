import { cloneDeep } from 'lodash';

import {
  BODY_TEMPLATE,
  ELabelType,
  EObjectType,
  KEYPOINTS_VISIBLE_TYPE,
} from '../constants';
import { rleToCanvas } from '../tools/useMask';
import {
  IAnnotationObject,
  EObjectStatus,
  DrawObject,
  Category,
  BaseObject,
} from '../type';
import {
  getObjectType,
  translateBoundingBoxToRect,
  translatePointsToPointObjs,
  translatePointObjsToPointAttrs,
  getSegmentationPoints,
  translateRectToBoundingBox,
  translatePolygonsToSegmentation,
  translatePointsToRect,
  translatePointGroupsToPoints,
  translateRectToPointsArray,
  translatePolygonsToPointsArrayGroup,
  newTranslatePointsToPointObjs,
  newTranslatePointObjsToPointAttrs,
  getCanvasPoint,
  getNaturalPoint,
  translateUVtoPolylinePoints,
  convertLaneLineColorToHex,
} from '../utils/compute';

interface IProps {
  isOldMode?: boolean;
  clientSize: ISize;
  naturalSize: ISize;
  categories: Category[];
  getAnnotColor: (category: string) => string;
}

const useTranslate = ({
  isOldMode,
  clientSize,
  naturalSize,
  categories,
  getAnnotColor,
}: IProps) => {
  /**
   * Use for annotator & old project
   * @param annotation
   * @returns
   */
  const translateAnnotationToObject = (
    annotation: DrawObject,
  ): IAnnotationObject => {
    let {
      categoryId,
      boundingBox,
      points,
      lines,
      pointNames,
      pointColors,
      segmentation,
      mask,
      alpha,
      point,
      polyline: polylineUv,
      lineColor,
      lineType,
    } = annotation;

    const color = getAnnotColor(categoryId || '');
    const newObj: IAnnotationObject = {
      labelId: categoryId || '',
      type: EObjectType.Rectangle,
      hidden: false,
      conf: annotation.conf || 1,
      customStyles: annotation.customStyles,
      status: EObjectStatus.Commited,
      color,
    };

    if (boundingBox) {
      const rect = translateBoundingBoxToRect(boundingBox, clientSize);
      Object.assign(newObj, { rect: { visible: true, ...rect } });
    }

    if (
      points &&
      points.length > 0 &&
      lines &&
      lines.length > 0 &&
      pointNames &&
      pointColors
    ) {
      const pointObjs: IElement<IPoint>[] = translatePointsToPointObjs(
        points,
        pointNames,
        pointColors,
        naturalSize,
        clientSize,
      );
      Object.assign(newObj, {
        keypoints: {
          points: pointObjs,
          lines,
        },
      });
    }
    if (segmentation) {
      const group = getSegmentationPoints(
        segmentation,
        naturalSize,
        clientSize,
      );
      const polygon: IElement<IPolygonGroup> = {
        group,
        visible: true,
      };
      Object.assign(newObj, { polygon });
    }

    if (mask) {
      const maskRleStr = mask.counts || '';
      Object.assign(newObj, {
        maskRle: maskRleStr,
        maskCanvasElement: rleToCanvas(maskRleStr, naturalSize, color),
      });
    }

    if (alpha) {
      const alphaImageElement = new Image();
      alphaImageElement.src = alpha;
      // alphaImageElement.crossOrigin = 'anonymous';
      Object.assign(newObj, {
        alpha,
        alphaImageElement,
      });
    }

    if (point) {
      Object.assign(newObj, {
        point: {
          ...getCanvasPoint(point, naturalSize, clientSize),
          visible: KEYPOINTS_VISIBLE_TYPE.labeledVisible,
        },
      });
    }

    if (polylineUv && lineType && lineColor) {
      const line = translateUVtoPolylinePoints(polylineUv).map((point) =>
        getCanvasPoint([point.x, point.y], naturalSize, clientSize),
      );
      const polyline: IElement<IPolylineGroup> = {
        group: [line],
        visible: true,
        lineType,
        color: convertLaneLineColorToHex(lineColor),
      };
      Object.assign(newObj, { polyline });
    }

    newObj.type = getObjectType(newObj);
    return newObj;
  };

  /**
   * Use for annotator & old project
   * @param annotation
   * @returns
   */
  const translateObjectToAnnotation = (obj: IAnnotationObject): BaseObject => {
    const { labelId, rect, keypoints, polygon, maskRle, point } = obj;
    const labelName =
      categories.find((item) => item.id === labelId)?.name || '';
    const annoObj = {
      categoryId: labelId,
      categoryName: labelName,
    };
    if (rect) {
      Object.assign(annoObj, {
        boundingBox: translateRectToBoundingBox(rect, clientSize),
      });
    }
    if (keypoints) {
      Object.assign(annoObj, {
        lines: keypoints.lines,
        ...translatePointObjsToPointAttrs(
          keypoints.points,
          naturalSize,
          clientSize,
        ),
      });
    }
    if (polygon) {
      const segmentation = translatePolygonsToSegmentation(
        polygon,
        naturalSize,
        clientSize,
      );
      Object.assign(annoObj, {
        segmentation,
      });
    }
    if (maskRle) {
      Object.assign(annoObj, {
        mask: {
          counts: maskRle,
          size: [naturalSize.height, naturalSize.width],
        },
      });
    }
    if (point) {
      const { x, y } = getNaturalPoint(
        [point.x, point.y],
        naturalSize,
        clientSize,
      );
      Object.assign(annoObj, {
        point: [x, y],
      });
    }
    return annoObj;
  };

  /**
   * Use for new project
   * @param label
   * @returns
   */
  const translateLabelToObject = (
    originLabel: {
      labelId: string;
      labelValue: any;
      attributes?: (string | number | number[])[];
    },
    videoFrameCount?: number,
  ) => {
    const { labelId, labelValue } = originLabel;
    const color = getAnnotColor(labelId);
    const label = categories.find((item) => item.id === labelId);
    // confirm format correct
    const attributes =
      label?.attributes?.map(
        (_, index) => originLabel.attributes?.[index] || null,
      ) || undefined;
    const newObj: IAnnotationObject = {
      labelId,
      type: EObjectType.Custom,
      hidden: false,
      status: EObjectStatus.Commited,
      color,
      attributes,
    };

    const convertLabelValue = (newObj: IAnnotationObject, labelValue: any) => {
      switch (label?.labelType) {
        case ELabelType.Rectangle: {
          const rect = translatePointsToRect(
            labelValue,
            naturalSize,
            clientSize,
          );
          Object.assign(newObj, {
            rect: { visible: true, ...rect },
            type: EObjectType.Rectangle,
          });
          break;
        }
        case ELabelType.Polygon: {
          const group = translatePointGroupsToPoints(
            labelValue,
            naturalSize,
            clientSize,
          );
          const polygon: IElement<IPolygonGroup> = {
            group,
            visible: true,
          };
          Object.assign(newObj, {
            polygon,
            type: EObjectType.Polygon,
          });
          break;
        }
        case ELabelType.Skeleton: {
          const pointObjs: IElement<IPoint>[] = newTranslatePointsToPointObjs(
            labelValue,
            BODY_TEMPLATE.pointNames,
            BODY_TEMPLATE.pointColors,
            naturalSize,
            clientSize,
          );
          Object.assign(newObj, {
            keypoints: {
              points: pointObjs,
              lines: BODY_TEMPLATE.lines,
            },
            type: EObjectType.Skeleton,
          });
          break;
        }
        case ELabelType.Mask: {
          const maskRleStr = labelValue.counts || '';
          Object.assign(newObj, {
            maskRle: maskRleStr,
            maskCanvasElement: rleToCanvas(maskRleStr, naturalSize, color),
            type: EObjectType.Mask,
          });
          break;
        }
        case ELabelType.Classification: {
          Object.assign(newObj, {
            labelValue,
            type: EObjectType.Classification,
          });
          break;
        }
      }
      return newObj;
    };

    if (videoFrameCount && videoFrameCount > 0) {
      if (label?.labelType === ELabelType.Classification) {
        return {
          classification: convertLabelValue(newObj, labelValue),
        };
      } else {
        const objects: any[] = new Array(videoFrameCount).fill(undefined);
        let tempObj: any;
        Object.keys(labelValue).forEach((key: string) => {
          tempObj = convertLabelValue(cloneDeep(newObj), labelValue[key]);
          objects[Number(key)] = {
            ...tempObj,
            frameEmpty: false,
          };
        });
        return {
          objects: objects.map(
            (item) =>
              item || {
                ...cloneDeep(tempObj),
                frameEmpty: true,
              },
          ),
        };
      }
    }
    {
      return convertLabelValue(newObj, labelValue);
    }
  };

  /**
   * Use for new project
   * @param obj
   * @returns
   */
  const translateObjectToLabel = (obj: IAnnotationObject) => {
    const { labelId, rect, keypoints, polygon, maskRle, attributes } = obj;
    const label = categories.find((item) => item.id === labelId);

    const annoObj: any = {
      labelId: labelId,
      attributes: attributes || label?.attributes?.map(() => null) || [],
    };
    switch (label?.labelType) {
      case ELabelType.Rectangle: {
        if (rect) {
          annoObj.labelValue = translateRectToPointsArray(
            rect,
            clientSize,
            naturalSize,
          );
        }
        break;
      }
      case ELabelType.Polygon: {
        if (polygon) {
          annoObj.labelValue = translatePolygonsToPointsArrayGroup(
            polygon,
            naturalSize,
            clientSize,
          );
        }
        break;
      }
      case ELabelType.Skeleton: {
        if (keypoints) {
          const { points } = newTranslatePointObjsToPointAttrs(
            keypoints.points,
            naturalSize,
            clientSize,
          );
          annoObj.labelValue = points;
        }
        break;
      }
      case ELabelType.Mask: {
        if (maskRle) {
          annoObj.labelValue = {
            counts: maskRle,
            size: [naturalSize.height, naturalSize.width],
          };
        }
        break;
      }
    }
    return annoObj;
  };

  return {
    translateAnnotationToObject,
    translateObjectToAnnotation,
    translateLabelToObject,
    translateObjectToLabel,
    translateObject: isOldMode
      ? translateObjectToAnnotation
      : translateObjectToLabel,
    translateToObject: isOldMode
      ? translateAnnotationToObject
      : translateLabelToObject,
  };
};

export default useTranslate;
