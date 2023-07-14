import {
  drawCircleWithFill,
  drawLine,
  drawPolygonWithFill,
} from '@/utils/draw';
import { EElementType, LABELS_STROKE_DASH } from '@/constants';
import {
  getInnerPolygonIndexFromGroup,
  getLinesFromPolygon,
  getMidPointFromTwoPoints,
  translateAnnotCoord,
  translatePointCoord,
} from '@/utils/compute';
import { ToolInstanceHook, ToolHooksFunc } from './base';
import { hexToRgba } from '@/utils/color';
import { ANNO_STROKE_ALPHA, PROMPT_FILL_COLOR } from '../constants/render';

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
  imagePos,
  containerMouse,
  canvasRef,
  activeCanvasRef,
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

  return {
    renderObject,
    renderCreatingObject,
    renderEditingObject,
    renderPrompt,
  };
};

export default usePolygon;
