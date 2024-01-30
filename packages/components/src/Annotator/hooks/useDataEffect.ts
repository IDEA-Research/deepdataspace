import { cloneDeep } from 'lodash';
import { useCallback, useEffect } from 'react';
import { Updater } from 'use-immer';

import {
  BaseObject,
  Category,
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  AnnoItem,
  DrawObject,
  EditState,
  VideoFramesData,
} from '../type';
import { scaleDrawData, scaleFramesObjects } from '../utils/compute';

import usePreviousState from './usePreviousState';

interface IProps {
  imagePos: React.MutableRefObject<IPoint>;
  clientSize: ISize;
  naturalSize: ISize;
  annotations: DrawObject[];
  setAnnotations: Updater<DrawObject[]>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setFramesData?: Updater<VideoFramesData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  initObjectList: (annotations: DrawObject[]) => void;
  updateRender: (updateDrawData?: DrawData) => void;
  clearHistory: () => void;
  objectsFilter?: (imageData: any) => BaseObject[];
  labelOptions: Category[];
  customDefaultDrawData?: Partial<DrawData>;
}

const useDataEffect = ({
  imagePos,
  clientSize,
  naturalSize,
  annotations,
  setAnnotations,
  drawData,
  setDrawData,
  setFramesData,
  editState,
  setEditState,
  initObjectList,
  updateRender,
  clearHistory,
  objectsFilter,
  labelOptions,
  customDefaultDrawData,
}: IProps) => {
  const [preClientSize, clearPreClientSize] =
    usePreviousState<ISize>(clientSize);

  /**
   * Rebuilds the draw data for the annotation tool.
   * @param {boolean} isUpdateDrawData - Optional parameter that specifies whether to update draw data.
   * @return {void}
   */
  const rebuildDrawData = (
    isForce?: boolean,
    theAnnotations?: DrawObject[],
  ) => {
    if (
      !clientSize.width ||
      !clientSize.height ||
      !naturalSize.width ||
      !naturalSize.height
    )
      return;
    if (!drawData.initialized || isForce) {
      initObjectList(theAnnotations || annotations);
    } else if (drawData.initialized && preClientSize) {
      // scale change
      if (setFramesData) {
        setFramesData?.((s) => {
          s.objects = scaleFramesObjects(s.objects, preClientSize, clientSize);
        });
      }
      const updateDrawData = scaleDrawData(drawData, preClientSize, clientSize);
      setDrawData(updateDrawData);
      updateRender(updateDrawData);
      clearPreClientSize();
    }
  };

  const resetDrawData = useCallback(() => {
    setDrawData({
      ...cloneDeep(DEFAULT_DRAW_DATA),
      brushSize: drawData.brushSize,
      selectedTool: drawData.selectedTool,
      selectedSubTool: drawData.selectedSubTool,
      selectedModel: drawData.selectedModel,
      AIAnnotation: drawData.AIAnnotation,
      ...customDefaultDrawData,
    });
  }, [
    DEFAULT_DRAW_DATA,
    customDefaultDrawData,
    drawData.brushSize,
    drawData.selectedSubTool,
    drawData.selectedTool,
    drawData.AIAnnotation,
  ]);

  const resetEditData = useCallback(() => {
    setEditState({
      ...cloneDeep(DEFAULT_EDIT_STATE),
      latestLabelId: labelOptions?.[0]?.id || '',
      imageDisplayOptions: editState.imageDisplayOptions,
      annotsDisplayOptions: editState.annotsDisplayOptions,
    });
  }, [
    DEFAULT_EDIT_STATE,
    labelOptions,
    editState.imageDisplayOptions,
    editState.annotsDisplayOptions,
  ]);

  const applyImageAnnots = useCallback(
    (imageData: AnnoItem) => {
      const annotations = imageData?.objects ? [...imageData?.objects] : [];
      const currAnnotations =
        imageData && objectsFilter
          ? objectsFilter(imageData) || []
          : annotations;
      setAnnotations(currAnnotations);
      rebuildDrawData(true, currAnnotations);
    },
    [objectsFilter, rebuildDrawData],
  );

  const resetDataWithImageData = useCallback(
    (
      imageData?: AnnoItem,
      visible: boolean = false,
      clearHistoryQueue: boolean = true,
    ) => {
      setAnnotations([]);
      resetDrawData();
      resetEditData();
      if (clearHistoryQueue) clearHistory();
      if (visible && imageData) {
        applyImageAnnots(imageData);
      }
    },
    [resetDrawData, resetEditData, clearHistory, applyImageAnnots],
  );

  /** Update canvas while data changing */
  useEffect(() => {
    updateRender();
  }, [drawData, editState, imagePos.current.x, imagePos.current.y]);

  /** Recalculate drawData while changing size */
  useEffect(() => {
    rebuildDrawData();
  }, [clientSize.height, clientSize.width]);

  /** Annotations / naturalSize changed */
  useEffect(() => {
    rebuildDrawData(true);
  }, [naturalSize.width, naturalSize.height]);

  useEffect(() => {
    if (!labelOptions?.length) return;
    setEditState((s) => {
      if (
        !s.latestLabelId ||
        !labelOptions.find((item) => item.id === s.latestLabelId)
      ) {
        s.latestLabelId = labelOptions[0]?.id;
      }
    });
  }, [labelOptions]);

  return {
    rebuildDrawData,
    resetDataWithImageData,
  };
};

export default useDataEffect;
