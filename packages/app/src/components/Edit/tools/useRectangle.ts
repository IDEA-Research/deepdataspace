import { drawRect } from '@/utils/draw';
import { EObjectType, LABELS_STROKE_DASH } from '@/constants';
import { getRectFromPoints, translateRectCoord } from '@/utils/compute';
import {
  ToolInstanceHook,
  ToolHooksFunc,
  renderRect,
  renderActiveRect,
  editBaseElementWhenMouseDown,
} from './base';

const useRectangle: ToolInstanceHook = ({
  contentMouse,
  imagePos,
  canvasRef,
  activeCanvasRef,
  setEditState,
  setDrawData,
}) => {
  const renderObject: ToolHooksFunc.RenderObject = ({
    object,
    color,
    strokeAlpha,
    fillAlpha,
  }) => {
    const { rect } = object;
    if (rect && rect.visible) {
      renderRect(canvasRef.current!, rect, color, strokeAlpha, fillAlpha);
    }
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = ({
    object,
    strokeColor,
    fillColor,
  }) => {
    const { startPoint } = object;
    if (startPoint) {
      // creating
      const rect = getRectFromPoints(
        startPoint,
        {
          x: contentMouse.elementX,
          y: contentMouse.elementY,
        },
        {
          width: contentMouse.elementW,
          height: contentMouse.elementH,
        },
      );
      const canvasCoordRect = translateRectCoord(rect, {
        x: -imagePos.current.x,
        y: -imagePos.current.y,
      });
      drawRect(
        activeCanvasRef.current,
        canvasCoordRect,
        strokeColor,
        2,
        LABELS_STROKE_DASH[0],
        fillColor,
      );
    }
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = ({
    object,
    color,
    strokeAlpha,
    fillAlpha,
  }) => {
    const { rect } = object;
    if (rect && rect.visible) {
      renderRect(activeCanvasRef.current!, rect, color, strokeAlpha, fillAlpha);
      renderActiveRect(activeCanvasRef.current!, rect);
    }
  };

  const renderPrompt: ToolHooksFunc.RenderPrompt = () => {
    // nothing in rect
  };

  const startCreatingWhenMouseDown: ToolHooksFunc.StartCreatingWhenMouseDown =
    ({ point, basic }) => {
      setDrawData((s) => {
        s.activeObjectIndex = -1;
        s.creatingObject = {
          type: EObjectType.Rectangle,
          startPoint: point,
          ...basic,
        };
      });
      return true;
    };

  const startEditingWhenMouseDown: ToolHooksFunc.StartEditingWhenMouseDown = ({
    object,
  }) => {
    if (
      editBaseElementWhenMouseDown({
        object,
        contentMouse,
        setEditState,
        setDrawData,
      })
    ) {
      return true;
    }
    return false;
  };

  return {
    renderObject,
    renderCreatingObject,
    renderEditingObject,
    renderPrompt,
    startCreatingWhenMouseDown,
    startEditingWhenMouseDown,
  };
};

export default useRectangle;
