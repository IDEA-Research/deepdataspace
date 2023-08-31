import { useCallback } from 'react';
import { Updater } from 'use-immer';
import { Modal, message } from 'antd';
import { EBasicToolItem, EObjectType, ESubToolItem } from '../constants';
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

interface IProps {
  mode: EditorMode;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  setAiLabels: (labels: string[]) => void;
  editState: EditState;
  setEditState: Updater<EditState>;
  getAnnotColor: (category: string) => string;
  clientSize: ISize;
  naturalSize: ISize;
  addObject: (
    object: IAnnotationObject,
    notActive?: boolean | undefined,
  ) => void;
  removeObject: (index: number) => void;
  updateObject: (object: IAnnotationObject, index: number) => void;
  updateAllObject: (objectList: IAnnotationObject[]) => void;
}

const useToolActions = ({
  mode,
  drawData,
  setDrawData,
  setDrawDataWithHistory,
  setAiLabels,
  editState,
  setEditState,
  clientSize,
  naturalSize,
  addObject,
  removeObject,
  updateObject,
  updateAllObject,
  getAnnotColor,
}: IProps) => {
  const { localeText } = useLocale();

  const onDeleteCurrObject = useCallback(() => {
    if (
      drawData.isBatchEditing &&
      drawData.objectList[drawData.activeObjectIndex]?.status !==
        EObjectStatus.Commited
    ) {
      setDrawData((s) => {
        s.objectList[s.activeObjectIndex].status = EObjectStatus.Unchecked;
        s.creatingObject = undefined;
        s.prompt = {};
        s.activeObjectIndex = -1;
      });
      return;
    }

    if (drawData.activeObjectIndex > -1) {
      removeObject(drawData.activeObjectIndex);
    }
    setDrawData((s) => {
      s.creatingObject = undefined;
      s.prompt = {};
      s.activeObjectIndex = -1;
    });
  }, [
    drawData.isBatchEditing,
    drawData.objectList,
    drawData.activeObjectIndex,
  ]);

  const onFinishCurrCreate = useCallback(
    (label: string) => {
      if (drawData.creatingObject?.type === EObjectType.Mask) {
        const maskRle = objectToRle(
          clientSize,
          naturalSize,
          drawData.creatingObject?.tempMaskSteps || [],
          drawData.creatingObject?.maskCanvasElement,
        );
        if (maskRle && maskRle.length > 0) {
          const color = getAnnotColor(label);
          const newObject = {
            type: EObjectType.Mask,
            label,
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
      } else {
        const newObject = {
          ...drawData.objectList[drawData.activeObjectIndex],
        };
        newObject.label = label;
        if (editState.annotsDisplayOptions.colorByCategory) {
          newObject.color = getAnnotColor(label);
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
      });
      setEditState((s) => {
        s.latestLabel = label;
      });
    },
    [drawData.creatingObject],
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
          obj.color = getAnnotColor(obj.label);
          return obj;
        });
      s.objectList = validObjs;
      s.isBatchEditing = false;
      s.activeObjectIndex = -1;
      s.creatingObject = undefined;
    });
    setAiLabels([]);
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
    });
  }, [drawData.objectList]);

  const selectTool = useCallback(
    (tool: EBasicToolItem) => {
      if (
        mode !== EditorMode.Edit ||
        tool === drawData.selectedTool ||
        drawData.isBatchEditing
      )
        return;
      setDrawData((s) => {
        s.selectedTool = tool;
        if (tool === EBasicToolItem.Mask) {
          s.selectedSubTool = s.AIAnnotation
            ? ESubToolItem.AutoSegmentByBox
            : ESubToolItem.PenAdd;
        }
        s.activeObjectIndex = -1;
        s.creatingObject = undefined;
      });
    },
    [mode, drawData.selectedTool, drawData.isBatchEditing],
  );

  const selectSubTool = useCallback(
    (tool: ESubToolItem) => {
      if (
        mode !== EditorMode.Edit ||
        tool === drawData.selectedSubTool ||
        drawData.isBatchEditing
      )
        return;
      setDrawData((s) => {
        s.selectedSubTool = tool;
      });

      // save unfinished mask object
      if (tool === ESubToolItem.AutoEdgeStitching && drawData.creatingObject) {
        onFinishCurrCreate(
          drawData.creatingObject.label || editState.latestLabel || '',
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
    setDrawData((s) => {
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
      if (mode !== EditorMode.Edit || drawData.isBatchEditing) return;
      setDrawData((s) => {
        s.AIAnnotation = active;
      });
    },
    [mode, drawData.isBatchEditing],
  );

  const onSaveAIPolygon = useCallback(() => {
    const label = drawData.creatingObject?.label || '';
    const color = getAnnotColor(label);
    addObject({
      type: EObjectType.Polygon,
      polygon: drawData.creatingObject?.polygon,
      label,
      color,
      hidden: false,
      status: EObjectStatus.Commited,
    });
    setDrawData((s) => {
      s.activeObjectIndex = s.objectList.length - 1;
      s.prompt = {};
    });
  }, [drawData.creatingObject]);

  const onCancelAIPolygon = useCallback(() => {
    setDrawData((s) => {
      s.creatingObject = undefined;
      s.activeObjectIndex = -1;
      s.prompt = {};
    });
  }, []);

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
      const color = getAnnotColor(item.label);
      if (
        item.type === EObjectType.Mask &&
        item.maskRle &&
        item.maskRle.length > 0
      ) {
        return {
          ...item,
          maskCanvasElement: rleToCanvas(item.maskRle, naturalSize, color),
        };
      }
      return { ...item, color };
    });
    updateAllObject(newObjectList);
  }, [drawData.objectList, getAnnotColor]);

  return {
    onDeleteCurrObject,
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
    onSaveAIPolygon,
    onCancelAIPolygon,
    onChangeSkeletonConf,
    onChangeLimitConf,
    onChangeImageDisplayOpts,
    onChangeAnnotsDisplayOpts,
    onChangeColorMode,
  };
};

export default useToolActions;
