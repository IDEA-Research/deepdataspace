import { useEffect, useMemo, useState } from 'react';
import { Updater } from 'use-immer';
import { getCategoryColors } from '@/utils/color';
import { DATA } from '@/services/type';
import { DrawData, EditState, EditorMode, IAnnotationObject } from '../type';
import { EElementType, EObjectType, KEYPOINTS_VISIBLE_TYPE } from '@/constants';
import { cloneDeep } from 'lodash';
import { changeMaskCanvasColor } from '../tools/mask';

interface IProps {
  visible: boolean;
  mode: EditorMode;
  categories: DATA.Category[];
  setCategories?: Updater<DATA.Category[]>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  updateObject: (object: IAnnotationObject, index: number) => void;
}

export default function useLabels({
  visible,
  categories,
  setCategories,
  drawData,
  setDrawData,
  editState,
  setEditState,
  updateObject,
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

  const onChangeObjectLabel = (index: number, label: string) => {
    setEditState((s) => {
      s.latestLabel = label;
    });
    const newObject = { ...drawData.objectList[index] };
    newObject.label = label;
    // mask color change
    if (newObject.type === EObjectType.Mask && newObject.maskCanvasElement) {
      const color = labelColors[label] || '#ffffff';
      newObject.maskCanvasElement = changeMaskCanvasColor(
        newObject.maskCanvasElement,
        color,
      );
    }
    updateObject(newObject, index);
  };

  const onChangeObjectHidden = (index: number, hidden: boolean) => {
    setDrawData((s) => {
      if (s.objectList[index]) {
        s.objectList[index].hidden = hidden;
      }
    });
  };

  const onChangeCategoryHidden = (category: string, hidden: boolean) => {
    setDrawData((s) => {
      s.objectList.forEach((item) => {
        if (item.label === category) item.hidden = hidden;
      });
    });
  };

  const onChangeElementVisible = (eleType: EElementType, visible: boolean) => {
    switch (eleType) {
      case EElementType.Rect: {
        setDrawData((s) => {
          const rect = s.objectList[editState.focusObjectIndex]?.rect;
          if (rect) {
            rect.visible = visible;
          }
        });
        break;
      }
      case EElementType.Polygon: {
        setDrawData((s) => {
          const polygon = s.objectList[editState.focusObjectIndex]?.polygon;
          if (polygon) {
            polygon.visible = visible;
          }
        });
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
    onChangeObjectLabel,
    onChangeObjectHidden,
    onChangeCategoryHidden,
    onChangeElementVisible,
    onChangePointVisible,
    onChangeActiveClass,
    onCreateCategory,
  };
}
