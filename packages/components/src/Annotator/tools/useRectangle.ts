import { drawRect, drawText, shadeEverythingButRect } from '../utils/draw';
import { EObjectType } from '../constants';
import { getRectFromPoints, translateRectCoord } from '../utils/compute';
import {
  ToolInstanceHook,
  ToolHooksFunc,
  renderActiveRect,
  editBaseElementWhenMouseDown,
  updateEditingRectWhenMouseMove,
} from './base';
import { EObjectStatus } from '../type';
import { hexToRgba } from '../utils/color';
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
  getAnnotColor,
  displayOptionsResult,
}) => {
  const renderObject: ToolHooksFunc.RenderObject = ({
    object,
    color,
    styles,
    isFocus,
  }) => {
    const { rect } = object;
    if (rect && rect.visible) {
      let strokeDash = styles.strokeDash;
      let strokeColor = styles.strokeColor;
      let fillColor = styles.fillColor;
      let thickness = styles.thickness;
      if (drawData.isBatchEditing) {
        if (
          object.status === EObjectStatus.Unchecked &&
          !editState.isCtrlPressed
        )
          return;
        if (editState.isCtrlPressed) {
          if (object.status !== EObjectStatus.Unchecked) {
            strokeColor = hexToRgba(color, 0.8);
            strokeDash = [2];
            thickness = 1.5;
          } else {
            fillColor = isFocus
              ? hexToRgba(color, ANNO_FILL_ALPHA.DEFAULT)
              : hexToRgba(color, ANNO_FILL_ALPHA.CTRL_TO_SELECT);
          }
        }
      }

      drawRect(
        canvasRef.current!,
        rect,
        strokeColor,
        thickness,
        strokeDash,
        fillColor,
      );

      // draw text
      if (displayOptionsResult?.showBoxText) {
        const label =
          object?.conf && object.conf > 0 && object.conf < 1
            ? `${object.label}(${object.conf.toFixed(3)})`
            : object.label;
        drawText(
          canvasRef.current!,
          label || '',
          13,
          { x: rect.x + 2, y: rect.y + 2 },
          color,
          false,
          'left',
        );
      }

      // draw ctrlpressed rect mask
      if (drawData.isBatchEditing && editState.isCtrlPressed && isFocus) {
        shadeEverythingButRect(activeCanvasRef.current!, rect, '#000', 0.6);
      }
    }
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = ({
    object,
    styles,
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
        styles.strokeColor,
        styles.thickness,
        styles.strokeDash,
        styles.fillColor,
      );
    }
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = ({
    object,
    styles,
  }) => {
    const { rect } = object;
    if (rect && rect.visible) {
      drawRect(
        activeCanvasRef.current!,
        rect,
        styles.strokeColor,
        styles.thickness,
        styles.strokeDash,
        styles.fillColor,
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
      color: getAnnotColor(object.label),
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
