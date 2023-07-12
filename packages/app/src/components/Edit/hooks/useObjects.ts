import {
  EBasicToolItem,
  EBasicToolTypeMap,
  EElementType,
  EObjectType,
} from '@/constants';
import { DATA } from '@/services/type';
import { getSegmentationPoints } from '@/utils/annotation';
import {
  getObjectType,
  isValidBBox,
  translateBoundingBoxToRect,
  translatePointsToPointObjs,
} from '@/utils/compute';
import { Updater } from 'use-immer';
import { DrawData, EditState, EditorMode, IAnnotationObject } from '../type';
import { rleToCanvas } from '../tools/useMask';

interface IProps {
  objectsFilter?: (objects: DATA.BaseObject[]) => DATA.BaseObject[];
  mode: EditorMode;
  annotations: DATA.BaseObject[];
  setAnnotations: Updater<DATA.BaseObject[]>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  clientSize: ISize;
  naturalSize: ISize;
}

const useObjects = ({
  mode,
  drawData,
  setDrawData,
  setDrawDataWithHistory,
  editState,
  setEditState,
  clientSize,
  naturalSize,
}: IProps) => {
  const translateAnnotationToObject = (
    annotation: DATA.BaseObject,
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
      maskRle,
    } = annotation;
    const color = labelColors[categoryName || ''] || '#ffffff';

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

    if (maskRle) {
      Object.assign(newObj, {
        maskRle,
        maskCanvasElement: rleToCanvas(maskRle, naturalSize, color),
      });
    }

    newObj.type = getObjectType(newObj);
    return newObj;
  };

  const initObjectList = (
    annotations: DATA.BaseObject[],
    labelColors: Record<string, string>,
  ) => {
    setDrawDataWithHistory((s) => {
      s.objectList = annotations.map((annotation) => {
        return translateAnnotationToObject(annotation, labelColors);
      });
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

  const removeObject = (index: number) => {
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
  };

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

  const setCurrSelectedObject = (index = editState.focusObjectIndex) => {
    if (index < 0) return;
    setDrawData((s) => {
      s.activeObjectIndex = index;
      s.creatingObject = {
        ...drawData.objectList[index],
        currIndex: undefined,
        startPoint: undefined,
        tempMaskSteps: [],
        maskStep: undefined,
      };

      if (
        s.selectedTool !== EBasicToolItem.Drag &&
        s.objectList[index] &&
        EBasicToolTypeMap[s.selectedTool] !== s.objectList[index].type
      ) {
        s.selectedTool = EBasicToolItem.Drag;
      }

      // TODO: support edit mask in drag tool
      if (s.objectList[index].type === EObjectType.Mask) {
        s.selectedTool = EBasicToolItem.Mask;
      }
    });
  };

  return {
    initObjectList,
    addObject,
    removeObject,
    updateObject,
    updateAllObject,
    setCurrSelectedObject,
  };
};

export default useObjects;
