import { AnnotationType, EElementType, EObjectType } from '../constants';
import {
  getObjectType,
  translateBoundingBoxToRect,
  translatePointsToPointObjs,
  getSegmentationPoints,
} from '../utils/compute';
import { Updater } from 'use-immer';
import {
  BaseObject,
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
  EObjectStatus,
  DrawObject,
} from '../type';
import { rleToCanvas } from '../tools/useMask';
import { useCallback } from 'react';
import { generateUniformHexColor } from '../utils/color';

interface IProps {
  mode: EditorMode;
  annotations: BaseObject[];
  setAnnotations: Updater<BaseObject[]>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  clientSize: ISize;
  naturalSize: ISize;
  displayAnnotationType?: AnnotationType;
}

const useObjects = ({
  mode,
  drawData,
  setDrawData,
  setDrawDataWithHistory,
  setEditState,
  clientSize,
  naturalSize,
  editState,
  displayAnnotationType,
}: IProps) => {
  const translateAnnotationToObject = (
    annotation: DrawObject,
    labelColors: Record<string, string>,
  ): IAnnotationObject => {
    let {
      categoryName,
      boundingBox,
      points,
      lines,
      pointNames,
      pointColors,
      segmentation,
      mask,
      alpha,
    } = annotation;

    const color = editState.annotsDisplayOptions.colorByCategory
      ? labelColors[categoryName || ''] || '#ffffff'
      : generateUniformHexColor();

    const newObj: IAnnotationObject = {
      label: categoryName || '',
      type: EObjectType.Rectangle,
      hidden: false,
      conf: annotation.conf || 1,
      labelId: annotation.labelId,
      compareResult: annotation.compareResult,
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

    if (mask && mask.length) {
      Object.assign(newObj, {
        maskRle: mask,
        maskCanvasElement: rleToCanvas(mask, naturalSize, color),
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

    newObj.type = getObjectType(newObj, displayAnnotationType);
    return newObj;
  };

  const initObjectList = (
    annotations: DrawObject[],
    labelColors: Record<string, string>,
  ) => {
    setDrawDataWithHistory((s) => {
      s.objectList = annotations
        .map((annotation) => {
          return translateAnnotationToObject(annotation, labelColors);
        })
        .filter((annotation) => annotation.type !== EObjectType.Custom);
    });
  };

  const addObject = (object: IAnnotationObject, notActive?: boolean) => {
    if (mode !== EditorMode.Edit) return;
    setDrawDataWithHistory((s) => {
      s.objectList.push(object);
      s.creatingObject = { ...object };
      s.activeObjectIndex = notActive ? -1 : s.objectList.length - 1;
    });
  };

  const removeObject = useCallback(
    (index: number) => {
      if (mode !== EditorMode.Edit || !drawData.objectList[index]) return;
      setDrawDataWithHistory((s) => {
        if (s.objectList[index]) {
          s.objectList.splice(index, 1);
          s.activeObjectIndex = -1;
          s.creatingObject = undefined;
        }
      });
      setEditState((s) => {
        s.focusObjectIndex = -1;
        s.focusEleIndex = -1;
        s.focusEleType = EElementType.Rect;
      });
    },
    [mode, drawData.objectList],
  );

  const removeAllObjects = useCallback(() => {
    if (mode !== EditorMode.Edit) return;
    setDrawDataWithHistory((s) => {
      s.objectList = [];
      s.creatingObject = undefined;
      s.prompt = {};
    });
    setEditState((s) => {
      s.focusObjectIndex = -1;
      s.focusEleIndex = -1;
      s.focusEleType = EElementType.Rect;
    });
  }, [mode]);

  const updateObject = (object: IAnnotationObject, index: number) => {
    if (mode !== EditorMode.Edit || !drawData.objectList[index]) return;
    setDrawDataWithHistory((s) => {
      s.objectList[index] = object;
      if (s.creatingObject && s.activeObjectIndex === index) {
        s.creatingObject = { ...object };
      }
    });
  };

  const updateAllObject = (objectList: IAnnotationObject[]) => {
    setDrawDataWithHistory((s) => {
      s.objectList = objectList;
      if (s.creatingObject && s.objectList[s.activeObjectIndex]) {
        s.creatingObject = { ...s.objectList[s.activeObjectIndex] };
      }
    });
  };

  const updateObjectWithoutHistory = (
    object: IAnnotationObject,
    index: number,
  ) => {
    if (!drawData.objectList[index]) return;
    setDrawData((s) => {
      s.objectList[index] = object;
      if (s.creatingObject && s.activeObjectIndex === index) {
        s.creatingObject = { ...object };
      }
    });
  };

  const updateAllObjectWithoutHistory = (objectList: IAnnotationObject[]) => {
    setDrawData((s) => {
      s.objectList = objectList;
      if (s.creatingObject && s.objectList[s.activeObjectIndex]) {
        s.creatingObject = { ...s.objectList[s.activeObjectIndex] };
      }
    });
  };

  return {
    initObjectList,
    addObject,
    removeObject,
    removeAllObjects,
    updateObject,
    updateAllObject,
    updateObjectWithoutHistory,
    updateAllObjectWithoutHistory,
  };
};

export default useObjects;
