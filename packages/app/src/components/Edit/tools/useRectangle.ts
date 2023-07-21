import { drawRect, shadeEverythingButRect } from '@/utils/draw';
import { EObjectType, LABELS_STROKE_DASH } from '@/constants';
import { getRectFromPoints, translateRectCoord } from '@/utils/compute';
import {
  ToolInstanceHook,
  ToolHooksFunc,
  renderActiveRect,
  editBaseElementWhenMouseDown,
  updateEditingRectWhenMouseMove,
} from './base';
import { EObjectStatus } from '../type';
import { hexToRgba } from '@/utils/color';
import { ANNO_FILL_ALPHA } from '../constants/render';

const useRectangle: ToolInstanceHook = ({
  contentMouse,
  imagePos,
  canvasRef,
  activeCanvasRef,
  editState,
  setEditState,
  drawData,
  setDrawData,
  updateMouseCursor,
  updateObject,
  addObject,
}) => {
  const renderObject: ToolHooksFunc.RenderObject = ({
    object,
    color,
    strokeAlpha,
    fillAlpha,
    isFocus,
  }) => {
    const { rect } = object;
    if (rect && rect.visible) {
      let lineDash = LABELS_STROKE_DASH[0];
      let fill = fillAlpha;
      if (drawData.isBatchEditing) {
        if (
          object.status === EObjectStatus.Unchecked &&
          !editState.isCtrlPressed
        )
          return;
        if (editState.isCtrlPressed) {
          if (object.status !== EObjectStatus.Unchecked) {
            lineDash = LABELS_STROKE_DASH[1];
          } else {
            fill = isFocus
              ? ANNO_FILL_ALPHA.DEFAULT
              : ANNO_FILL_ALPHA.CTRL_TO_SELECT;
          }
        }
      }
      drawRect(
        canvasRef.current!,
        rect,
        hexToRgba(color, strokeAlpha),
        2,
        lineDash,
        hexToRgba(color, fill),
      );

      // draw ctrlpressed rect mask
      if (drawData.isBatchEditing && editState.isCtrlPressed && isFocus) {
        shadeEverythingButRect(activeCanvasRef.current!, rect, '#000', 0.6);
      }
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
      drawRect(
        activeCanvasRef.current!,
        rect,
        hexToRgba(color, strokeAlpha),
        2,
        LABELS_STROKE_DASH[0],
        hexToRgba(color, fillAlpha),
      );
      renderActiveRect(activeCanvasRef.current!, rect);
    }
  };

  const renderPrompt: ToolHooksFunc.RenderPrompt = () => {
    // nothing in rect
  };

  const startEditingWhenMouseDown: ToolHooksFunc.StartEditingWhenMouseDown = ({
    object,
    event,
  }) => {
    if (event?.button === 2) return false;
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

  const updateEditingWhenMouseMove: ToolHooksFunc.UpdateEditingWhenMouseMove =
    ({ object }) => {
      return updateEditingRectWhenMouseMove({
        object,
        editState,
        contentMouse,
        drawData,
        setDrawData,
        updateMouseCursor,
      });
    };

  const updateCreatingWhenMouseMove: ToolHooksFunc.UpdateCreatingWhenMouseMove =
    ({ object }) => {
      return !!object;
    };

  const finishEditingWhenMouseUp: ToolHooksFunc.FinishEditingWhenMouseUp = ({
    object,
  }) => {
    const isResizingOrMoving =
      editState.startRectResizeAnchor || editState.startElementMovePoint;
    if (isResizingOrMoving) {
      updateObject(object, drawData.activeObjectIndex);
    }
    setEditState((s) => {
      s.startRectResizeAnchor = undefined;
      s.startElementMovePoint = undefined;
    });
    return true;
  };

  const finishCreatingWhenMouseUp: ToolHooksFunc.FinishCreatingWhenMouseUp = ({
    object,
  }) => {
    if (!object || !object.startPoint) return false;
    // Need to check if it can form a rectangle
    if (
      contentMouse.elementX === object.startPoint.x ||
      contentMouse.elementY === object.startPoint.y
    ) {
      setDrawData((s) => {
        s.creatingObject = undefined;
      });
      return true;
    }
    const newRect = getRectFromPoints(
      object.startPoint,
      { x: contentMouse.elementX, y: contentMouse.elementY },
      {
        width: contentMouse.elementW,
        height: contentMouse.elementH,
      },
    );
    const newObject = {
      type: EObjectType.Rectangle,
      label: object.label,
      hidden: false,
      rect: { visible: true, ...newRect },
      conf: 1,
      status: EObjectStatus.Commited,
    };
    addObject(newObject);
    return true;
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

export default useRectangle;
