import { useCallback, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import {
  BaseObject,
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  DrawImageData,
  DrawObject,
  EditState,
} from '../type';
import { scaleDrawData } from '../utils/compute';
import { Updater } from 'use-immer';

interface IProps {
  imagePos: React.MutableRefObject<IPoint>;
  clientSize: ISize;
  preClientSize?: ISize;
  clearPreClientSize: () => void;
  naturalSize: ISize;
  annotations: DrawObject[];
  setAnnotations: Updater<DrawObject[]>;
  labelColors: Record<string, string>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  initObjectList: (
    annotations: DrawObject[],
    labelColors: Record<string, string>,
  ) => void;
  updateRender: (updateDrawData?: DrawData) => void;
  clearHistory: () => void;
  objectsFilter?: (imageData: any) => BaseObject[];
}

const useDataEffect = ({
  imagePos,
  clientSize,
  preClientSize,
  clearPreClientSize,
  naturalSize,
  annotations,
  setAnnotations,
  labelColors,
  drawData,
  setDrawData,
  editState,
  setEditState,
  initObjectList,
  updateRender,
  clearHistory,
  objectsFilter,
}: IProps) => {
  /**
   * Rebuilds the draw data for the annotation tool.
   * @param {boolean} isUpdateDrawData - Optional parameter that specifies whether to update draw data.
   * @return {void}
   */
  const rebuildDrawData = (isForce?: boolean) => {
    if (
      !clientSize.width ||
      !clientSize.height ||
      !naturalSize.width ||
      !naturalSize.height
    )
      return;

    if (!drawData.initialized || isForce) {
      // Initialization
      setDrawData((s) => {
        s.initialized = true;
      });
      initObjectList(annotations, labelColors);
    } else if (drawData.initialized && preClientSize) {
      // scale change
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
      AIAnnotation: drawData.AIAnnotation,
    });
  }, [
    DEFAULT_DRAW_DATA,
    drawData.brushSize,
    drawData.selectedSubTool,
    drawData.selectedTool,
    drawData.AIAnnotation,
  ]);

  const resetEditData = useCallback(() => {
    setEditState({
      ...cloneDeep(DEFAULT_EDIT_STATE),
      imageDisplayOptions: editState.imageDisplayOptions,
      annotsDisplayOptions: editState.annotsDisplayOptions,
    });
  }, [
    DEFAULT_EDIT_STATE,
    editState.imageDisplayOptions,
    editState.annotsDisplayOptions,
  ]);

  const applyImageAnnots = useCallback(
    (imageData: DrawImageData) => {
      const annotations = imageData?.objects ? [...imageData?.objects] : [];
      const currAnnotations =
        imageData && objectsFilter ? objectsFilter(imageData) : annotations;
      setAnnotations(currAnnotations);
    },
    [objectsFilter],
  );

  const resetDataWithImageData = useCallback(
    (
      imageData: DrawImageData,
      visible: boolean,
      clearHistoryQueue: boolean = true,
    ) => {
      resetDrawData();
      resetEditData();
      if (clearHistoryQueue) clearHistory();
      if (visible) {
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
  }, [annotations, naturalSize.width, naturalSize.height]);

  return {
    rebuildDrawData,
    resetDataWithImageData,
  };
};

export default useDataEffect;
