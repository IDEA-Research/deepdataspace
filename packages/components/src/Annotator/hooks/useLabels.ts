import { useCallback, useEffect, useState } from 'react';
import { Updater } from 'use-immer';
import {
  Category,
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
} from '../type';
import { EElementType, KEYPOINTS_VISIBLE_TYPE } from '../constants';
import { cloneDeep } from 'lodash';

interface IProps {
  visible: boolean;
  mode: EditorMode;
  categories: Category[];
  setCategories?: Updater<Category[]>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  editState: EditState;
  updateObjectWithoutHistory: (
    object: IAnnotationObject,
    index: number,
  ) => void;
  updateAllObjectWithoutHistory: (objectList: IAnnotationObject[]) => void;
}

export default function useLabels({
  visible,
  categories,
  setCategories,
  drawData,
  setDrawData,
  editState,
  updateObjectWithoutHistory,
  updateAllObjectWithoutHistory,
}: IProps) {
  const [aiLabels, setAiLabels] = useState<string[]>([]);

  const onCreateCategory = useCallback(
    (name: string) => {
      if (categories.find((item) => item.name === name) || !setCategories)
        return;
      setCategories((categories) => [
        ...categories,
        {
          id: name,
          name,
        },
      ]);
    },
    [categories],
  );

  useEffect(() => {
    const allLabels = categories.map((item) => item.name);
    const commonLabels = aiLabels.filter((item) => allLabels.includes(item));
    setAiLabels(commonLabels);
  }, [categories]);

  useEffect(() => {
    if (!visible) {
      setAiLabels([]);
    }
  }, [visible]);

  const curObjects = drawData.objectList;

  const onChangeObjectHidden = useCallback(
    (index: number, hidden: boolean) => {
      const newObject = { ...drawData.objectList[index] };
      newObject.hidden = hidden;
      updateObjectWithoutHistory(newObject, index);
    },
    [drawData.objectList],
  );

  const onChangeCategoryHidden = useCallback(
    (category: string, hidden: boolean) => {
      const updatedObjects = drawData.objectList.map((item) => {
        const temp = { ...item };
        if (temp.label === category) temp.hidden = hidden;
        return temp;
      });
      updateAllObjectWithoutHistory(updatedObjects);
    },
    [drawData.objectList],
  );

  const onChangeElementVisible = (eleType: EElementType, visible: boolean) => {
    const newObject = { ...drawData.objectList[editState.focusObjectIndex] };
    switch (eleType) {
      case EElementType.Rect: {
        if (newObject.rect) {
          newObject.rect.visible = visible;
          updateObjectWithoutHistory(newObject, editState.focusObjectIndex);
        }
        break;
      }
      case EElementType.Polygon: {
        if (newObject.polygon) {
          newObject.polygon.visible = visible;
          updateObjectWithoutHistory(newObject, editState.focusObjectIndex);
        }
        break;
      }
    }
  };

  /**
   * Updates the visibility of a keypoint and then updates the object in the draw
   * data object list at the focus object index with the new object.
   *
   * @param {KEYPOINTS_VISIBLE_TYPE} visible - The visibility value for the keypoint.
   */
  const onChangePointVisible = (visible: KEYPOINTS_VISIBLE_TYPE) => {
    const newObject = cloneDeep(
      drawData.objectList[editState.focusObjectIndex],
    );
    const point = newObject.keypoints?.points?.[editState.focusEleIndex];
    if (point) {
      point.visible = visible;
    }
    updateObjectWithoutHistory(newObject, editState.focusObjectIndex);
  };

  const onChangeActiveClass = useCallback((name: string) => {
    setDrawData((s) => {
      if (name === s.activeClassName) return;
      s.activeClassName = name;
    });
  }, []);

  useEffect(() => {
    if (drawData.activeObjectIndex < 0) return;
    const activeItemLabel =
      drawData.objectList[drawData.activeObjectIndex].label;
    if (activeItemLabel !== drawData.activeClassName) {
      onChangeActiveClass(activeItemLabel);
    }
  }, [drawData.activeObjectIndex]);

  return {
    aiLabels,
    setAiLabels,
    curObjects,
    onChangeObjectHidden,
    onChangeCategoryHidden,
    onChangeElementVisible,
    onChangePointVisible,
    onChangeActiveClass,
    onCreateCategory,
  };
}
