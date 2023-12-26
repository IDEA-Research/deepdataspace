import { useCallback, useEffect, useMemo, useState } from 'react';
import { Updater } from 'use-immer';
import {
  Category,
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
} from '../type';
import {
  EBasicToolItem,
  EBasicToolTypeMap,
  EElementType,
  ELabelType,
  KEYPOINTS_VISIBLE_TYPE,
  LABEL_TOOL_MAP,
} from '../constants';
import { cloneDeep } from 'lodash';

interface IProps {
  isOldMode?: boolean;
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
  isOldMode,
  categories,
  setCategories,
  drawData,
  setDrawData,
  editState,
  updateObjectWithoutHistory,
  updateAllObjectWithoutHistory,
}: IProps) {
  const [aiLabels, setAiLabels] = useState<string | undefined>(undefined);
  const curObjects = drawData.objectList;

  const labelOptions: Category[] = useMemo(() => {
    if (isOldMode) return categories;

    if (
      drawData.objectList[drawData.activeObjectIndex] ||
      drawData.selectedTool !== EBasicToolItem.Drag
    ) {
      const toolType = drawData.objectList[drawData.activeObjectIndex]
        ? Object.keys(EBasicToolTypeMap).find(
            (key) =>
              drawData.objectList[drawData.activeObjectIndex].type ===
              EBasicToolTypeMap[key as unknown as EBasicToolItem],
          )
        : drawData.selectedTool;
      const labelType = Object.keys(LABEL_TOOL_MAP).find(
        // @ts-ignore
        (key) => toolType === LABEL_TOOL_MAP[key],
      );
      return categories.filter((category) => category.labelType === labelType);
    }

    return [];
  }, [
    categories,
    drawData.objectList,
    drawData.activeObjectIndex,
    drawData.selectedTool,
  ]);

  const classificationOptions: Category[] = useMemo(() => {
    return (
      categories?.filter(
        (category) => category.labelType === ELabelType.Classification,
      ) || []
    );
  }, [categories]);

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

  const onChangeObjectHidden = useCallback(
    (index: number, hidden: boolean) => {
      const newObject = { ...drawData.objectList[index] };
      newObject.hidden = hidden;
      updateObjectWithoutHistory(newObject, index);
    },
    [drawData.objectList],
  );

  const onChangeCategoryHidden = useCallback(
    (categoryName: string, hidden: boolean) => {
      const updatedObjects = drawData.objectList.map((item) => {
        const temp = { ...item };
        if (
          categories.find((c) => c.id === item.labelId)?.name === categoryName
        ) {
          temp.hidden = hidden;
        }
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
  const onChangePointVisible = useCallback(
    (pointIndex: number, visible: KEYPOINTS_VISIBLE_TYPE) => {
      const newObject = cloneDeep(
        drawData.objectList[drawData.activeObjectIndex],
      );
      const point = newObject.keypoints?.points?.[pointIndex];
      if (point) {
        point.visible = visible;
      }
      updateObjectWithoutHistory(newObject, drawData.activeObjectIndex);
    },
    [drawData.activeObjectIndex, drawData.objectList],
  );

  const onChangeActiveClass = useCallback((name: string) => {
    setDrawData((s) => {
      if (name === s.activeClassName) return;
      s.activeClassName = name;
    });
  }, []);

  useEffect(() => {
    if (drawData.activeObjectIndex < 0) return;
    const activeItemLabelName =
      categories.find(
        (item) =>
          item.id === drawData.objectList[drawData.activeObjectIndex].labelId,
      )?.name || '';
    if (activeItemLabelName !== drawData.activeClassName) {
      onChangeActiveClass(activeItemLabelName);
    }
  }, [drawData.activeObjectIndex]);

  return {
    labelOptions,
    classificationOptions,
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
