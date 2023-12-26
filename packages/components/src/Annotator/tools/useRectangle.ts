import {
  drawCircleWithFill,
  drawRect,
  drawText,
  shadeEverythingButRect,
} from '../utils/draw';
import { EnumModelType, EObjectType, ESubToolItem } from '../constants';
import {
  getRectFromPoints,
  translatePointCoord,
  translateRectCoord,
} from '../utils/compute';
import {
  ToolInstanceHook,
  ToolHooksFunc,
  renderActiveRect,
  editBaseElementWhenMouseDown,
  updateEditingRectWhenMouseMove,
} from './base';
import { EObjectStatus, EPromptType, PromptItem } from '../type';
import { hexToRgba } from '../utils/color';
import {
  ANNO_FILL_ALPHA,
  PROMPT_FILL_COLOR,
  PROMPT_STROKE_COLOR,
} from '../constants/render';

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
  categories,
  onAiAnnotation,
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
          (!editState.isCtrlPressed ||
            drawData.selectedModel === EnumModelType.IVP)
        )
          return;
        if (
          editState.isCtrlPressed &&
          drawData.selectedModel === EnumModelType.Detection
        ) {
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
        const labelName =
          categories.find((c) => c.id === object.labelId)?.name || '';
        const label =
          object?.conf && object.conf > 0 && object.conf < 1
            ? `${labelName}(${object.conf.toFixed(3)})`
            : labelName;
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

  const renderPrompt: ToolHooksFunc.RenderPrompt = ({ prompt }) => {
    // draw creating prompt
    if (prompt.creatingPrompt) {
      const strokeColor = prompt.creatingPrompt.isPositive
        ? PROMPT_STROKE_COLOR.POSITIVE
        : PROMPT_STROKE_COLOR.NEGATIVE;
      const fillColor = prompt.creatingPrompt.isPositive
        ? PROMPT_FILL_COLOR.POSITIVE
        : PROMPT_FILL_COLOR.NEGATIVE;

      switch (prompt.creatingPrompt.type) {
        case EPromptType.Rect: {
          const { startPoint } = prompt.creatingPrompt;
          const rect = getRectFromPoints(
            startPoint!,
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
            [0],
            fillColor,
          );
          break;
        }
        case EPromptType.Point: {
          if (!prompt.creatingPrompt.point) break;
          const canvasCoordPoint = translatePointCoord(
            prompt.creatingPrompt.point,
            {
              x: -imagePos.current.x,
              y: -imagePos.current.y,
            },
          );
          drawCircleWithFill(
            activeCanvasRef.current!,
            canvasCoordPoint,
            4,
            prompt.creatingPrompt.isPositive
              ? PROMPT_FILL_COLOR.POSITIVE
              : PROMPT_FILL_COLOR.NEGATIVE,
            2,
            '#fff',
          );
        }
        default:
          break;
      }
    }

    // draw existing prompts
    if (prompt.promptsQueue) {
      prompt.promptsQueue.forEach((item) => {
        switch (item.type) {
          case EPromptType.Rect: {
            const canvasCoordRect = translateRectCoord(item.rect!, {
              x: -imagePos.current.x,
              y: -imagePos.current.y,
            });
            drawRect(
              activeCanvasRef.current,
              canvasCoordRect,
              item.isPositive
                ? PROMPT_STROKE_COLOR.POSITIVE
                : PROMPT_STROKE_COLOR.NEGATIVE,
              2,
              [0],
              item.isPositive
                ? PROMPT_FILL_COLOR.POSITIVE
                : PROMPT_FILL_COLOR.NEGATIVE,
            );
            break;
          }
          case EPromptType.Point: {
            const canvasCoordPoint = translatePointCoord(item.point!, {
              x: -imagePos.current.x,
              y: -imagePos.current.y,
            });
            drawCircleWithFill(
              activeCanvasRef.current!,
              canvasCoordPoint,
              4,
              item.isPositive
                ? PROMPT_FILL_COLOR.POSITIVE
                : PROMPT_FILL_COLOR.NEGATIVE,
              2,
              '#fff',
            );
            break;
          }
        }
      });
    }
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
        if (s.AIAnnotation && s.selectedModel === EnumModelType.IVP) {
          s.prompt.creatingPrompt = {
            type: EPromptType.Rect,
            startPoint: point,
            point,
            isPositive: s.selectedSubTool !== ESubToolItem.NegativeVisualPrompt,
          };
        } else {
          s.activeObjectIndex = -1;
          s.creatingObject = {
            type: EObjectType.Rectangle,
            startPoint: point,
            ...basic,
          };
        }
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
    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    if (
      drawData.AIAnnotation &&
      drawData.selectedModel === EnumModelType.IVP &&
      drawData.prompt.creatingPrompt?.startPoint
    ) {
      const { startPoint } = drawData.prompt.creatingPrompt;
      if (mouse.x === startPoint.x || mouse.y === startPoint.y) {
        setDrawData((s) => {
          s.prompt.creatingPrompt = undefined;
        });
        return true;
        // TODO
        // if (!isInCanvas(contentMouse)) return false;
        // const promptItem: PromptItem = {
        //   type: EPromptType.Point,
        //   isPositive: drawData.prompt.creatingPrompt.isPositive,
        //   point: startPoint,
        // };
        // const promptsQueue = [
        //   ...(drawData.prompt.promptsQueue || []),
        //   promptItem,
        // ];
        // onAiAnnotation?.({
        //   type: EObjectType.Rectangle,
        //   drawData,
        //   promptsQueue,
        // });
        // return true;
      } else {
        const rect = getRectFromPoints(
          drawData.prompt.creatingPrompt.startPoint as IPoint,
          mouse,
          {
            width: contentMouse.elementW,
            height: contentMouse.elementH,
          },
        );
        const promptItem: PromptItem = {
          type: EPromptType.Rect,
          isPositive: drawData.prompt.creatingPrompt.isPositive,
          rect,
        };
        const promptsQueue = [
          ...(drawData.prompt.promptsQueue || []),
          promptItem,
        ];
        onAiAnnotation?.({
          type: EObjectType.Rectangle,
          drawData,
          promptsQueue,
        });
      }
      return true;
    }
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
      labelId: object.labelId,
      hidden: false,
      rect: { visible: true, ...newRect },
      conf: 1,
      status: EObjectStatus.Commited,
      color: getAnnotColor(object.labelId),
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
