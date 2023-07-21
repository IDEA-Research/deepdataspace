import React from 'react';
import { CursorState } from 'ahooks/lib/useMouse';
import {
  DrawData,
  EditState,
  IAnnotationObject,
  ICreatingObject,
} from '../type';
import { translateAnnotCoord } from '@/utils/compute';
import { EObjectType } from '@/constants';
import {
  addFilter,
  clearCanvas,
  drawImage,
  removeFilter,
  resizeSmoothCanvas,
  setCanvasGlobalAlpha,
} from '@/utils/draw';
import {
  ANNO_FILL_ALPHA,
  ANNO_FILL_COLOR,
  ANNO_MASK_ALPHA,
  ANNO_STROKE_ALPHA,
  ANNO_STROKE_COLOR,
} from '../constants/render';
import { ToolInstanceHookReturn } from '../tools/base';

interface IProps {
  visible: boolean;
  drawData: DrawData;
  editState: EditState;
  clientSize: ISize;
  labelColors: Record<string, string>;
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
  labelColors,
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

  const updateCreatingRender = (creatingObject: ICreatingObject) => {
    const color = labelColors[creatingObject.label] || '#fff';
    const strokeColor = ANNO_STROKE_COLOR.CREATING;
    const fillColor = ANNO_FILL_COLOR.CREATING;

    objectHooksMap[creatingObject.type].renderCreatingObject({
      object: creatingObject,
      color,
      strokeColor,
      fillColor,
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
    const color = labelColors[canvasCoordObject.label] || '#fff';
    const isFocus = editState.focusObjectIndex === drawData.activeObjectIndex;
    const [fillAlpha, strokeAlpha] = isFocus
      ? [ANNO_FILL_ALPHA.FOCUS, ANNO_STROKE_ALPHA.FOCUS]
      : [ANNO_FILL_ALPHA.CREATING, ANNO_STROKE_ALPHA.CREATING];

    objectHooksMap[creatingObject.type].renderEditingObject({
      object: canvasCoordObject,
      color,
      strokeAlpha,
      fillAlpha,
      isFocus,
    });
    return;
  };

  const updateCreatingPromptRender = (theDrawData: DrawData) => {
    const { prompt } = theDrawData;

    if (
      prompt.maskPrompts ||
      prompt.creatingMask ||
      prompt.activeRectWhileLoading
    ) {
      objectHooksMap[EObjectType.Mask].renderPrompt({
        prompt,
      });
    } else if (prompt.segmentationClicks) {
      objectHooksMap[EObjectType.Polygon].renderPrompt({
        prompt,
      });
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
    const { label, type } = canvasCoordObject;
    // Color styles
    const color = labelColors[label] || '#fff';
    const [fillAlpha, strokeAlpha, maskAlpha] = isFocus
      ? [ANNO_FILL_ALPHA.FOCUS, ANNO_STROKE_ALPHA.FOCUS, ANNO_MASK_ALPHA.FOCUS]
      : [
          ANNO_FILL_ALPHA.DEFAULT,
          ANNO_STROKE_ALPHA.DEFAULT,
          ANNO_MASK_ALPHA.DEFAULT,
        ];

    // Change globalAlpha when creating / editing object
    setCanvasGlobalAlpha(canvasRef.current!, drawData.creatingObject ? 0.3 : 1);

    objectHooksMap[type].renderObject({
      object: canvasCoordObject,
      color,
      strokeAlpha,
      fillAlpha,
      maskAlpha,
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
        index === editState.focusObjectIndex
      ) {
        return;
      }
      renderObject(obj, false);
    });
  };

  const updateRender = (updateDrawData?: DrawData) => {
    if (!visible || !canvasRef.current || !imgRef.current) return;

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
    if (editState.focusObjectIndex > -1) {
      renderObject(theDrawData.objectList[editState.focusObjectIndex], true);
    }
  };

  return {
    updateRender,
  };
};

export default useCanvasRender;
