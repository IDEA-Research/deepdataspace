import { Modal, message } from 'antd';
import { useLocale } from 'dds-utils/locale';
import { cloneDeep } from 'lodash';
import { useCallback, useEffect } from 'react';
import { Updater } from 'use-immer';

import {
  EBasicToolItem,
  EnumModelType,
  EObjectType,
  ESubToolItem,
  TOOL_MODELS_MAP,
} from '../constants';
import { objectToRle, rleToCanvas } from '../tools/useMask';
import {
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
  EObjectStatus,
  IImageDisplayOptions,
  IAnnotsDisplayOptions,
} from '../type';

import { OnAiAnnotationFunc } from './useAiModels';

interface IProps {
  mode: EditorMode;
  drawData: DrawData;
  manualMode?: boolean;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  getAnnotColor: (category: string) => string;
  clientSize: ISize;
  naturalSize: ISize;
  addObject: (
    object: IAnnotationObject,
    notActive?: boolean | undefined,
  ) => void;
  updateObject: (object: IAnnotationObject, index: number) => void;
  updateAllObject: (objectList: IAnnotationObject[]) => void;
  onAiAnnotation: OnAiAnnotationFunc;
}

const useToolActions = ({
  mode,
  manualMode,
  drawData,
  setDrawData,
  setDrawDataWithHistory,
  editState,
  setEditState,
  clientSize,
  naturalSize,
  addObject,
  updateObject,
  updateAllObject,
  getAnnotColor,
  onAiAnnotation,
}: IProps) => {
  const { localeText } = useLocale();

  // TODO
  const getColorForMaskObj = useCallback(
    (labelId: string) => {
      if (editState.annotsDisplayOptions.colorByCategory) {
        return getAnnotColor(labelId);
      }
      if (drawData.activeObjectIndex > -1) {
        return drawData.objectList[drawData.activeObjectIndex].color;
      }
      return drawData.creatingObject?.color || getAnnotColor(labelId);
    },
    [
      editState.annotsDisplayOptions.colorByCategory,
      getAnnotColor,
      drawData.activeObjectIndex,
      drawData.objectList,
      drawData.creatingObject,
    ],
  );

  const onChangeObjectLabel = (labelId: string) => {
    const editObject = drawData.objectList[drawData.activeObjectIndex];
    if (editObject) {
      const newObject = {
        ...drawData.objectList[drawData.activeObjectIndex],
        attributes: undefined,
      };
      newObject.labelId = labelId;
      if (editState.annotsDisplayOptions.colorByCategory) {
        newObject.color = getAnnotColor(labelId);
      }
      if (newObject.type === EObjectType.Mask && newObject.maskRle) {
        newObject.maskCanvasElement = rleToCanvas(
          newObject.maskRle,
          naturalSize,
          newObject.color,
        );
      }
      // batch editing set conf to 1
      if (drawData.isBatchEditing) {
        newObject.conf = 1;
      }
      updateObject(newObject, drawData.activeObjectIndex);
    }
    setEditState((s) => {
      s.latestLabelId = labelId;
    });
  };

  const onFinishCurrCreate = useCallback(
    (labelId: string) => {
      if (drawData.creatingObject?.type === EObjectType.Mask) {
        const maskRle = objectToRle(
          clientSize,
          naturalSize,
          drawData.creatingObject?.tempMaskSteps || [],
          drawData.creatingObject?.maskCanvasElement,
        );
        if (maskRle && maskRle.length > 0) {
          const color = getColorForMaskObj(labelId);
          const newObject = {
            ...drawData.objectList[drawData.activeObjectIndex],
            type: EObjectType.Mask,
            labelId,
            hidden: false,
            maskRle,
            maskCanvasElement: rleToCanvas(maskRle, naturalSize, color),
            conf: 1,
            status: EObjectStatus.Commited,
            color,
          };
          if (drawData.activeObjectIndex > -1) {
            // edit mask object
            updateObject(newObject, drawData.activeObjectIndex);
          } else {
            // add mask object
            addObject(newObject);
          }
        } else if (maskRle) {
          // Empty mask
          message.warning(localeText('DDSAnnotator.anno.mask.emptyWarning'));
        } else {
          // Other error
          message.error(
            localeText('DDSAnnotator.anno.mask.translateToRleError'),
          );
        }
      } else if (drawData.creatingObject?.type === EObjectType.Polygon) {
        const color = getAnnotColor(labelId);
        const newObject = {
          ...drawData.objectList[drawData.activeObjectIndex],
          type: EObjectType.Polygon,
          labelId,
          hidden: false,
          polygon: drawData.creatingObject?.polygon,
          conf: 1,
          status: EObjectStatus.Commited,
          color,
        };
        if (drawData.activeObjectIndex > -1) {
          // edit existing polygon
          updateObject(newObject, drawData.activeObjectIndex);
        } else {
          // add new polygon
          addObject(newObject);
        }
      } else {
        const newObject = {
          ...drawData.objectList[drawData.activeObjectIndex],
        };
        newObject.labelId = labelId;
        if (editState.annotsDisplayOptions.colorByCategory) {
          newObject.color = getAnnotColor(labelId);
        }
        // batch editing set conf to 1
        if (drawData.isBatchEditing) {
          newObject.conf = 1;
        }
        updateObject(newObject, drawData.activeObjectIndex);
      }
      setDrawData((s) => {
        s.creatingObject = undefined;
        s.prompt = {};
        s.activeObjectIndex = -1;
        if (s.selectedSubTool === ESubToolItem.PenErase) {
          s.selectedSubTool = ESubToolItem.PenAdd;
        } else if (s.selectedSubTool === ESubToolItem.BrushErase) {
          s.selectedSubTool = ESubToolItem.BrushAdd;
        }
      });
      setEditState((s) => {
        s.latestLabelId = labelId;
      });
    },
    [
      drawData.creatingObject,
      drawData.activeObjectIndex,
      drawData.objectList,
      drawData.selectedSubTool,
    ],
  );

  const onAcceptValidObjects = useCallback(() => {
    setDrawDataWithHistory((s) => {
      const validObjs = cloneDeep(drawData.objectList)
        .filter((obj) => {
          return obj.status !== EObjectStatus.Unchecked;
        })
        .map((obj) => {
          obj.status = EObjectStatus.Commited;
          if (obj.type !== EObjectType.Mask) {
            obj.color = getAnnotColor(obj.labelId);
          }
          return obj;
        });
      s.objectList = validObjs;
      s.isBatchEditing = false;
      s.activeObjectIndex = -1;
      s.creatingObject = undefined;
      s.prompt = {};
    });
  }, [drawData.objectList, setDrawDataWithHistory]);

  const onAbortBatchObjects = useCallback(() => {
    setDrawDataWithHistory((s) => {
      const validObjs = cloneDeep(drawData.objectList).filter((obj) => {
        return obj.status === EObjectStatus.Commited;
      });
      s.objectList = validObjs;
      s.isBatchEditing = false;
      s.activeObjectIndex = -1;
      s.creatingObject = undefined;
      s.prompt = {};
    });
  }, [drawData.objectList, setDrawDataWithHistory]);

  const isInAiSession = useCallback(() => {
    const {
      selectedTool,
      AIAnnotation,
      selectedModel,
      selectedSubTool,
      isBatchEditing,
      creatingObject,
    } = drawData;

    const judegInAiSession = () => {
      if (!AIAnnotation) return false;

      if (selectedTool === EBasicToolItem.Rectangle) {
        return isBatchEditing;
      }

      if (selectedTool === EBasicToolItem.Polygon) {
        return creatingObject;
      }

      if (selectedTool === EBasicToolItem.Skeleton) {
        return isBatchEditing;
      }

      if (selectedTool === EBasicToolItem.Mask) {
        const currModel = selectedModel[selectedTool];
        if (currModel === EnumModelType.IVP) {
          return isBatchEditing;
        }

        if (
          currModel === EnumModelType.SegmentEverything &&
          selectedSubTool === ESubToolItem.AutoSegmentEverything
        ) {
          return isBatchEditing;
        }

        if (currModel === EnumModelType.SegmentByMask) {
          return creatingObject;
        }

        return false;
      }
      return false;
    };

    const result = judegInAiSession();
    if (result) {
      message.warning(localeText('DDSAnnotator.smart.tip.limitJump'));
    }
    return result;
  }, [
    drawData.selectedTool,
    drawData.selectedModel,
    drawData.AIAnnotation,
    drawData.selectedSubTool,
    drawData.isBatchEditing,
    drawData.creatingObject,
  ]);

  const selectTool = useCallback(
    (tool: EBasicToolItem) => {
      if (
        mode !== EditorMode.Edit ||
        (tool === drawData.selectedTool && !drawData.AIAnnotation)
      )
        return;

      if (isInAiSession()) return;

      setDrawData((s) => {
        s.selectedTool = tool;
        s.isJustCreated = false;
        s.AIAnnotation = false;
        s.activeObjectIndex = -1;
        s.creatingObject = undefined;
        s.editingAttribute = undefined;
        s.prompt = {};
      });
    },
    [
      mode,
      drawData.selectedTool,
      drawData.isBatchEditing,
      drawData.AIAnnotation,
      isInAiSession,
    ],
  );

  const selectSubTool = useCallback(
    (subtool: ESubToolItem) => {
      const {
        selectedTool,
        selectedModel,
        selectedSubTool,
        AIAnnotation,
        isBatchEditing,
      } = drawData;

      if (mode !== EditorMode.Edit || subtool === selectedSubTool) return;

      // TODO: check subtool belong to current tool & model

      if (
        selectedTool === EBasicToolItem.Mask &&
        AIAnnotation &&
        selectedModel[selectedTool] === EnumModelType.SegmentEverything &&
        isBatchEditing
      ) {
        return;
      }

      setDrawData((s) => {
        s.selectedSubTool = subtool;
      });
    },
    [
      mode,
      drawData.selectedTool,
      drawData.AIAnnotation,
      drawData.selectedModel,
      drawData.isBatchEditing,
      drawData.selectedSubTool,
      isInAiSession,
    ],
  );

  const forceChangeTool = useCallback(
    (tool: EBasicToolItem, subtool: ESubToolItem) => {
      setDrawData((s) => {
        s.selectedTool = tool;
        s.selectedSubTool = subtool;
      });
    },
    [],
  );

  const onExitAIAnnotation = useCallback(() => {
    setDrawDataWithHistory((s) => {
      s.objectList = s.objectList.filter(
        (obj) => obj.status === EObjectStatus.Commited,
      );
      s.AIAnnotation = false;
      s.isBatchEditing = false;
      s.creatingObject = undefined;
      s.prompt = {};
    });
  }, [setDrawDataWithHistory]);

  const setBrushSize = useCallback(
    (size: number) => {
      if (mode !== EditorMode.Edit) return;
      setDrawData((s) => {
        s.brushSize = size;
      });
    },
    [mode],
  );

  const setPointResolution = useCallback(
    (value: number) => {
      if (mode !== EditorMode.Edit) return;
      setDrawData((s) => {
        s.pointResolution = value;
      });
    },
    [mode],
  );

  const onChangePointResolution = useCallback(
    (value: number, update?: boolean) => {
      setPointResolution(value);
      if (
        update &&
        drawData.creatingObject &&
        drawData.creatingObject.type === EObjectType.Polygon &&
        drawData.prompt.promptsQueue &&
        drawData.prompt.promptsQueue.length > 0
      ) {
        const updateDrawData: DrawData = {
          ...drawData,
          pointResolution: value,
        };
        onAiAnnotation({
          type: EObjectType.Polygon,
          drawData: updateDrawData,
          promptsQueue: drawData.prompt.promptsQueue,
        });
      }
    },
    [drawData.creatingObject, drawData.prompt],
  );

  const displayAIModeUnavailableModal = () => {
    Modal.info({
      centered: true,
      closable: true,
      title: localeText('DDSAnnotator.smart.infoModal.title'),
      content: localeText('DDSAnnotator.smart.infoModal.content'),
      okText: localeText('DDSAnnotator.smart.infoModal.action'),
      onOk: () => {
        window.open('https://deepdataspace.com', '_blank');
      },
    });
  };

  const activeAIAnnotation = useCallback(
    (active: boolean) => {
      if (mode !== EditorMode.Edit || manualMode) return;

      if (isInAiSession()) return;

      setDrawData((s) => {
        s.AIAnnotation = active;
      });
    },
    [mode, manualMode, isInAiSession],
  );

  const onChangeSkeletonConf = useCallback(
    (range: [number, number]) => {
      setDrawDataWithHistory((s) => {
        const updateObjects = cloneDeep(drawData.objectList).map((obj) => {
          if (obj.status === EObjectStatus.Commited) {
            return obj;
          }
          if (obj.conf === undefined) {
            obj.status = EObjectStatus.Unchecked;
            return obj;
          }
          obj.status =
            obj.conf < range[0] || obj.conf > range[1]
              ? EObjectStatus.Unchecked
              : EObjectStatus.Checked;
          return obj;
        });
        s.objectList = updateObjects;
      });
    },
    [drawData.objectList, setDrawDataWithHistory],
  );

  const onChangeLimitConf = useCallback(
    (value: number) => {
      setDrawDataWithHistory((s) => {
        const updateObjects = cloneDeep(drawData.objectList).map((obj) => {
          if (obj.status === EObjectStatus.Commited) {
            return obj;
          }
          obj.status =
            obj.conf && obj.conf >= value
              ? EObjectStatus.Checked
              : EObjectStatus.Unchecked;
          return obj;
        });
        s.objectList = updateObjects;
        const count = updateObjects.filter(
          (item) => item.status === EObjectStatus.Checked,
        ).length;
        message.success(
          localeText(`DDSAnnotator.smart.tip.annotationApplied`, {
            count,
          }),
        );
      });
    },
    [drawData.objectList, setDrawDataWithHistory],
  );

  const onChangeImageDisplayOpts = useCallback(
    (value: IImageDisplayOptions) => {
      setEditState((s) => {
        s.imageDisplayOptions = value;
      });
    },
    [],
  );

  const onChangeAnnotsDisplayOpts = useCallback(
    (value: IAnnotsDisplayOptions) => {
      setEditState((s) => {
        s.annotsDisplayOptions = value;
      });
    },
    [],
  );

  const onChangeColorMode = useCallback(() => {
    if (!drawData.objectList || !drawData.objectList.length) return;
    const newObjectList = cloneDeep(drawData.objectList).map((item) => {
      const color = getAnnotColor(item.labelId);
      if (
        item.type === EObjectType.Mask &&
        item.maskRle &&
        item.maskRle.length > 0
      ) {
        return {
          ...item,
          color,
          maskCanvasElement: rleToCanvas(item.maskRle, naturalSize, color),
        };
      }
      return { ...item, color };
    });
    updateAllObject(newObjectList);
  }, [drawData.objectList, getAnnotColor]);

  const checkChangeModel = useCallback(
    (modelKey: EnumModelType) => {
      const { selectedTool } = drawData;

      const currModels = TOOL_MODELS_MAP[selectedTool];
      if (!currModels.includes(modelKey)) return false;

      if (isInAiSession()) return false;

      return true;
    },
    [TOOL_MODELS_MAP, drawData.selectedTool, isInAiSession],
  );

  const onSelectModel = useCallback(
    (modelKey: EnumModelType) => {
      if (!checkChangeModel(modelKey)) {
        return;
      }

      setDrawData((s) => {
        s.selectedModel[s.selectedTool] = modelKey;
      });
    },
    [checkChangeModel],
  );

  useEffect(() => {
    setDrawData((s) => {
      if (s.AIAnnotation) {
        const model = s.selectedModel[s.selectedTool];
        switch (s.selectedTool) {
          case EBasicToolItem.Rectangle:
            if (model === EnumModelType.IVP) {
              s.selectedSubTool = ESubToolItem.PositiveVisualPrompt;
            } else {
              s.selectedSubTool = ESubToolItem.PenAdd; // TODO
            }
            break;
          case EBasicToolItem.Mask:
            if (model === EnumModelType.IVP) {
              s.selectedSubTool = ESubToolItem.PositiveVisualPrompt;
            } else if (model === EnumModelType.SegmentEverything) {
              const isAvailbale =
                (s.objectList.length === 0 && !s.creatingObject) ||
                s.isBatchEditing;
              s.selectedSubTool = isAvailbale
                ? ESubToolItem.AutoSegmentEverything
                : ESubToolItem.PenAdd;
            } else {
              s.selectedSubTool = ESubToolItem.AutoSegmentByBox;
            }
            break;
          case EBasicToolItem.Polygon:
            s.selectedSubTool = ESubToolItem.AutoSegmentByBox;
            break;
          case EBasicToolItem.Skeleton:
          case EBasicToolItem.Drag:
            s.selectedSubTool = ESubToolItem.PenAdd;
            break;
        }
      } else {
        s.selectedSubTool = ESubToolItem.PenAdd;
      }
    });
  }, [drawData.selectedTool, drawData.AIAnnotation, drawData.selectedModel]);

  return {
    onChangeObjectLabel,
    onFinishCurrCreate,
    onAcceptValidObjects,
    onAbortBatchObjects,
    selectTool,
    selectSubTool,
    forceChangeTool,
    onExitAIAnnotation,
    setBrushSize,
    activeAIAnnotation,
    displayAIModeUnavailableModal,
    onChangeSkeletonConf,
    onChangeLimitConf,
    onChangeImageDisplayOpts,
    onChangeAnnotsDisplayOpts,
    onChangeColorMode,
    onChangePointResolution,
    onSelectModel,
    isInAiSession,
  };
};

export default useToolActions;
