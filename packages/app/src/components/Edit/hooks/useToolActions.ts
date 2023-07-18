import { useCallback } from 'react';
import { Updater } from 'use-immer';
import { Modal, message } from 'antd';
import { EBasicToolItem, EObjectType, ESubToolItem } from '@/constants';
import {
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
  EObjectStatus,
} from '../type';
import { objectToRle, rleToCanvas } from '../tools/useMask';
import { useLocale } from '@/locales/helper';

interface IProps {
  mode: EditorMode;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  labelColors: Record<string, string>;
  clientSize: ISize;
  naturalSize: ISize;
  addObject: (
    object: IAnnotationObject,
    notActive?: boolean | undefined,
  ) => void;
  removeObject: (index: number) => void;
  updateObject: (object: IAnnotationObject, index: number) => void;
}

const useToolActions = ({
  mode,
  drawData,
  setDrawData,
  editState,
  setEditState,
  labelColors,
  clientSize,
  naturalSize,
  addObject,
  removeObject,
  updateObject,
}: IProps) => {
  const { localeText } = useLocale();

  const onDeleteCurrObject = () => {
    if (drawData.activeObjectIndex > -1) {
      removeObject(drawData.activeObjectIndex);
    }
    setDrawData((s) => {
      s.creatingObject = undefined;
      s.prompt = {};
      s.activeObjectIndex = -1;
    });
  };

  const onFinishCurrCreate = (label: string) => {
    if (drawData.creatingObject?.type === EObjectType.Mask) {
      const maskRle = objectToRle(
        clientSize,
        naturalSize,
        drawData.creatingObject?.tempMaskSteps || [],
        drawData.creatingObject?.maskCanvasElement,
      );
      if (maskRle && maskRle.length > 0) {
        const color = labelColors[label] || '#fff';
        const newObject = {
          type: EObjectType.Mask,
          label,
          hidden: false,
          maskRle,
          maskCanvasElement: rleToCanvas(maskRle, naturalSize, color),
          conf: 1,
          status: EObjectStatus.Commited,
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
        message.warning(localeText('editor.anno.mask.emptyWarning'));
      } else {
        // Other error
        message.error(localeText('editor.anno.mask.translateToRleError'));
      }
    } else {
      // onChangeObjectLabel(drawData.activeObjectIndex, label);
      const newObject = { ...drawData.objectList[drawData.activeObjectIndex] };
      newObject.label = label;
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
  };

  const onCloseAnnotationEditor = () => {
    setDrawData((s) => {
      s.creatingObject = undefined;
      s.activeObjectIndex = -1;
    });
  };

  const selectTool = (tool: EBasicToolItem) => {
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
  };

  const selectSubTool = (tool: ESubToolItem) => {
    if (mode !== EditorMode.Edit) return;
    setDrawData((s) => {
      s.selectedSubTool = tool;
    });

    // save unfinished mask object
    if (tool === ESubToolItem.AutoEdgeStitching && drawData.creatingObject) {
      onFinishCurrCreate(
        drawData.creatingObject.label || editState.latestLabel || '',
      );
    }
  };

  const setBrushSize = (size: number) => {
    if (mode !== EditorMode.Edit) return;
    setDrawData((s) => {
      s.brushSize = size;
    });
  };

  const displayAIModeUnavailableModal = () => {
    Modal.info({
      centered: true,
      closable: true,
      title: localeText('smartAnnotation.infoModal.title'),
      content: localeText('smartAnnotation.infoModal.content'),
      okText: localeText('smartAnnotation.infoModal.action'),
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
      if (mode !== EditorMode.Edit) return;
      setDrawData((s) => {
        s.AIAnnotation = active;
      });
    },
    [mode],
  );

  return {
    onDeleteCurrObject,
    onFinishCurrCreate,
    onCloseAnnotationEditor,
    selectTool,
    selectSubTool,
    setBrushSize,
    activeAIAnnotation,
    displayAIModeUnavailableModal,
  };
};

export default useToolActions;
