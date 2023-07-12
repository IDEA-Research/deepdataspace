import React from 'react';
import { CursorState } from 'ahooks/lib/useMouse';
import { DrawData, EMaskPromptType, EditState, ICreatingObject } from '../type';
import {
  getInnerPolygonIndexFromGroup,
  getKeypointsFromRect,
  getLinesFromPolygon,
  getMidPointFromTwoPoints,
  getRectFromPoints,
  getRectWithCenterAndSize,
  mapRectToAnchors,
  setRectBetweenPixels,
  translateAnnotCoord,
  translatePointCoord,
  translatePointsToPointObjs,
  translatePolygonCoord,
  translateRectCoord,
} from '@/utils/compute';
import {
  BODY_TEMPLATE,
  EElementType,
  EObjectType,
  KEYPOINTS_VISIBLE_TYPE,
  LABELS_STROKE_DASH,
} from '@/constants';
import {
  clearCanvas,
  drawCircleWithFill,
  drawImage,
  drawLine,
  drawPolygonWithFill,
  drawQuadraticPath,
  drawRect,
  resizeSmoothCanvas,
  setCanvasGlobalAlpha,
  shadeEverythingButRect,
} from '@/utils/draw';
import { changeRgbaOpacity, hexToRgba } from '@/utils/color';
import {
  ANNO_FILL_ALPHA,
  ANNO_FILL_COLOR,
  ANNO_MASK_ALPHA,
  ANNO_STROKE_ALPHA,
  ANNO_STROKE_COLOR,
  PROMPT_FILL_COLOR,
} from '../constants/render';
import { renderMask } from '../tools/mask';

interface IProps {
  visible: boolean;
  drawData: DrawData;
  editState: EditState;
  clientSize: ISize;
  naturalSize: ISize;
  contentMouse: CursorState;
  labelColors: Record<string, string>;
  imagePos: React.MutableRefObject<IPoint>;
  containerMouse: CursorState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeCanvasRef: React.RefObject<HTMLCanvasElement>;
  imgRef: React.RefObject<HTMLImageElement>;
}

