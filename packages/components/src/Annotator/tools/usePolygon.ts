import {
  drawCircleWithFill,
  drawLine,
  drawPolygonWithFill,
} from '../utils/draw';
import { EElementType, EObjectType } from '../constants';
import {
  getClosestPointOnLineSegment,
  getInnerPolygonIndexFromGroup,
  getLinesFromPolygon,
  getRectFromPoints,
  getReferencePointsFromRect,
  isInCanvas,
  isPointOnPoint,
  movePoint,
  movePolygon,
  translateAnnotCoord,
  translatePointCoord,
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
  ANNO_STROKE_ALPHA,
  PROMPT_FILL_COLOR,
} from '../constants/render';
import { cloneDeep } from 'lodash';

const usePolygon: ToolInstanceHook = ({
  editState,
  clientSize,
  imagePos,
  containerMouse,
  canvasRef,
  activeCanvasRef,
  contentMouse,
  setEditState,
  drawData,
  setDrawData,
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
      const innerPolygonIdx = getInnerPolygonIndexFromGroup(polygon.group);
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
          if (!innerPolygonIdx.includes(polygonIdx)) {
            drawPolygonWithFill(
              activeCanvasRef.current,
              polygon,
              hexToRgba('#1f4dd8', 0.5),
              '#1f4dd8',
              2,
              [0],
            );
          }
        }
      });
      innerPolygonIdx.forEach((index) => {
        drawPolygonWithFill(
          activeCanvasRef.current,
          polygon.group[index],
          'rgba(255, 255, 255, 0.8)',
          '#1f4dd8',
          2,
          [0],
        );
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
      const innerPolygonIdx = getInnerPolygonIndexFromGroup(polygon.group);
      const isFocusOnPolygon =
        isFocus &&
        editState.focusEleType === EElementType.Polygon &&
        editState.focusEleIndex === 0;

      polygon.group.forEach((polygon, index) => {
        if (!innerPolygonIdx.includes(index)) {
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
        }
      });

      innerPolygonIdx.forEach((index) => {
        const fillColor = isFocusOnPolygon
          ? 'rgba(255, 255, 255, 0.8)'
          : 'transparent';
        drawPolygonWithFill(
          activeCanvasRef.current,
          polygon.group[index],
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
    // draw segmentation reference points
    if (prompt.segmentationClicks) {
      prompt.segmentationClicks.forEach((click) => {
        const canvasCoordPoint = translatePointCoord(click.point, {
          x: -imagePos.current.x,
          y: -imagePos.current.y,
        });
        drawCircleWithFill(
          activeCanvasRef.current!,
          canvasCoordPoint,
          4,
          click.isPositive
            ? PROMPT_FILL_COLOR.POSITIVE
            : PROMPT_FILL_COLOR.NEGATIVE,
          2,
          '#fff',
        );
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
        if (!s.creatingObject || s.activeObjectIndex > -1) {
          s.activeObjectIndex = -1;
          if (s.AIAnnotation) {
            // by drawing rectangle under AI mode
            s.creatingObject = {
              type: EObjectType.Rectangle,
              startPoint: point,
              ...basic,
              color: '#fff',
            };
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
            updateHistory(
              cloneDeep({
                drawData: s,
                clientSize,
              }),
            );
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
                updateHistory(
                  cloneDeep({
                    drawData: s,
                    clientSize,
                  }),
                );
              }
            } else {
              polygon.group.push([point]);
              s.creatingObject.currIndex = polygon.group.length - 1;
              updateHistory(
                cloneDeep({
                  drawData: s,
                  clientSize,
                }),
              );
            }
          }
        }
      });
      return true;
    };

  const updateEditingWhenMouseMove: ToolHooksFunc.UpdateEditingWhenMouseMove =
    () => {
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
    ({ object }) => {
      return !!object;
    };

  const finishEditingWhenMouseUp: ToolHooksFunc.FinishEditingWhenMouseUp = ({
    object,
  }) => {
    const isResizingOrMoving =
      editState.startRectResizeAnchor || editState.startElementMovePoint;

    const isMouseStand =
      editState.startElementMovePoint &&
      editState.startElementMovePoint.initPoint?.x === contentMouse.elementX &&
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
    return true;
  };

  const finishCreatingWhenMouseUp: ToolHooksFunc.FinishCreatingWhenMouseUp = ({
    event,
    object,
  }) => {
    if (!object) return false;

    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    if (drawData.AIAnnotation) {
      if (object.type === EObjectType.Polygon) {
        if (!isInCanvas(contentMouse) || !isInCanvas(containerMouse))
          return false;
        // add reference points
        const click = {
          isPositive: getPromptBoolean(event),
          point: mouse,
        };
        const existClicks = drawData.prompt.segmentationClicks || [];
        setDrawData((s) => {
          s.prompt.segmentationClicks = [...existClicks, click];
        });
        onAiAnnotation?.({
          type: EObjectType.Polygon,
          drawData,
          segmentationClicks: [...existClicks, click],
          aiLabels: [object.label],
        });
      } else {
        // first click
        if (
          contentMouse.elementX === object.startPoint?.x &&
          contentMouse.elementY === object.startPoint?.y
        ) {
          if (!isInCanvas(contentMouse)) return false;
          // draw point
          const firstClick = {
            isPositive: true,
            point: mouse,
          };
          setDrawData((s) => {
            s.prompt.segmentationClicks = [firstClick];
          });
          onAiAnnotation?.({
            type: EObjectType.Polygon,
            drawData,
            segmentationClicks: [firstClick],
          });
        } else {
          // draw bbox
          const rect = getRectFromPoints(object.startPoint as IPoint, mouse, {
            width: contentMouse.elementW,
            height: contentMouse.elementH,
          });
          const points = getReferencePointsFromRect(rect);
          const bbox = {
            xmin: rect.x,
            ymin: rect.y,
            xmax: rect.x + rect.width,
            ymax: rect.y + rect.height,
          };
          const clicks = points.map((point, index) => {
            return {
              // Only the center point is positive
              isPositive: index === points.length - 1 ? true : false,
              point,
            };
          });
          setDrawData((s) => {
            s.prompt.segmentationClicks = [...clicks];
          });
          onAiAnnotation?.({
            type: EObjectType.Polygon,
            drawData,
            segmentationClicks: clicks,
            bbox,
          });
        }
        setDrawData((s) => (s.creatingObject = undefined));
      }
    } else {
      if (object.currIndex === -1) {
        const { polygon, type, hidden, label, status, color } = object;
        const newObject = {
          polygon,
          type,
          hidden,
          label,
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
