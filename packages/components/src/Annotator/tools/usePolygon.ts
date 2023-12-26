import {
  drawCircleWithFill,
  drawLine,
  drawPolygonWithFill,
  drawQuadraticPath,
  drawRect,
  shadeEverythingButRect,
} from '../utils/draw';
import { EElementType, EObjectType, ESubToolItem } from '../constants';
import {
  getClosestPointOnLineSegment,
  getLinesFromPolygon,
  getRectFromPoints,
  isInCanvas,
  isPointOnPoint,
  movePoint,
  movePolygon,
  translateAnnotCoord,
  translatePointCoord,
  translatePolygonCoord,
  translateRectCoord,
} from '../utils/compute';
import {
  ToolInstanceHook,
  ToolHooksFunc,
  editBaseElementWhenMouseDown,
  getPromptBoolean,
} from './base';
import { hexToRgba } from '../utils/color';
import {
  ANNO_FILL_ALPHA,
  ANNO_FILL_COLOR,
  ANNO_STROKE_ALPHA,
  ANNO_STROKE_COLOR,
  PROMPT_FILL_COLOR,
} from '../constants/render';
import { cloneDeep } from 'lodash';
import { EPromptType, PromptItem } from '../type';

const usePolygon: ToolInstanceHook = ({
  editState,
  clientSize,
  naturalSize,
  imagePos,
  containerMouse,
  canvasRef,
  activeCanvasRef,
  contentMouse,
  setEditState,
  drawData,
  setDrawData,
  setDrawDataWithHistory,
  updateHistory,
  updateMouseCursor,
  updateObject,
  addObject,
  onAiAnnotation,
  displayOptionsResult,
}) => {
  const renderObject: ToolHooksFunc.RenderObject = ({
    object,
    color,
    styles,
    isFocus,
  }) => {
    const { polygon } = object;
    if (polygon && polygon.visible) {
      let fiilColor = !isFocus
        ? hexToRgba(color, ANNO_FILL_ALPHA.SHAPE)
        : styles.fillColor;
      let thickness = styles.thickness;
      if (displayOptionsResult) {
        if (!displayOptionsResult.showSegFilling && !isFocus) {
          fiilColor = 'transparent';
        }
        if (!displayOptionsResult.showSegContour) {
          thickness = 0;
        }
      }

      polygon?.group.forEach((polygon) => {
        drawPolygonWithFill(
          canvasRef.current,
          polygon,
          fiilColor,
          styles.strokeColor,
          thickness,
          styles.strokeDash,
        );
      });
    }
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = ({
    object,
    styles,
  }) => {
    // draw unfinished points and lines
    const { currIndex } = object;
    const annotObject = translateAnnotCoord(object, {
      x: -imagePos.current.x,
      y: -imagePos.current.y,
    });
    const { polygon } = annotObject;
    if (polygon && polygon.visible) {
      // draw creating polygon
      polygon.group.forEach((polygon, polygonIdx) => {
        if (currIndex === polygonIdx) {
          polygon.forEach((point, pointIdx) => {
            // draw points
            drawCircleWithFill(
              activeCanvasRef.current!,
              point,
              pointIdx === 0 ? 6 : 4,
              styles.strokeColor,
              3,
              '#1f4dd8',
            );
            // draw lines
            if (polygon.length > 1 && pointIdx < polygon.length - 1) {
              drawLine(
                activeCanvasRef.current!,
                polygon[pointIdx],
                polygon[pointIdx + 1],
                hexToRgba(styles.strokeColor, ANNO_STROKE_ALPHA.CREATING),
                2.5,
                [0],
              );
            } else if (pointIdx === polygon.length - 1) {
              drawLine(
                activeCanvasRef.current!,
                polygon[pointIdx],
                {
                  x: containerMouse.elementX,
                  y: containerMouse.elementY,
                },
                hexToRgba(styles.strokeColor, ANNO_STROKE_ALPHA.CREATING_LINE),
                2.5,
                [5],
              );
            }
          });
        } else {
          // draw polygon
          drawPolygonWithFill(
            activeCanvasRef.current,
            polygon,
            hexToRgba('#1f4dd8', 0.5),
            '#1f4dd8',
            2,
            [0],
          );

          // draw points
          polygon.forEach((point) => {
            drawCircleWithFill(
              activeCanvasRef.current!,
              point,
              4,
              styles.strokeColor,
              3,
              '#1f4dd8',
            );
          });
        }
      });
    }
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = ({
    object,
    color,
    styles,
    isFocus,
  }) => {
    const { polygon } = object;
    if (polygon && polygon.visible) {
      const isFocusOnPolygon =
        isFocus &&
        editState.focusEleType === EElementType.Polygon &&
        editState.focusEleIndex === 0;

      polygon.group.forEach((polygon) => {
        const fillColor = isFocusOnPolygon
          ? hexToRgba(color, 0.2)
          : 'transparent';
        drawPolygonWithFill(
          activeCanvasRef.current,
          polygon,
          fillColor,
          styles.strokeColor,
          styles.thickness,
          styles.strokeDash,
        );
      });

      // draw points when actived
      polygon.group.forEach((points) => {
        points.forEach((point) => {
          drawCircleWithFill(
            activeCanvasRef.current!,
            point,
            4,
            color,
            2,
            '#fff',
          );
        });
      });

      // drawHighlight point when foucs
      const { index, pointIndex, lineIndex } = editState.focusPolygonInfo;
      if (index > -1 && pointIndex > -1) {
        const focusPoint = polygon.group[index][pointIndex];
        if (focusPoint) {
          drawCircleWithFill(
            activeCanvasRef.current!,
            focusPoint,
            4,
            '#fff',
            5,
            color,
          );
        }
      } else if (index > -1 && lineIndex > -1) {
        const lines = getLinesFromPolygon(polygon.group[index]);
        if (lines[lineIndex]) {
          const { start, end } = lines[lineIndex];
          const midPoint = getClosestPointOnLineSegment(
            {
              x: contentMouse.elementX + imagePos.current.x,
              y: contentMouse.elementY + imagePos.current.y,
            },
            start,
            end,
          );
          if (midPoint) {
            drawCircleWithFill(
              activeCanvasRef.current!,
              midPoint,
              4,
              '#fff',
              5,
              color,
            );
          }
        }
      }
    }
  };

  const renderPrompt: ToolHooksFunc.RenderPrompt = ({ prompt }) => {
    // draw creating prompt
    if (prompt.creatingPrompt) {
      const strokeColor = ANNO_STROKE_COLOR.CREATING;
      const fillColor = ANNO_FILL_COLOR.CREATING;
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
        case EPromptType.Stroke: {
          if (!prompt.creatingPrompt.stroke || !prompt.creatingPrompt.radius)
            break;
          const canvasCoordStroke = translatePolygonCoord(
            prompt.creatingPrompt.stroke,
            {
              x: -imagePos.current.x,
              y: -imagePos.current.y,
            },
          );
          const radius =
            (prompt.creatingPrompt.radius * clientSize.width) /
            naturalSize.width;
          const color = prompt.creatingPrompt.isPositive
            ? PROMPT_FILL_COLOR.POSITIVE
            : PROMPT_FILL_COLOR.NEGATIVE;
          drawQuadraticPath(
            activeCanvasRef.current!,
            canvasCoordStroke,
            color,
            radius,
          );
          break;
        }
        default:
          break;
      }

      // draw active area while loading ai annotations
      if (editState.isRequiring && prompt.activeRectWhileLoading) {
        const canvasCoordRect = translateRectCoord(
          prompt.activeRectWhileLoading,
          {
            x: -imagePos.current.x,
            y: -imagePos.current.y,
          },
        );
        shadeEverythingButRect(activeCanvasRef.current!, canvasCoordRect);
      }
    }

    // draw existing prompts
    if (prompt.promptsQueue) {
      prompt.promptsQueue.forEach((item) => {
        if (item.type === EPromptType.Point) {
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
        }
      });
    }
  };

  const updateAiPolygonWhenMouseDown = (event: MouseEvent) => {
    const point = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    setDrawData((s) => {
      switch (s.selectedSubTool) {
        case ESubToolItem.AutoSegmentByBox:
          s.prompt.creatingPrompt = {
            type: EPromptType.Rect,
            startPoint: point,
            isPositive: true,
          };
          break;
        case ESubToolItem.AutoSegmentByClick:
          s.prompt.creatingPrompt = {
            type: EPromptType.Point,
            startPoint: point,
            point: point,
            isPositive: getPromptBoolean(event),
          };
          break;
        case ESubToolItem.AutoSegmentByStroke: {
          s.prompt.creatingPrompt = {
            type: EPromptType.Stroke,
            startPoint: point,
            stroke: [point],
            radius: s.brushSize,
            isPositive: getPromptBoolean(event),
          };
          break;
        }
        default: {
        }
      }
    });
  };

  const startEditingWhenMouseDown: ToolHooksFunc.StartEditingWhenMouseDown = ({
    object,
    event,
  }) => {
    if (drawData.AIAnnotation) {
      updateAiPolygonWhenMouseDown(event);
      return true;
    }
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
    ({ event, point, basic }) => {
      setDrawData((s) => {
        if (!s.creatingObject || s.activeObjectIndex > -1) {
          s.activeObjectIndex = -1;
          if (s.AIAnnotation) {
            switch (s.selectedSubTool) {
              case ESubToolItem.AutoSegmentByBox:
                s.prompt.creatingPrompt = {
                  type: EPromptType.Rect,
                  startPoint: point,
                  isPositive: true,
                };
                break;
              case ESubToolItem.AutoSegmentByClick:
                s.prompt.creatingPrompt = {
                  type: EPromptType.Point,
                  startPoint: point,
                  point: point,
                  isPositive: getPromptBoolean(event),
                };
                break;
              case ESubToolItem.AutoSegmentByStroke: {
                s.prompt.creatingPrompt = {
                  type: EPromptType.Stroke,
                  startPoint: point,
                  stroke: [point],
                  radius: s.brushSize,
                  isPositive: getPromptBoolean(event),
                };
                break;
              }
            }
          } else {
            // create a new polygon manually
            s.creatingObject = {
              type: EObjectType.Polygon,
              polygon: {
                visible: true,
                group: [[point]],
              },
              currIndex: 0,
              ...basic,
            };
            updateHistory(cloneDeep(drawData));
          }
        } else {
          if (!s.AIAnnotation) {
            const currIndex = s.creatingObject.currIndex as number;
            const polygon = s.creatingObject.polygon as IElement<IPolygonGroup>;
            if (currIndex > -1) {
              const startPoint = polygon.group[currIndex][0];
              // finish creating polygon when click on startpoint
              if (isPointOnPoint(startPoint, contentMouse)) {
                s.creatingObject.currIndex = -1;
              } else if (s.creatingObject.polygon) {
                polygon.group[currIndex].push(point);
                updateHistory(cloneDeep(s));
              }
            } else {
              polygon.group.push([point]);
              s.creatingObject.currIndex = polygon.group.length - 1;
              updateHistory(cloneDeep(s));
            }
          } else {
            updateAiPolygonWhenMouseDown(event);
          }
        }
      });
      return true;
    };

  const updatePolygonWhenMouseMove: ToolHooksFunc.UpdateCreatingWhenMouseMove =
    ({ event }) => {
      const allowRecordMousePath =
        drawData.selectedSubTool === ESubToolItem.AutoSegmentByStroke;
      // Left/Right button is pressed while mousemove
      const isMousePress = event.buttons === 1 || event.buttons === 2;
      if (
        drawData.prompt.creatingPrompt &&
        allowRecordMousePath &&
        isMousePress
      ) {
        const mouse = {
          x: contentMouse.elementX,
          y: contentMouse.elementY,
        };
        setDrawData((s) => {
          s.prompt.creatingPrompt?.stroke?.push(mouse);
        });
        return true;
      }
      return false;
    };

  const updateEditingWhenMouseMove: ToolHooksFunc.UpdateEditingWhenMouseMove =
    ({ event }) => {
      if (drawData.AIAnnotation) {
        updateMouseCursor('crosshair');
        return updatePolygonWhenMouseMove({ event });
      }
      const {
        focusEleType,
        focusEleIndex,
        focusObjectIndex,
        focusPolygonInfo,
      } = editState;
      if (
        focusObjectIndex === drawData.activeObjectIndex &&
        focusEleType === EElementType.Polygon
      ) {
        if (focusPolygonInfo.pointIndex > -1) {
          updateMouseCursor('pointer');
        } else if (focusPolygonInfo.lineIndex > -1) {
          updateMouseCursor('crosshair');
        } else {
          updateMouseCursor('move');
        }
      }
      if (focusEleType === EElementType.Polygon && focusEleIndex === 0) {
        const { index, pointIndex } = editState.focusPolygonInfo;
        if (editState.startElementMovePoint && index > -1) {
          if (pointIndex > -1) {
            // move single point
            setDrawData((s) => {
              if (
                s.activeObjectIndex > -1 &&
                editState.focusEleIndex > -1 &&
                editState.startElementMovePoint &&
                s.creatingObject?.polygon?.group[index]
              ) {
                const polygon = s.creatingObject?.polygon?.group[index];
                polygon[pointIndex] = movePoint(contentMouse);
              }
            });
            return true;
          } else {
            // move polygon
            setDrawData((s) => {
              if (
                s.activeObjectIndex > -1 &&
                editState.focusEleIndex > -1 &&
                editState.startElementMovePoint &&
                s.creatingObject?.polygon?.group[index]
              ) {
                const polygon = s.creatingObject?.polygon?.group[index];
                const newPolygon = movePolygon(
                  polygon,
                  editState.startElementMovePoint,
                  contentMouse,
                );
                s.creatingObject.polygon.group[index] = newPolygon;
                // TODO: fix move offset
                // console.log(
                //   '>>> move polygon',
                //   editState.startElementMovePoint.mousePoint,
                //   'to', {
                //     x: contentMouse.elementX,
                //     y: contentMouse.elementY,
                //   }
                // );
                setEditState((s) => {
                  if (s.startElementMovePoint)
                    s.startElementMovePoint.mousePoint = {
                      x: contentMouse.elementX,
                      y: contentMouse.elementY,
                    };
                });
              }
            });
            return true;
          }
        }
      }
      return false;
    };

  const updateCreatingWhenMouseMove: ToolHooksFunc.UpdateCreatingWhenMouseMove =
    ({ event }) => {
      return updatePolygonWhenMouseMove({ event });
    };

  const getExistPolygonPrompts = (): PromptItem[] => {
    if (
      drawData.prompt.promptsQueue &&
      drawData.prompt.promptsQueue.length > 0
    ) {
      return drawData.prompt.promptsQueue;
    } else {
      // add exsit polygon as prompt item while editing instance by ai
      const addExistPolygon =
        !drawData.prompt.sessionId && drawData.creatingObject;

      if (addExistPolygon) {
        const existPolygons =
          drawData.creatingObject?.polygon?.group.map((polygon) => {
            return polygon.reduce((acc: number[], point) => {
              return acc.concat([point.x, point.y]);
            }, []);
          }) || [];

        const modifyPromptItem: PromptItem = {
          type: EPromptType.Modify,
          isPositive: true,
          polygons: existPolygons,
        };

        return [modifyPromptItem];
      } else {
        return [];
      }
    }
  };

  const finishAiPolygonWhenMouseUp = () => {
    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    const existPrompts = getExistPolygonPrompts();
    switch (drawData.selectedSubTool) {
      case ESubToolItem.AutoSegmentByBox: {
        if (!drawData.prompt.creatingPrompt?.startPoint) break;
        if (
          mouse.x === drawData.prompt.creatingPrompt.startPoint?.x ||
          mouse.y === drawData.prompt.creatingPrompt.startPoint?.y
        ) {
          setDrawData((s) => (s.prompt.creatingPrompt = undefined));
          break;
        }
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
          isPositive: true,
          rect,
        };
        setDrawDataWithHistory((s) => {
          s.prompt.activeRectWhileLoading = rect;
        });
        const promptsQueue = [...existPrompts, promptItem];
        onAiAnnotation?.({
          type: EObjectType.Polygon,
          drawData,
          promptsQueue,
        });
        break;
      }
      case ESubToolItem.AutoSegmentByClick: {
        if (
          !isInCanvas(contentMouse) ||
          !isInCanvas(containerMouse) ||
          !drawData.prompt.creatingPrompt?.point
        )
          break;
        const promptItem: PromptItem = {
          type: EPromptType.Point,
          isPositive: drawData.prompt.creatingPrompt.isPositive,
          point: drawData.prompt.creatingPrompt.point,
        };
        const promptsQueue = [...existPrompts, promptItem];
        onAiAnnotation?.({
          type: EObjectType.Polygon,
          drawData,
          promptsQueue,
        });
        break;
      }
      case ESubToolItem.AutoSegmentByStroke: {
        if (!drawData.prompt.creatingPrompt?.stroke) break;
        const promptItem: PromptItem = {
          type: EPromptType.Stroke,
          isPositive: drawData.prompt.creatingPrompt.isPositive,
          stroke: drawData.prompt.creatingPrompt.stroke,
          radius: drawData.brushSize,
        };
        const promptsQueue = [...existPrompts, promptItem];
        onAiAnnotation?.({
          type: EObjectType.Polygon,
          drawData,
          promptsQueue,
        });
        break;
      }
    }
  };

  const finishEditingWhenMouseUp: ToolHooksFunc.FinishEditingWhenMouseUp = ({
    object,
  }) => {
    if (drawData.AIAnnotation) {
      finishAiPolygonWhenMouseUp();
    } else {
      const isResizingOrMoving =
        editState.startRectResizeAnchor || editState.startElementMovePoint;

      const isMouseStand =
        editState.startElementMovePoint &&
        editState.startElementMovePoint.initPoint?.x ===
          contentMouse.elementX &&
        editState.startElementMovePoint.initPoint?.y === contentMouse.elementY;

      const isRemovePolygonPoints =
        isMouseStand &&
        editState.focusPolygonInfo.index > -1 &&
        editState.focusPolygonInfo.pointIndex > -1;

      if (isRemovePolygonPoints) {
        const copyObject = cloneDeep(object);
        const { index, pointIndex } = editState.focusPolygonInfo;
        const polygon = copyObject.polygon?.group[index];
        if (polygon && index > -1 && pointIndex > -1 && polygon.length >= 3) {
          polygon.splice(pointIndex, 1);
        }
        updateObject(copyObject, drawData.activeObjectIndex);
      } else if (isResizingOrMoving) {
        updateObject(object, drawData.activeObjectIndex);
      }

      setEditState((s) => {
        s.startRectResizeAnchor = undefined;
        s.startElementMovePoint = undefined;
      });
    }
    return true;
  };

  const finishCreatingWhenMouseUp: ToolHooksFunc.FinishCreatingWhenMouseUp = ({
    object,
  }) => {
    if (drawData.AIAnnotation) {
      finishAiPolygonWhenMouseUp();
    } else {
      if (object && object.currIndex === -1) {
        const { polygon, type, hidden, labelId, status, color } = object;
        const newObject = {
          polygon,
          type,
          hidden,
          labelId,
          status,
          color,
        };
        addObject(newObject);
      }
    }
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

export default usePolygon;
