import { cloneDeep } from 'lodash';
import { useCallback, useMemo } from 'react';
import { Updater } from 'use-immer';

import { EElementType, EObjectType } from '../constants';
import {
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
  DrawObject,
  IEditingAttribute,
  EObjectStatus,
  VideoFramesData,
  Category,
} from '../type';

interface IProps {
  mode: EditorMode;
  categories: Category[];
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  framesData?: VideoFramesData;
  setFramesData?: Updater<VideoFramesData>;
  setEditState: Updater<EditState>;
  translateToObject?: (annotation: any, videoFrameCount?: number) => any;
  judgeEditingAttribute?: (
    object: IAnnotationObject,
    index: number,
  ) => IEditingAttribute | undefined;
  updateHistory: (drawData: DrawData, theframesData?: VideoFramesData) => void;
}

const useObjects = ({
  mode,
  categories,
  drawData,
  setDrawData,
  setDrawDataWithHistory,
  framesData,
  setFramesData,
  setEditState,
  translateToObject,
  judgeEditingAttribute,
  updateHistory,
}: IProps) => {
  const initObjectList = (annotations: DrawObject[]) => {
    setDrawData((s) => {
      const newDrawData = cloneDeep(s);
      const newFramesData = cloneDeep(framesData);
      newDrawData.initialized = true;
      if (newFramesData) {
        // video
        const objects = annotations.map(
          (annotation) =>
            translateToObject?.(annotation, newFramesData.list.length) || {},
        );
        newFramesData.objects = objects
          .filter((item) => !!item.objects)
          .map((item) => item.objects);
        newDrawData.classifications = objects
          .filter((item) => !!item.classification)
          .map((item) => item.classification);
        newDrawData.objectList = newFramesData.objects.map(
          (item) => item[newFramesData.activeIndex],
        );
        setFramesData?.(newFramesData);
      } else {
        // image
        const objects = annotations.map(
          (annotation) => translateToObject?.(annotation) || {},
        );
        newDrawData.classifications = objects.filter(
          (item) => item.type === EObjectType.Classification,
        );
        newDrawData.objectList = objects.filter(
          (item) =>
            item.type !== EObjectType.Custom &&
            item.type !== EObjectType.Classification,
        );
      }
      updateHistory(cloneDeep(newDrawData), cloneDeep(newFramesData));
      return newDrawData;
    });
  };

  const addObject = (object: IAnnotationObject) => {
    if (mode !== EditorMode.Edit) return;
    setDrawDataWithHistory((s) => {
      s.objectList.push(object);
      s.isJustCreated = true;
      s.creatingObject = undefined;
      s.activeObjectIndex = -1;
      s.activeClassName =
        categories.find((item) => item.id === object.labelId)?.name || '';

      // Show attribut editor
      if (judgeEditingAttribute) {
        s.editingAttribute = judgeEditingAttribute(
          object,
          s.objectList.length - 1,
        );
      }
    });
  };

  const removeObject = (index: number) => {
    if (mode !== EditorMode.Edit || !drawData.objectList[index]) return;
    setEditState((s) => {
      s.focusObjectIndex = -1;
      s.focusEleIndex = -1;
      s.focusEleType = EElementType.Rect;
    });

    const newFramesData = cloneDeep(framesData);
    const newDrawData = cloneDeep(drawData);
    if (newFramesData && newFramesData.objects[index]) {
      newFramesData.objects.splice(index, 1);
      setFramesData?.(newFramesData);
    }
    if (newDrawData.objectList[index]) {
      newDrawData.objectList.splice(index, 1);
      newDrawData.activeObjectIndex = -1;
      newDrawData.creatingObject = undefined;
      newDrawData.editingAttribute = undefined;
    }
    setDrawData(newDrawData);
    updateHistory(cloneDeep(newDrawData), cloneDeep(newFramesData));
  };

  const removeAllObjects = useCallback(() => {
    if (mode !== EditorMode.Edit) return;
    setEditState((s) => {
      s.focusObjectIndex = -1;
      s.focusEleIndex = -1;
      s.focusEleType = EElementType.Rect;
    });

    const newFramesData = cloneDeep(framesData);
    const newDrawData = cloneDeep(drawData);
    if (newFramesData) {
      newFramesData.objects = [];
      setFramesData?.(newFramesData);
    }
    newDrawData.objectList = [];
    newDrawData.activeObjectIndex = -1;
    newDrawData.creatingObject = undefined;
    newDrawData.editingAttribute = undefined;
    setDrawData(newDrawData);
    updateHistory(cloneDeep(newDrawData), cloneDeep(newFramesData));
  }, [mode, framesData, drawData]);

  const updateObject = (object: IAnnotationObject, index: number) => {
    if (mode !== EditorMode.Edit || !drawData.objectList[index]) return;
    setDrawDataWithHistory((s) => {
      // Change label & Show attribut editor
      if (
        object.labelId !== s.objectList[index].labelId &&
        judgeEditingAttribute
      ) {
        s.editingAttribute = judgeEditingAttribute(object, index);
      }

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
      s.isJustCreated = false;
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

  const commitedObjects = useMemo(() => {
    return drawData.objectList.filter((obj) => {
      return obj?.status === EObjectStatus.Commited;
    });
  }, [drawData.isBatchEditing, drawData.objectList]);

  const currObject = useMemo(() => {
    return (
      drawData.objectList[drawData.activeObjectIndex] || drawData.creatingObject
    );
  }, [
    drawData.objectList,
    drawData.activeObjectIndex,
    drawData.creatingObject,
  ]);

  return {
    initObjectList,
    addObject,
    removeObject,
    removeAllObjects,
    updateObject,
    updateAllObject,
    updateObjectWithoutHistory,
    updateAllObjectWithoutHistory,
    commitedObjects,
    currObject,
  };
};

export default useObjects;
