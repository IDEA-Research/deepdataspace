import { clearCanvas, drawImage, drawRectWithFill } from '../utils/draw';
import { ToolInstanceHook, ToolHooksFunc } from './base';

const useMatting: ToolInstanceHook = ({
  imgRef,
  imagePos,
  canvasRef,
  clientSize,
  displayOptionsResult,
}) => {
  const displayMattingImg = (alphaImg: HTMLImageElement) => {
    if (!alphaImg || !canvasRef.current || !imgRef.current) return;
    const { showMattingColorFill } = displayOptionsResult || {};
    const ctx = canvasRef.current!.getContext('2d') as CanvasRenderingContext2D;
    const rect = {
      x: imagePos.current.x,
      y: imagePos.current.y,
      ...clientSize,
    };
    clearCanvas(canvasRef.current);
    drawImage(canvasRef.current, alphaImg, rect);
    if (showMattingColorFill) {
      // Background fill.
      ctx.globalCompositeOperation = 'source-out';
      drawRectWithFill(canvasRef.current, rect, '#000');
      // Core fill.
      ctx.globalCompositeOperation = 'destination-atop';
      drawRectWithFill(canvasRef.current, rect, '#fff');
    } else {
      // Original image fill.
      ctx.globalCompositeOperation = 'source-in';
      drawImage(canvasRef.current, imgRef.current, rect);
      // Background blank.
      ctx.globalCompositeOperation = 'destination-over';
      drawRectWithFill(canvasRef.current, rect, '#fff');
    }
  };

  const renderObject: ToolHooksFunc.RenderObject = ({ object }) => {
    const { alphaImageElement } = object;
    if (alphaImageElement) {
      displayMattingImg(alphaImageElement);
      alphaImageElement.onload = () => {
        displayMattingImg(alphaImageElement);
      };
    }
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = () => {
    // todo
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = () => {
    // todo
  };

  const renderPrompt: ToolHooksFunc.RenderPrompt = () => {
    // nothing in matting
  };

  const startEditingWhenMouseDown: ToolHooksFunc.StartEditingWhenMouseDown =
    () => {
      return false;
    };

  const startCreatingWhenMouseDown: ToolHooksFunc.StartCreatingWhenMouseDown =
    () => {
      return false;
    };

  const updateEditingWhenMouseMove: ToolHooksFunc.UpdateEditingWhenMouseMove =
    () => {
      return false;
    };

  const updateCreatingWhenMouseMove: ToolHooksFunc.UpdateCreatingWhenMouseMove =
    () => {
      return false;
    };

  const finishEditingWhenMouseUp: ToolHooksFunc.FinishEditingWhenMouseUp =
    () => {
      return false;
    };

  const finishCreatingWhenMouseUp: ToolHooksFunc.FinishCreatingWhenMouseUp =
    () => {
      return false;
    };

  return {
    renderObject,
    renderCreatingObject,
    renderEditingObject,
    renderPrompt,
    startEditingWhenMouseDown,
    startCreatingWhenMouseDown,
    updateEditingWhenMouseMove,
    updateCreatingWhenMouseMove,
    finishEditingWhenMouseUp,
    finishCreatingWhenMouseUp,
  };
};

export default useMatting;
