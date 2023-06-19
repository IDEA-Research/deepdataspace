import { EElementType, EObjectType } from '@/constants';
import { DATA } from '@/services/type';
import { getSegmentationPoints } from '@/utils/annotation';
import {
  getObjectType,
  isValidBBox,
  translateBoundingBoxToRect,
  translatePointsToPointObjs,
} from '@/utils/compute';
import { Updater } from 'use-immer';
import { DrawData, EditorMode, IAnnotationObject } from '..';
import { mockMaskObject } from '../mask';

interface IProps {
  objectsFilter?: (objects: DATA.BaseObject[]) => DATA.BaseObject[];
  mode: EditorMode;
  annotations: DATA.BaseObject[];
  setAnnotations: Updater<DATA.BaseObject[]>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  clientSize: ISize;
  naturalSize: ISize;
  addAnnotation: (object: IAnnotationObject) => void;
  removeAnnotation: (index: number) => void;
  updateAnnotation: (object: IAnnotationObject, index: number) => void;
  updateAllAnnotation: (objects: IAnnotationObject[]) => void;
}

const useObjects = ({
  mode,
  drawData,
  setDrawData,
  clientSize,
  naturalSize,
  addAnnotation,
  removeAnnotation,
  updateAnnotation,
  updateAllAnnotation,
}: IProps) => {
  const translateAnnotationToObject = (
    annotation: DATA.BaseObject,
  ): IAnnotationObject => {
    let {
      categoryName,
      boundingBox,
      points,
      lines,
      pointNames,
      pointColors,
      segmentation,
    } = annotation;

    const newObj: IAnnotationObject = {
      label: categoryName || '',
      type: EObjectType.Rectangle,
      hidden: false,
      conf: 1,
    };

    if (boundingBox && isValidBBox(boundingBox)) {
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
    newObj.type = getObjectType(newObj);
    return newObj;
  };

  const initObjectList = (annotations: DATA.BaseObject[]) => {
    setDrawData((s) => {
      s.objectList = annotations.map((annotation) => {
        return translateAnnotationToObject(annotation);
      });
      // TODO: mask test
      s.objectList = [mockMaskObject];
      console.log('init >>>>', s.objectList);
    });
  };

  const addObject = (object: IAnnotationObject) => {
    if (mode !== EditorMode.Edit) return;
    setDrawData((s) => {
      s.objectList.push(object);
      s.creatingObject = undefined;
      s.activeObjectIndex = s.objectList.length - 1;
      s.changed = true;
    });
    addAnnotation(object);
  };

  const removeObject = (index: number) => {
    if (mode !== EditorMode.Edit || !drawData.objectList[index]) return;
    setDrawData((s) => {
      if (s.objectList[index]) {
        s.objectList.splice(index, 1);
        s.activeObjectIndex = -1;
        s.focusObjectIndex = -1;
        s.focusEleIndex = -1;
        s.focusEleType = EElementType.Rect;
        s.changed = true;
      }
    });
    removeAnnotation(index);
  };

  const updateObject = (object: IAnnotationObject, index: number) => {
    if (mode !== EditorMode.Edit || !drawData.objectList[index]) return;
    setDrawData((s) => {
      s.objectList[index] = object;
      s.changed = true;
    });
    updateAnnotation(object, index);
  };

  const updateAllObject = (objectList: IAnnotationObject[]) => {
    setDrawData((s) => {
      s.objectList = objectList;
      s.changed = true;
    });
    updateAllAnnotation(objectList);
  };

  return {
    initObjectList,
    addObject,
    removeObject,
    updateObject,
    updateAllObject,
  };
};

export default useObjects;