const useCanvasRender = ({
  visible,
  drawData,
  editState,
  clientSize,
  naturalSize,
  contentMouse,
  labelColors,
  imagePos,
  containerMouse,
  canvasRef,
  activeCanvasRef,
  imgRef,
}: IProps) => {
  // =================================================================================================================
  // Render
  // =================================================================================================================

  const renderRect = (
    canvas: HTMLCanvasElement,
    rect: IElement<IRect>,
    color: string,
    strokeAlpha: number,
    fillAlpha: number,
  ) => {
    drawRect(
      canvas,
      rect,
      hexToRgba(color, strokeAlpha),
      2,
      LABELS_STROKE_DASH[0],
      hexToRgba(color, fillAlpha),
    );
  };

  const renderRectActive = (
    canvas: HTMLCanvasElement,
    rect: IElement<IRect>,
  ) => {
    const handleCenters: IPoint[] = mapRectToAnchors(rect).map(
      (rectAnchor) => rectAnchor.position,
    );
    handleCenters.forEach((center: IPoint) => {
      const handleRect: IRect = getRectWithCenterAndSize(center, {
        width: 10,
        height: 10,
      });
      const handleRectBetweenPixels: IRect = setRectBetweenPixels(handleRect);
      drawRect(
        canvas,
        handleRectBetweenPixels,
        'rgba(0, 0, 0, 0.8)',
        3,
        LABELS_STROKE_DASH[0],
        '#fff',
      );
    });
  };

  const renderKeypoints = (
    canvas: HTMLCanvasElement,
    keypoints: {
      points: IElement<IPoint>[];
      lines: number[];
    },
    color: string,
    strokeAlpha: number,
  ) => {
    const { lines, points } = keypoints;

    // draw line
    for (let i = 0; i * 2 < lines.length; i++) {
      const [index1, index2] = [lines[i * 2], lines[i * 2 + 1]];
      if (
        points[index1].visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible &&
        points[index2].visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible
      ) {
        drawLine(
          canvas,
          points[index1],
          points[index2],
          hexToRgba(color, strokeAlpha),
          2,
          LABELS_STROKE_DASH[0],
        );
      }
    }

    // draw circle
    points.forEach((point) => {
      const { x, y, visible, color } = point;
      const fillColor = changeRgbaOpacity(
        color || 'rgba(255, 255, 255, 1)',
        strokeAlpha,
      );
      const strokeColor = `rgba(0, 0, 0, ${strokeAlpha})`;
      if (visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible) {
        drawCircleWithFill(canvas, { x, y }, 4, fillColor, 2, strokeColor);
      }
    });
  };

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

  const updateCreatingRender = (creatingObject: ICreatingObject) => {
    const color = labelColors[creatingObject.label] || '#fff';
    const strokeColor = ANNO_STROKE_COLOR.CREATING;
    const fillColor = ANNO_FILL_COLOR.CREATING;

    switch (creatingObject.type) {
      case EObjectType.Rectangle: {
        const { startPoint } = creatingObject;
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
        break;
      }
      case EObjectType.Polygon: {
        // draw unfinished points and lines
        const { currIndex } = creatingObject;
        const annotObject = translateAnnotCoord(creatingObject, {
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
        break;
      }
      case EObjectType.Skeleton: {
        const { startPoint } = creatingObject;
        if (startPoint) {
          // creating
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
          const { points, lines, pointColors, pointNames } = BODY_TEMPLATE;
          const pointObjs = translatePointsToPointObjs(
            points,
            pointNames,
            pointColors,
            naturalSize,
            clientSize,
          );
          const updatedKeypoints = getKeypointsFromRect(
            pointObjs,
            canvasCoordRect,
          );

          // draw rect
          drawRect(activeCanvasRef.current, canvasCoordRect, strokeColor, 2);

          // draw circles
          updatedKeypoints.forEach((p) => {
            drawCircleWithFill(
              activeCanvasRef.current!,
              { x: p.x, y: p.y },
              4,
              strokeColor,
              3,
              '#1f4dd8',
            );
          });

          // draw lines
          for (let i = 0; i * 2 < lines.length; i++) {
            const [index1, index2] = [lines[i * 2], lines[i * 2 + 1]];
            drawLine(
              activeCanvasRef.current!,
              updatedKeypoints[index1],
              updatedKeypoints[index2],
              strokeColor,
              2.5,
              LABELS_STROKE_DASH[0],
            );
          }
        }
        break;
      }
      case EObjectType.Mask: {
        renderMask(
          activeCanvasRef.current!,
          creatingObject,
          imagePos.current,
          color,
          {
            x: containerMouse.elementX,
            y: containerMouse.elementY,
          },
          clientSize,
          naturalSize,
        );
        break;
      }
      default:
        break;
    }
  };

  const updateEditingRender = (creatingObject: ICreatingObject) => {
    // draw currently annotated objects
    if (creatingObject.hidden) return;

    const canvasCoordObject = translateAnnotCoord(creatingObject, {
      x: -imagePos.current.x,
      y: -imagePos.current.y,
    });
    const { rect, keypoints, polygon, label } = canvasCoordObject;

    const color = labelColors[label] || '#fff';
    const isFocus = editState.focusObjectIndex === drawData.activeObjectIndex;
    const [fillAlpha, strokeAlpha] = isFocus
      ? [ANNO_FILL_ALPHA.FOCUS, ANNO_STROKE_ALPHA.FOCUS]
      : [ANNO_FILL_ALPHA.CREATING, ANNO_STROKE_ALPHA.CREATING];

    switch (creatingObject.type) {
      case EObjectType.Rectangle: {
        if (rect && rect.visible) {
          renderRect(
            activeCanvasRef.current!,
            rect,
            color,
            strokeAlpha,
            fillAlpha,
          );
          renderRectActive(activeCanvasRef.current!, rect);
        }
        break;
      }
      case EObjectType.Polygon: {
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
        break;
      }
      case EObjectType.Skeleton: {
        if (rect && rect.visible) {
          // editing
          renderRect(
            activeCanvasRef.current!,
            rect,
            color,
            strokeAlpha,
            fillAlpha,
          );
          renderRectActive(activeCanvasRef.current!, rect);
        }
        if (keypoints) {
          renderKeypoints(
            activeCanvasRef.current!,
            keypoints,
            color,
            strokeAlpha,
          );

          // draw hightlight circle
          if (
            isFocus &&
            editState.focusEleType === EElementType.Circle &&
            keypoints.points[editState.focusEleIndex]
          ) {
            const { x, y, visible, color } =
              keypoints.points[editState.focusEleIndex];
            if (visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible) {
              drawCircleWithFill(
                activeCanvasRef.current!,
                { x, y },
                4,
                color,
                5,
                '#fff',
              );
            }
          }
        }
        break;
      }
      case EObjectType.Mask: {
        renderMask(
          activeCanvasRef.current!,
          creatingObject,
          imagePos.current,
          color,
          {
            x: containerMouse.elementX,
            y: containerMouse.elementY,
          },
          clientSize,
          naturalSize,
        );
        break;
      }
      default:
        break;
    }
  };

  const updateCreatingPromptRender = (theDrawData: DrawData) => {
    // draw creating prompt
    if (theDrawData.prompt.creatingMask) {
      const strokeColor = ANNO_STROKE_COLOR.CREATING;
      const fillColor = ANNO_FILL_COLOR.CREATING;
      switch (theDrawData.prompt.creatingMask.type) {
        case EMaskPromptType.Rect: {
          const { startPoint } = theDrawData.prompt.creatingMask;
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
            LABELS_STROKE_DASH[0],
            fillColor,
          );
          break;
        }
        case EMaskPromptType.Point: {
          if (!theDrawData.prompt.creatingMask.point) break;
          const canvasCoordPoint = translatePointCoord(
            theDrawData.prompt.creatingMask.point,
            {
              x: -imagePos.current.x,
              y: -imagePos.current.y,
            },
          );
          drawCircleWithFill(
            activeCanvasRef.current!,
            canvasCoordPoint,
            4,
            theDrawData.prompt.creatingMask.isPositive
              ? PROMPT_FILL_COLOR.POSITIVE
              : PROMPT_FILL_COLOR.NEGATIVE,
            2,
            '#fff',
          );
        }
        case EMaskPromptType.EdgeStitch:
        case EMaskPromptType.Stroke: {
          if (
            !theDrawData.prompt.creatingMask.stroke ||
            !theDrawData.prompt.creatingMask.radius
          )
            break;
          const canvasCoordStroke = translatePolygonCoord(
            theDrawData.prompt.creatingMask.stroke,
            {
              x: -imagePos.current.x,
              y: -imagePos.current.y,
            },
          );
          const radius =
            (theDrawData.prompt.creatingMask.radius * clientSize.width) /
            naturalSize.width;
          const color =
            theDrawData.prompt.creatingMask.type === EMaskPromptType.EdgeStitch
              ? hexToRgba(strokeColor, ANNO_MASK_ALPHA.CREATING)
              : theDrawData.prompt.creatingMask.isPositive
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
    }

    // draw segmentation reference points
    if (theDrawData.prompt.segmentationClicks) {
      theDrawData.prompt.segmentationClicks.forEach((click) => {
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

    // draw active area while loading ai annotations
    if (editState.isRequiring && theDrawData.prompt.activeRectWhileLoading) {
      const canvasCoordRect = translateRectCoord(
        theDrawData.prompt.activeRectWhileLoading,
        {
          x: -imagePos.current.x,
          y: -imagePos.current.y,
        },
      );
      shadeEverythingButRect(activeCanvasRef.current!, canvasCoordRect);
    }
  };

  const updateRenderActiveCanvas = (updateDrawData?: DrawData) => {
    if (!visible || !activeCanvasRef.current) return;

    resizeSmoothCanvas(activeCanvasRef.current, {
      width: containerMouse.elementW,
      height: containerMouse.elementH,
    });
    activeCanvasRef.current.getContext('2d')!.imageSmoothingEnabled = false;
    clearCanvas(activeCanvasRef.current);

    const theDrawData = updateDrawData || drawData;
    if (theDrawData.creatingObject) {
      if (theDrawData.activeObjectIndex > -1) {
        updateEditingRender(theDrawData.creatingObject);
      } else {
        updateCreatingRender(theDrawData.creatingObject);
      }
    }

    updateCreatingPromptRender(theDrawData);
  };

  const updateRender = (updateDrawData?: DrawData) => {
    if (!visible || !canvasRef.current || !imgRef.current) return;

    resizeSmoothCanvas(canvasRef.current, {
      width: containerMouse.elementW,
      height: containerMouse.elementH,
    });
    canvasRef.current.getContext('2d')!.imageSmoothingEnabled = false;
    clearCanvas(canvasRef.current);

    drawImage(canvasRef.current, imgRef.current, {
      x: imagePos.current.x,
      y: imagePos.current.y,
      width: clientSize.width,
      height: clientSize.height,
    });

    const theDrawData = updateDrawData || drawData;

    // draw esisting objects
    theDrawData.objectList.forEach((obj, index) => {
      if (obj.hidden || index === theDrawData.activeObjectIndex) return;

      const canvasCoordObject = translateAnnotCoord(obj, {
        x: -imagePos.current.x,
        y: -imagePos.current.y,
      });
      const { rect, keypoints, polygon, maskCanvasElement, label } =
        canvasCoordObject;
      const isFocus = editState.focusObjectIndex === index;

      // Color styles
      const color = labelColors[label] || '#fff';
      const [fillAlpha, strokeAlpha, maskAlpha] = isFocus
        ? [
            ANNO_FILL_ALPHA.FOCUS,
            ANNO_STROKE_ALPHA.FOCUS,
            ANNO_MASK_ALPHA.FOCUS,
          ]
        : [
            ANNO_FILL_ALPHA.DEFAULT,
            ANNO_STROKE_ALPHA.DEFAULT,
            ANNO_MASK_ALPHA.DEFAULT,
          ];

      // Change globalAlpha when creating / editing object
      setCanvasGlobalAlpha(
        canvasRef.current!,
        drawData.creatingObject ? 0.3 : 1,
      );

      // draw rect
      if (rect && rect.visible) {
        renderRect(canvasRef.current!, rect, color, strokeAlpha, fillAlpha);
      }

      // draw keypoints
      if (keypoints) {
        renderKeypoints(canvasRef.current!, keypoints, color, strokeAlpha);
      }

      // draw polygon
      if (polygon && polygon.visible) {
        renderPolygon(
          canvasRef.current!,
          polygon,
          color,
          strokeAlpha,
          fillAlpha,
        );
      }

      // draw mask
      if (maskCanvasElement && theDrawData.activeObjectIndex !== index) {
        const ctx = canvasRef.current!.getContext(
          '2d',
        ) as CanvasRenderingContext2D;
        const tempAlpha = ctx.globalAlpha;
        ctx.globalAlpha = ctx.globalAlpha * maskAlpha;
        drawImage(canvasRef.current!, maskCanvasElement, {
          x: imagePos.current.x,
          y: imagePos.current.y,
          width: clientSize.width,
          height: clientSize.height,
        });
        // restore
        ctx.globalAlpha = tempAlpha;
      }
    });

    // draw creating object
    updateRenderActiveCanvas(updateDrawData);
  };

  return {
    updateRender,
  };
};

export default useCanvasRender;
