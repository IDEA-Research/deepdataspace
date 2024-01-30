import { drawCircleWithFill } from '../utils/draw';

import { ToolInstanceHook, ToolHooksFunc } from './base';

const usePoint: ToolInstanceHook = ({ canvasRef }) => {
  const renderObject: ToolHooksFunc.RenderObject = ({ object, styles }) => {
    const { point } = object;
    if (point && point.visible) {
      const { x, y } = point;
      const { strokeColor, fillColor } = styles;
      drawCircleWithFill(
        canvasRef.current!,
        { x, y },
        4,
        fillColor,
        2,
        strokeColor,
      );
    }
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = () => {
    // todo
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = () => {
    // to do
  };

  const renderPrompt: ToolHooksFunc.RenderPrompt = () => {
    // nothing in rect
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

export default usePoint;
