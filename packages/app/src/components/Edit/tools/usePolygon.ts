import {
  drawCircleWithFill,
  drawLine,
  drawPolygonWithFill,
} from '@/utils/draw';
import { EElementType, EObjectType, LABELS_STROKE_DASH } from '@/constants';
import {
  getInnerPolygonIndexFromGroup,
  getLinesFromPolygon,
  getMidPointFromTwoPoints,
  isPointOnPoint,
  movePoint,
  movePolygon,
  translateAnnotCoord,
  translatePointCoord,
} from '@/utils/compute';
import {
  ToolInstanceHook,
  ToolHooksFunc,
  editBaseElementWhenMouseDown,
} from './base';
import { hexToRgba } from '@/utils/color';
import { ANNO_STROKE_ALPHA, PROMPT_FILL_COLOR } from '../constants/render';
import { cloneDeep } from 'lodash';

const renderPolygon = (
  canvas: HTMLCanvasElement,
  polygon: IElement<IPolygonGroup>,
  color: string,
  strokeAlpha: number,
  fillAlpha: number,
) => {
  if (polygon && polygon.visible) {
    polygon?.group.forEach((polygon) => {
      drawPolygonWithFill(
        canvas,
        polygon,
        hexToRgba(color, fillAlpha),
        hexToRgba(color, strokeAlpha),
        2,
        LABELS_STROKE_DASH[0],
      );
    });
  }
};

const usePolygon: ToolInstanceHook = ({
  editState,
  clientSize,
  imagePos,
  containerMouse,
  canvasRef,
  activeCanvasRef,
  contentMouse,
  setEditState,
  setDrawData,
  updateHistory,
  updateMouseCursor,
}) => {
  const renderObject: ToolHooksFunc.RenderObject = ({
    object,
    color,
    strokeAlpha,
    fillAlpha,
  }) => {
    const { polygon } = object;
    if (polygon && polygon.visible) {
      renderPolygon(canvasRef.current!, polygon, color, strokeAlpha, fillAlpha);
    }
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = ({
    object,
    strokeColor,
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
              strokeColor,
              3,
              '#1f4dd8',
            );
            // draw lines
            if (polygon.length > 1 && pointIdx < polygon.length - 1) {
              drawLine(
                activeCanvasRef.current!,
                polygon[pointIdx],
                polygon[pointIdx + 1],
                hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING),
                2.5,
                LABELS_STROKE_DASH[0],
              );
            } else if (pointIdx === polygon.length - 1) {
              drawLine(
                activeCanvasRef.current!,
                polygon[pointIdx],
                {
                  x: containerMouse.elementX,
                  y: containerMouse.elementY,
                },
                hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING_LINE),
                2.5,
                LABELS_STROKE_DASH[2],
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
              LABELS_STROKE_DASH[0],
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
          LABELS_STROKE_DASH[0],
        );
      });
    }
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = ({
    object,
    color,
    strokeAlpha,
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
            hexToRgba(color, strokeAlpha),
            2,
            LABELS_STROKE_DASH[0],
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
          hexToRgba(color, strokeAlpha),
          2,
          LABELS_STROKE_DASH[0],
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
          const midPoint = getMidPointFromTwoPoints(start, end);
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
      const { focusEleType, focusEleIndex } = editState;
      if (focusEleType === EElementType.Polygon && focusEleIndex === 0) {
        const { index, pointIndex } = editState.focusPolygonInfo;
        if (editState.startElementMovePoint && index > -1) {
          updateMouseCursor('move');
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
  };
};

export default usePolygon;
