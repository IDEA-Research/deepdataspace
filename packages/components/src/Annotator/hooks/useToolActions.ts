import { useCallback } from 'react';
import { Updater } from 'use-immer';
import { Modal, message } from 'antd';
import {
  EBasicToolItem,
  EnumModelType,
  EObjectType,
  ESubToolItem,
} from '../constants';
import {
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
  EObjectStatus,
  IImageDisplayOptions,
  IAnnotsDisplayOptions,
} from '../type';
import { objectToRle, rleToCanvas } from '../tools/useMask';
import { useLocale } from 'dds-utils/locale';
import { cloneDeep } from 'lodash';
import { OnAiAnnotationFunc } from './useActions';

interface IProps {
  mode: EditorMode;
  drawData: DrawData;
  manualMode?: boolean;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  setAiLabels: (labels?: string) => void;
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
  setAiLabels,
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
            addObject(newObject, true);
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
          addObject(newObject, true);
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
        if (
          [ESubToolItem.PenErase, ESubToolItem.BrushErase].includes(
            s.selectedSubTool,
          )
        ) {
          s.selectedSubTool = ESubToolItem.PenAdd;
        }
      });
      setEditState((s) => {
        s.latestLabelId = labelId;
      });
    },
    [drawData.creatingObject, drawData.activeObjectIndex, drawData.objectList],
  );

  const onCloseAnnotationEditor = useCallback(() => {
    setDrawData((s) => {
      s.creatingObject = undefined;
      s.activeObjectIndex = -1;
    });
  }, []);

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
    setAiLabels(undefined);
  }, [drawData.objectList]);

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
  }, [drawData.objectList]);

  const selectTool = useCallback(
    (tool: EBasicToolItem) => {
      if (
        mode !== EditorMode.Edit ||
        (tool === drawData.selectedTool && drawData.AIAnnotation) ||
        drawData.isBatchEditing
      )
        return;
      setDrawData((s) => {
        s.selectedTool = tool;
        if (tool === EBasicToolItem.Mask) {
          s.selectedSubTool = s.AIAnnotation
            ? ESubToolItem.AutoSegmentByBox
            : ESubToolItem.PenAdd;
        } else if (tool === EBasicToolItem.Polygon) {
          s.selectedSubTool = ESubToolItem.AutoSegmentByBox;
        } else if (
          tool === EBasicToolItem.Rectangle &&
          s.selectedModel === EnumModelType.IVP
        ) {
          s.selectedSubTool = ESubToolItem.PositiveVisualPrompt;
        }
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
      drawData.selectedModel,
    ],
  );

  const selectSubTool = useCallback(
    (tool: ESubToolItem) => {
      if (
        mode !== EditorMode.Edit ||
        tool === drawData.selectedSubTool ||
        (drawData.selectedTool === EBasicToolItem.Mask &&
          drawData.isBatchEditing)
      )
        return;

      setDrawData((s) => {
        s.selectedSubTool = tool;
      });

      // save unfinished mask object
      if (tool === ESubToolItem.AutoEdgeStitching && drawData.creatingObject) {
        onFinishCurrCreate(
          drawData.creatingObject.labelId || editState.latestLabelId || '',
        );
      }
    },
    [mode, drawData.selectedSubTool, drawData.isBatchEditing],
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
  }, []);

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
      if (!process.env.MODEL_API_PATH && active) {
        displayAIModeUnavailableModal();
        return;
      }
      if (mode !== EditorMode.Edit || drawData.isBatchEditing || manualMode)
        return;
      setDrawData((s) => {
        s.AIAnnotation = active;
      });
    },
    [mode, drawData.isBatchEditing],
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
    [drawData.objectList],
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
    [drawData.objectList],
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

  const onSelectModel = useCallback((type: EnumModelType) => {
    setDrawData((s) => {
      s.selectedModel = type;
      if (type === EnumModelType.IVP) {
        s.selectedSubTool = ESubToolItem.PositiveVisualPrompt;
      } else {
        // TODO
        s.selectedSubTool = ESubToolItem.PenAdd;
      }
    });
  }, []);

  return {
    onChangeObjectLabel,
    onFinishCurrCreate,
    onCloseAnnotationEditor,
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
  };
};

export default useToolActions;
