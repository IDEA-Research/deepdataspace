import { ANNO_STROKE_ALPHA } from '../constants/render';
import { LineType } from '../type';
import { hexToRgba } from '../utils/color';
import { drawPolylineByType } from '../utils/draw';

import { ToolInstanceHook, ToolHooksFunc } from './base';

const usePolyline: ToolInstanceHook = ({ canvasRef }) => {
  const renderObject: ToolHooksFunc.RenderObject = ({
    object,
    color,
    isFocus,
  }) => {
    const { polyline } = object;
    if (polyline && polyline.visible && polyline.lineType) {
      const lineType: LineType = polyline.lineType as unknown as LineType;

      const baseColor = polyline.color || color;
      const strokeColor = isFocus
        ? hexToRgba(baseColor, ANNO_STROKE_ALPHA.FOCUS)
        : hexToRgba(baseColor, ANNO_STROKE_ALPHA.DEFAULT);

      polyline?.group.forEach((anchors) => {
        drawPolylineByType(canvasRef.current, anchors, strokeColor, lineType);
      });

      // todo render point & text
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

export default usePolyline;
