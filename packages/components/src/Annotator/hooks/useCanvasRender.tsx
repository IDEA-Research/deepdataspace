import React from 'react';
import { CursorState } from 'ahooks/lib/useMouse';
import {
  DrawData,
  EditState,
  IAnnotationObject,
  ICreatingObject,
} from '../type';
import { translateAnnotCoord } from '../utils/compute';
import {
  EBasicToolItem,
  EElementType,
  EnumModelType,
  EObjectType,
} from '../constants';
import {
  addFilter,
  clearCanvas,
  drawImage,
  removeFilter,
  resizeSmoothCanvas,
  setCanvasGlobalAlpha,
} from '../utils/draw';
import {
  ANNO_FILL_ALPHA,
  ANNO_FILL_COLOR,
  ANNO_MASK_ALPHA,
  ANNO_STROKE_ALPHA,
  ANNO_STROKE_COLOR,
} from '../constants/render';
import { ToolInstanceHookReturn } from '../tools/base';
import { hexToRgba } from '../utils/color';
import PopoverMenu from '../components/PopoverMenu';

interface IProps {
  visible: boolean;
  drawData: DrawData;
  editState: EditState;
  clientSize: ISize;
  imagePos: React.MutableRefObject<IPoint>;
  containerMouse: CursorState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeCanvasRef: React.RefObject<HTMLCanvasElement>;
  imgRef: React.RefObject<HTMLImageElement>;
  objectHooksMap: Record<EObjectType, ToolInstanceHookReturn>;
}

