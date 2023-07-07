import { useEffect, useMemo, useState } from 'react';
import { Updater } from 'use-immer';
import { getCategoryColors } from '@/utils/color';
import { DATA } from '@/services/type';
import { DrawData, EditState, EditorMode, IAnnotationObject } from '../type';
import { EElementType, KEYPOINTS_VISIBLE_TYPE } from '@/constants';
import { cloneDeep } from 'lodash';

interface IProps {
  visible: boolean;
  mode: EditorMode;
  categories: DATA.Category[];
  setCategories?: Updater<DATA.Category[]>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  editState: EditState;
  updateObject: (object: IAnnotationObject, index: number) => void;
  updateAllObject: (objectList: IAnnotationObject[]) => void;
}

export default function useLabels({
  visible,
  categories,
  setCategories,
  drawData,
  setDrawData,
  editState,
  updateObject,
  updateAllObject,
}: IProps) {
  const [aiLabels, setAiLabels] = useState<string[]>([]);
  const labelColors = useMemo(
    () => getCategoryColors(categories.map((item) => item.name)),
    [categories],
  );

  const onCreateCategory = (name: string) => {
    if (categories.find((item) => item.name === name) || !setCategories) return;
    setCategories((categories) => [
      ...categories,
      {
        id: name,
        name,
      },
    ]);
  };

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

  const onChangeObjectHidden = (index: number, hidden: boolean) => {
    const newObject = { ...drawData.objectList[index] };
    newObject.hidden = hidden;
    updateObject(newObject, index);
  };

  const onChangeCategoryHidden = (category: string, hidden: boolean) => {
    const updatedObjects = drawData.objectList.map((item) => {
      const temp = { ...item };
      if (temp.label === category) temp.hidden = hidden;
      return temp;
    });
    updateAllObject(updatedObjects);
  };

  const onChangeElementVisible = (eleType: EElementType, visible: boolean) => {
    const newObject = { ...drawData.objectList[editState.focusObjectIndex] };
    switch (eleType) {
      case EElementType.Rect: {
        if (newObject.rect) {
          newObject.rect.visible = visible;
          updateObject(newObject, editState.focusObjectIndex);
        }
        break;
      }
      case EElementType.Polygon: {
        if (newObject.polygon) {
          newObject.polygon.visible = visible;
          updateObject(newObject, editState.focusObjectIndex);
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
    updateObject(newObject, editState.focusObjectIndex);
  };

  const onChangeActiveClass = (name: string) => {
    setDrawData((s) => {
      s.activeClassName = name;
    });
  };

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
    labelColors,
    curObjects,
    onChangeObjectHidden,
    onChangeCategoryHidden,
    onChangeElementVisible,
    onChangePointVisible,
    onChangeActiveClass,
    onCreateCategory,
  };
}