const useCanvasRender = ({
  visible,
  drawData,
  editState,
  clientSize,
  imagePos,
  containerMouse,
  canvasRef,
  activeCanvasRef,
  imgRef,
  objectHooksMap,
}: IProps) => {
  // =================================================================================================================
  // Render
  // =================================================================================================================

  const getObjectStyles = (
    object: IAnnotationObject,
    color: string,
    status?: 'focus' | 'creating' | 'editing',
  ) => {
    let [strokeColor, fillColor, maskAlpha] = [
      hexToRgba(color, ANNO_STROKE_ALPHA.DEFAULT),
      hexToRgba(color, ANNO_FILL_ALPHA.DEFAULT),
      ANNO_MASK_ALPHA.DEFAULT,
    ];
    if (status === 'focus') {
      maskAlpha = ANNO_MASK_ALPHA.FOCUS;
      strokeColor = hexToRgba(color, ANNO_STROKE_ALPHA.FOCUS);
      fillColor = hexToRgba(color, ANNO_FILL_ALPHA.FOCUS);
    } else if (status === 'editing') {
      maskAlpha = ANNO_MASK_ALPHA.CREATING;
      strokeColor = hexToRgba(color, ANNO_STROKE_ALPHA.CREATING);
      fillColor = hexToRgba(color, ANNO_FILL_ALPHA.CREATING);
    } else if (status === 'creating') {
      maskAlpha = ANNO_MASK_ALPHA.CREATING;
      strokeColor = ANNO_STROKE_COLOR.CREATING;
      fillColor = ANNO_FILL_COLOR.CREATING;
    }

    return {
      strokeColor,
      fillColor,
      maskAlpha,
      strokeDash: [0],
      thickness: 2,
      pointAplha: 1,
      ...(object.customStyles || {}),
    };
  };

  const updateCreatingRender = (creatingObject: ICreatingObject) => {
    const styles = getObjectStyles(
      creatingObject,
      creatingObject.color,
      'creating',
    );

    objectHooksMap[creatingObject.type].renderCreatingObject({
      object: creatingObject,
      color: creatingObject.color,
      styles,
    });
    return;
  };

  const updateEditingRender = (creatingObject: ICreatingObject) => {
    // draw currently annotated objects
    if (creatingObject.hidden) return;

    const canvasCoordObject = translateAnnotCoord(creatingObject, {
      x: -imagePos.current.x,
      y: -imagePos.current.y,
    });
    const isFocus = editState.focusObjectIndex === drawData.activeObjectIndex;
    const styles = getObjectStyles(
      creatingObject,
      creatingObject.color,
      isFocus ? 'focus' : 'editing',
    );

    objectHooksMap[creatingObject.type].renderEditingObject({
      object: canvasCoordObject,
      color: creatingObject.color,
      styles,
      isFocus,
    });
    return;
  };

  const updateCreatingPromptRender = (theDrawData: DrawData) => {
    const { prompt } = theDrawData;

    if (
      prompt.creatingPrompt ||
      prompt.promptsQueue ||
      prompt.activeRectWhileLoading
    ) {
      if (
        theDrawData.selectedTool === EBasicToolItem.Mask ||
        theDrawData.creatingObject?.type === EObjectType.Mask
      ) {
        objectHooksMap[EObjectType.Mask].renderPrompt({
          prompt,
        });
      } else if (
        theDrawData.selectedTool === EBasicToolItem.Polygon ||
        theDrawData.creatingObject?.type === EObjectType.Polygon
      ) {
        objectHooksMap[EObjectType.Polygon].renderPrompt({
          prompt,
        });
      } else if (
        theDrawData.selectedTool === EBasicToolItem.Rectangle &&
        theDrawData.selectedModel === EnumModelType.IVP
      ) {
        objectHooksMap[EObjectType.Rectangle].renderPrompt({
          prompt,
        });
      }
    }
    return;
  };

  const updateRenderActiveCanvas = (updateDrawData?: DrawData) => {
    if (!visible || !activeCanvasRef.current) return;

    resizeSmoothCanvas(activeCanvasRef.current, {
      width: containerMouse.elementW,
      height: containerMouse.elementH,
    });
    activeCanvasRef.current.getContext('2d')!.imageSmoothingEnabled = false;
    clearCanvas(activeCanvasRef.current);

    const theDrawData = updateDrawData || drawData;
    if (theDrawData.creatingObject) {
      if (theDrawData.activeObjectIndex > -1) {
        updateEditingRender(theDrawData.creatingObject);
      } else {
        updateCreatingRender(theDrawData.creatingObject);
      }
    }

    updateCreatingPromptRender(theDrawData);
  };

  const renderObject = (object: IAnnotationObject, isFocus: boolean) => {
    const canvasCoordObject = translateAnnotCoord(object, {
      x: -imagePos.current.x,
      y: -imagePos.current.y,
    });
    const { type } = canvasCoordObject;
    // Color styles
    const styles = getObjectStyles(
      object,
      object.color,
      isFocus ? 'focus' : undefined,
    );

    // Change globalAlpha when creating / editing object
    setCanvasGlobalAlpha(canvasRef.current!, drawData.creatingObject ? 0.6 : 1);

    objectHooksMap[type].renderObject({
      object: canvasCoordObject,
      color: object.color,
      styles,
      isFocus,
    });
  };

  const renderObjectList = (
    list: IAnnotationObject[],
    activeObjectIndex: number,
  ) => {
    // render normal objects
    list.forEach((obj, index) => {
      if (
        obj.hidden ||
        index === activeObjectIndex ||
        index === editState.focusObjectIndex ||
        obj.frameEmpty
      ) {
        return;
      }
      renderObject(obj, drawData.editingAttribute?.index === index);
    });
  };

  const updateRender = (updateDrawData?: DrawData) => {
    if (
      !visible ||
      !canvasRef.current ||
      !imgRef.current ||
      !imgRef.current.complete
    )
      return;

    resizeSmoothCanvas(canvasRef.current, {
      width: containerMouse.elementW,
      height: containerMouse.elementH,
    });
    canvasRef.current.getContext('2d')!.imageSmoothingEnabled = false;
    clearCanvas(canvasRef.current);

    // add filter before drawImage and apply for image only
    addFilter(
      canvasRef.current,
      editState.imageDisplayOptions.brightness,
      editState.imageDisplayOptions.contrast,
      editState.imageDisplayOptions.saturate,
    );

    drawImage(canvasRef.current, imgRef.current, {
      x: imagePos.current.x,
      y: imagePos.current.y,
      width: clientSize.width,
      height: clientSize.height,
    });

    // remove filter just in case it may be applied on all canvas
    removeFilter(canvasRef.current);

    const theDrawData = updateDrawData || drawData;

    // draw esisting objects
    renderObjectList(theDrawData.objectList, theDrawData.activeObjectIndex);

    // draw creating object
    updateRenderActiveCanvas(theDrawData);

    // render focus object
    if (
      editState.focusObjectIndex > -1 &&
      editState.focusObjectIndex !== drawData.activeObjectIndex &&
      theDrawData.objectList[editState.focusObjectIndex] &&
      !theDrawData.objectList[editState.focusObjectIndex].hidden &&
      !theDrawData.objectList[editState.focusObjectIndex].frameEmpty
    ) {
      renderObject(theDrawData.objectList[editState.focusObjectIndex], true);
    }
  };

  const renderPopoverMenu = () => {
    if (
      editState.focusObjectIndex > -1 &&
      drawData.objectList[editState.focusObjectIndex] &&
      !drawData.objectList[editState.focusObjectIndex].hidden &&
      editState.focusEleIndex > -1 &&
      editState.focusEleType === EElementType.Circle
    ) {
      const target =
        drawData.objectList[editState.focusObjectIndex].keypoints?.points?.[
          editState.focusEleIndex
        ];
      if (target) {
        return (
          <PopoverMenu
            index={editState.focusEleIndex}
            targetElement={target!}
            imagePos={imagePos.current}
          />
        );
      }
    }
    return <></>;
  };

  return {
    updateRender,
    renderPopoverMenu,
  };
};

export default useCanvasRender;
