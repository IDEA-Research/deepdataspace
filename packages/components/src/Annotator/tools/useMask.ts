import { cloneDeep } from 'lodash';

import { EnumModelType, EObjectType, ESubToolItem } from '../constants';
import {
  ANNO_FILL_COLOR,
  ANNO_MASK_ALPHA,
  ANNO_STROKE_ALPHA,
  ANNO_STROKE_COLOR,
  PROMPT_FILL_COLOR,
  PROMPT_STROKE_COLOR,
} from '../constants/render';
import {
  EPromptType,
  ICreatingMaskStep,
  ICreatingObject,
  PromptItem,
} from '../type';
import { hexToRgbArray, hexToRgba } from '../utils/color';
import {
  getRectFromPoints,
  isInCanvas,
  isPointOnPoint,
  translatePointCoord,
  translatePointZoom,
  translatePolygonCoord,
  translateRectCoord,
} from '../utils/compute';
import {
  clearCanvas,
  drawBooleanBrush,
  drawBooleanPolygon,
  drawCircleWithFill,
  drawImage,
  drawLine,
  drawPath,
  drawQuadraticPath,
  drawRect,
  shadeEverythingButRect,
} from '../utils/draw';

import { ToolInstanceHook, ToolHooksFunc, getPromptBoolean } from './base';

export const encodeRleString = (rleArr: number[]): string => {
  const m = rleArr.length;
  let p = 0;
  let x = 0;
  let more = true;
  const s = Array(m * 6);

  for (let i = 0; i < m; i++) {
    x = rleArr[i];
    if (i > 2) {
      x -= rleArr[i - 2];
    }
    more = true;

    while (more) {
      let c = x & 0x1f;
      x >>= 5;
      more = !!((x !== -1 && c & 0x10) || (x !== 0 && !(c & 0x10)));
      if (more) {
        c |= 0x20;
      }
      c += 48;
      s[p] = String.fromCharCode(c);
      p += 1;
    }
  }
  return s.join('');
};

export const decodeRleString = (s: string): number[] => {
  let p = 0;
  const cnts = [];

  while (p < s.length && s[p]) {
    let x = 0;
    let k = 0;
    let more = 1;

    while (more) {
      const c = s.charCodeAt(p) - 48;
      x |= (c & 0x1f) << (5 * k);
      more = c & 0x20;
      p += 1;
      k += 1;

      if (!more && c & 0x10) {
        x |= -1 << (5 * k);
      }
    }

    if (cnts.length > 2) {
      x += cnts[cnts.length - 2];
    }
    cnts.push(x);
  }
  return cnts;
};

/**
 * only [0,1] array with rle decode
 * example:
 * [2,3,4,1,....] to [0,0,1,1,1,0,0,0,0,1....]
 */
export const decodeRleArray = (rle: number[], length: number) => {
  let mask = new Array(length);
  let pixel = 0;
  let bit = 0;

  for (let i = 0; i < rle.length; i++) {
    const count = rle[i];
    for (let j = 0; j < count; j++) {
      mask[pixel] = bit;
      pixel++;
    }
    bit = 1 - bit;
  }
  return mask;
};

/**
 * only [0,1] array with rle encode
 * example:
 * [0,0,1,1,1,0,0,0,0,1....] to [2,3,4,1,....]
 */
export const encodeRleArray = (mask: number[]) => {
  const rle: number[] = [];
  let count = 0;
  let prevBit = mask[0];

  for (let i = 0; i < mask.length; i++) {
    const bit = mask[i];
    if (bit === prevBit) {
      count++;
    } else {
      rle.push(count);
      count = 1;
      prevBit = bit;
    }
  }
  rle.push(count);

  return rle;
};

const decodeRle = (rleStr: string, length: number) => {
  return decodeRleArray(decodeRleString(rleStr), length);
};

const encodeRle = (mask: number[]) => {
  return encodeRleString(encodeRleArray(mask));
};

export const renderMaskSteps = (
  maskCanvas: HTMLCanvasElement,
  imagePos: IPoint,
  clientSize: ISize,
  naturalSize: ISize,
  strokeColor: string,
  tempMaskSteps?: ICreatingMaskStep[],
) => {
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return null;

  // prevent the mask from exceeding the image boundaries.
  ctx.save();
  ctx.beginPath();
  ctx.rect(imagePos.x, imagePos.y, clientSize.width, clientSize.height);
  ctx.clip();

  // draw temp mask according to step queue
  if (tempMaskSteps && tempMaskSteps?.length > 0) {
    tempMaskSteps.forEach((step) => {
      const canvasCoordPoints = translatePolygonCoord(step.points, {
        x: -imagePos.x,
        y: -imagePos.y,
      });

      if (
        step.tool === ESubToolItem.PenAdd ||
        step.tool === ESubToolItem.PenErase
      ) {
        drawBooleanPolygon(
          maskCanvas!,
          canvasCoordPoints,
          step.positive,
          hexToRgba(strokeColor, ANNO_MASK_ALPHA.CREATING),
          'transparent',
        );
      }

      if (
        step.tool === ESubToolItem.BrushAdd ||
        step.tool === ESubToolItem.BrushErase
      ) {
        drawBooleanBrush(
          maskCanvas!,
          canvasCoordPoints,
          step.positive,
          strokeColor,
          ANNO_MASK_ALPHA.CREATING,
          (step.radius * clientSize.width) / naturalSize.width,
        );
      }
    });
  }

  ctx.restore();
};

export const renderMask = (
  maskCanvas: HTMLCanvasElement,
  creatingObject: ICreatingObject,
  imagePos: IPoint,
  strokeColor: string,
  mousePoint: IPoint,
  clientSize: ISize,
  naturalSize: ISize,
) => {
  if (!maskCanvas) return;

  const { maskStep, tempMaskSteps, maskCanvasElement } = creatingObject;
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return null;

  // draw mask image
  if (maskCanvasElement) {
    ctx.globalAlpha = ANNO_MASK_ALPHA.CREATING;
    drawImage(maskCanvas, maskCanvasElement, {
      x: imagePos.x,
      y: imagePos.y,
      width: clientSize.width,
      height: clientSize.height,
    });
    ctx.globalAlpha = 1;
  }

  // draw temp mask according to step queue
  renderMaskSteps(
    maskCanvas,
    imagePos,
    clientSize,
    naturalSize,
    strokeColor,
    tempMaskSteps,
  );

  // draw currently step when mouse move
  if (maskStep && maskStep.points.length > 0) {
    const color =
      maskStep.tool === ESubToolItem.PenAdd ||
      maskStep.tool === ESubToolItem.BrushAdd
        ? ANNO_FILL_COLOR.CREATING_POSITIVE
        : ANNO_FILL_COLOR.CREATING_NEGATIVE;
    const canvasCoordPath = translatePolygonCoord(maskStep.points, {
      x: -imagePos.x,
      y: -imagePos.y,
    });

    if (
      maskStep.tool === ESubToolItem.PenAdd ||
      maskStep.tool === ESubToolItem.PenErase
    ) {
      // draw start point
      drawCircleWithFill(
        maskCanvas!,
        canvasCoordPath[0],
        6,
        hexToRgba(color, ANNO_STROKE_ALPHA.CREATING),
        3,
        ANNO_STROKE_COLOR.CREATING,
      );

      if (canvasCoordPath.length > 0) {
        // draw path
        drawPath(
          maskCanvas!,
          canvasCoordPath,
          hexToRgba(color, ANNO_STROKE_ALPHA.CREATING),
          2.5,
          [0],
        );

        // draw dash line for mouse
        drawLine(
          maskCanvas!,
          canvasCoordPath[canvasCoordPath.length - 1],
          mousePoint,
          hexToRgba(color, ANNO_STROKE_ALPHA.CREATING_LINE),
          2.5,
          [5],
        );
      }
    }

    if (
      maskStep.tool === ESubToolItem.BrushAdd ||
      maskStep.tool === ESubToolItem.BrushErase ||
      maskStep.tool === ESubToolItem.AutoSegmentByStroke
    ) {
      if (canvasCoordPath.length > 1) {
        drawQuadraticPath(
          maskCanvas!,
          canvasCoordPath,
          hexToRgba(color, ANNO_MASK_ALPHA.CREATING),
          (maskStep.radius * clientSize.width) / naturalSize.width,
        );
      }
    }
  }
};

export const changeMaskCanvasColor = (
  maskCanvas: HTMLCanvasElement,
  color: string,
) => {
  const imageCtx = maskCanvas.getContext('2d', { willReadFrequently: true });

  if (!imageCtx) {
    return null;
  }
  const nImageData = imageCtx.getImageData(
    0,
    0,
    maskCanvas.width,
    maskCanvas.height,
  );

  // Change color by pixel
  const rgb = hexToRgbArray(color);
  for (let i = nImageData.data.length / 4; i--; ) {
    if (nImageData.data[i * 4 + 3] > 0) {
      nImageData.data[i * 4] = rgb[0];
      nImageData.data[i * 4 + 1] = rgb[1];
      nImageData.data[i * 4 + 2] = rgb[2];
      nImageData.data[i * 4 + 3] = 255;
    }
  }
  clearCanvas(maskCanvas);
  imageCtx.putImageData(nImageData, 0, 0);

  return maskCanvas;
};

export const objectToRle = (
  clientSize: ISize,
  naturalSize: ISize,
  maskSteps?: ICreatingMaskStep[],
  maskCanvasElement?: HTMLCanvasElement,
) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !maskSteps) return null;

  canvas.width = naturalSize.width;
  canvas.height = naturalSize.height;

  // translate size
  const newSteps = maskSteps.map((step) => {
    return {
      ...step,
      points: step.points.map((point) =>
        translatePointZoom(point, clientSize, naturalSize),
      ),
    };
  });

  // render edit maskImage
  if (maskCanvasElement) {
    drawImage(canvas, maskCanvasElement, {
      x: 0,
      y: 0,
      width: naturalSize.width,
      height: naturalSize.height,
    });
  }

  // render new mask object
  renderMaskSteps(
    canvas,
    { x: 0, y: 0 },
    naturalSize, // target clientsize
    naturalSize,
    '#fff',
    newSteps,
  );

  // getImageData
  const maskData = ctx.getImageData(
    0,
    0,
    naturalSize.width,
    naturalSize.height,
  );

  // Grayscale pixels respecting the opacity
  let maskPixelCount = 0;
  // custom encode rle
  const arr = new Array(maskData.data.length / 4).fill(0);
  for (let i = maskData.data.length / 4; i--; ) {
    let maskAplha = 0;
    if (maskData.data[i * 4 + 3] > 0) {
      maskPixelCount++;
      maskAplha = 1;
      arr[i] = 1;
    }
    maskData.data[i * 4] =
      maskData.data[i * 4 + 1] =
      maskData.data[i * 4 + 2] =
      maskData.data[i * 4 + 3] =
        maskAplha;
  }

  return maskPixelCount > 0 ? encodeRle(arr) : '';
};

export const rleToCanvas = (rle: string, size: ISize, color: string) => {
  const { width, height } = size;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  if (!ctx) return null;

  const newdata = ctx.createImageData(width, height);
  const rgb = hexToRgbArray(color);

  // custom rle decode
  const maskArr = decodeRle(rle, Math.ceil(width) * Math.ceil(height));
  for (let i = newdata.data.length / 4; i--; ) {
    if (maskArr[i] > 0) {
      newdata.data[i * 4] = rgb[0];
      newdata.data[i * 4 + 1] = rgb[1];
      newdata.data[i * 4 + 2] = rgb[2];
      newdata.data[i * 4 + 3] = 255;
    }
  }

  ctx.putImageData(newdata, 0, 0);

  return canvas;
};

const useMask: ToolInstanceHook = ({
  editState,
  clientSize,
  naturalSize,
  contentMouse,
  imagePos,
  containerMouse,
  canvasRef,
  activeCanvasRef,
  drawData,
  setDrawData,
  setDrawDataWithHistory,
  updateHistory,
  onAiAnnotation,
  updateMouseCursor,
}) => {
  const renderObject: ToolHooksFunc.RenderObject = ({ object, styles }) => {
    const { maskCanvasElement } = object;
    const ctx = canvasRef.current!.getContext('2d') as CanvasRenderingContext2D;
    const tempAlpha = ctx.globalAlpha;
    ctx.globalAlpha = ctx.globalAlpha * styles.maskAlpha;
    drawImage(canvasRef.current!, maskCanvasElement, {
      x: imagePos.current.x,
      y: imagePos.current.y,
      width: clientSize.width,
      height: clientSize.height,
    });
    // restore
    ctx.globalAlpha = tempAlpha;
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = ({
    object,
    color,
  }) => {
    if (editState.hideCreatingObject) {
      return;
    }
    renderMask(
      activeCanvasRef.current!,
      object,
      imagePos.current,
      color,
      {
        x: containerMouse.elementX,
        y: containerMouse.elementY,
      },
      clientSize,
      naturalSize,
    );
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = ({
    object,
    color,
  }) => {
    if (editState.hideCreatingObject) {
      return;
    }
    renderMask(
      activeCanvasRef.current!,
      object,
      imagePos.current,
      color,
      {
        x: containerMouse.elementX,
        y: containerMouse.elementY,
      },
      clientSize,
      naturalSize,
    );
  };

  const renderPrompt: ToolHooksFunc.RenderPrompt = ({ prompt }) => {
    const model = drawData.selectedModel[drawData.selectedTool];

    // draw creating prompt
    if (prompt.creatingPrompt) {
      if (model === EnumModelType.IVP) {
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
      } else {
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
          case EPromptType.EdgeStitch:
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
            const color =
              prompt.creatingPrompt.type === EPromptType.EdgeStitch
                ? hexToRgba(strokeColor, ANNO_MASK_ALPHA.CREATING)
                : prompt.creatingPrompt.isPositive
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
    }

    // draw existing prompts
    if (prompt.promptsQueue) {
      if (model === EnumModelType.IVP) {
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
      } else {
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
    }
  };

  const updateMaskWhenMouseDown = (event: MouseEvent) => {
    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    setDrawData((s) => {
      switch (s.selectedSubTool) {
        case ESubToolItem.PenAdd:
        case ESubToolItem.PenErase:
        case ESubToolItem.BrushAdd:
        case ESubToolItem.BrushErase:
          if (s.creatingObject) {
            if (s.creatingObject.maskStep) {
              // add points for currently path
              s.creatingObject.maskStep.points.push(mouse);
              // judege to close path
              if (
                [ESubToolItem.PenAdd, ESubToolItem.PenErase].includes(
                  s.selectedSubTool,
                ) &&
                isPointOnPoint(
                  s.creatingObject.maskStep.points[0],
                  contentMouse,
                )
              ) {
                s.creatingObject.tempMaskSteps?.push(s.creatingObject.maskStep);
                s.creatingObject.maskStep = undefined;
              }
            } else {
              // init new step for creating points
              s.creatingObject.maskStep = {
                tool: s.selectedSubTool,
                positive:
                  s.selectedSubTool === ESubToolItem.PenAdd ||
                  s.selectedSubTool === ESubToolItem.BrushAdd,
                points: [mouse],
                radius: s.brushSize,
              };
            }
            if (
              ![ESubToolItem.BrushAdd, ESubToolItem.BrushErase].includes(
                s.selectedSubTool,
              )
            ) {
              // Brush tool need not push history when mousedown
              updateHistory(cloneDeep(s));
            }
          }
          s.prompt.sessionId = undefined;
          break;
        case ESubToolItem.AutoSegmentByBox:
          s.prompt.creatingPrompt = {
            type: EPromptType.Rect,
            startPoint: mouse,
            isPositive: true,
          };
          break;
        case ESubToolItem.AutoSegmentByClick:
          s.prompt.creatingPrompt = {
            type: EPromptType.Point,
            startPoint: mouse,
            point: mouse,
            isPositive: getPromptBoolean(event),
          };
          break;
        case ESubToolItem.AutoSegmentByStroke:
          s.prompt.creatingPrompt = {
            type: EPromptType.Stroke,
            startPoint: mouse,
            stroke: [mouse],
            radius: s.brushSize,
            isPositive: getPromptBoolean(event),
          };
          break;
        case ESubToolItem.AutoEdgeStitching:
          s.prompt.creatingPrompt = {
            type: EPromptType.EdgeStitch,
            startPoint: mouse,
            stroke: [mouse],
            radius: s.brushSize,
            isPositive: true,
          };
        default:
          break;
      }
    });
  };

  const startEditingWhenMouseDown: ToolHooksFunc.StartEditingWhenMouseDown = ({
    event,
  }) => {
    updateMaskWhenMouseDown(event);
    return true;
  };

  const startCreatingWhenMouseDown: ToolHooksFunc.StartCreatingWhenMouseDown =
    ({ event, object, point, basic }) => {
      if (!object) {
        setDrawData((s) => {
          s.activeObjectIndex = -1;
          switch (s.selectedSubTool) {
            case ESubToolItem.PenAdd:
            case ESubToolItem.PenErase:
            case ESubToolItem.BrushAdd:
            case ESubToolItem.BrushErase:
              s.creatingObject = {
                ...basic,
                type: EObjectType.Mask,
                startPoint: point,
                maskStep: {
                  tool: s.selectedSubTool,
                  positive:
                    s.selectedSubTool === ESubToolItem.PenAdd ||
                    s.selectedSubTool === ESubToolItem.BrushAdd,
                  points: [point],
                  radius: s.brushSize,
                },
                tempMaskSteps: [],
              };
              s.prompt.sessionId = undefined;
              break;
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
            case ESubToolItem.AutoSegmentByStroke:
              s.prompt.creatingPrompt = {
                type: EPromptType.Stroke,
                startPoint: point,
                stroke: [point],
                radius: s.brushSize,
                isPositive: getPromptBoolean(event),
              };
              break;
            case ESubToolItem.AutoEdgeStitching:
              s.prompt.creatingPrompt = {
                type: EPromptType.EdgeStitch,
                startPoint: point,
                stroke: [point],
                radius: s.brushSize,
                isPositive: true,
              };
              break;
            case ESubToolItem.PositiveVisualPrompt:
            case ESubToolItem.NegativeVisualPrompt:
              s.prompt.creatingPrompt = {
                type: EPromptType.Rect,
                startPoint: point,
                point,
                isPositive:
                  s.selectedSubTool !== ESubToolItem.NegativeVisualPrompt,
              };
            default:
              break;
          }
        });
      } else {
        updateMaskWhenMouseDown(event);
      }
      return true;
    };

  const updateMaskWhenMouseMove: ToolHooksFunc.UpdateCreatingWhenMouseMove = ({
    event,
    object,
  }) => {
    if (object || drawData.prompt.creatingPrompt) {
      updateMouseCursor('crosshair');
      const allowRecordMousePath = [
        ESubToolItem.BrushAdd,
        ESubToolItem.BrushErase,
        ESubToolItem.PenAdd,
        ESubToolItem.PenErase,
        ESubToolItem.AutoSegmentByStroke,
        ESubToolItem.AutoEdgeStitching,
      ].includes(drawData.selectedSubTool);

      // Left/Right button is pressed while mousemove
      const isMousePress = event.buttons === 1 || event.buttons === 2;
      if (allowRecordMousePath && isMousePress) {
        // checkContainerVisibleArea();
        const mouse = {
          x: contentMouse.elementX,
          y: contentMouse.elementY,
        };
        const isCreatingPrompt = [
          ESubToolItem.AutoSegmentByStroke,
          ESubToolItem.AutoEdgeStitching,
        ].includes(drawData.selectedSubTool);
        setDrawData((s) => {
          if (isCreatingPrompt) {
            s.prompt.creatingPrompt?.stroke?.push(mouse);
          } else {
            s.creatingObject?.maskStep?.points.push(mouse);
          }
        });
      }
      return true;
    }
    return false;
  };

  const updateEditingWhenMouseMove: ToolHooksFunc.UpdateEditingWhenMouseMove =
    ({ object, event }) => {
      return updateMaskWhenMouseMove({
        object,
        event,
      });
    };

  const updateCreatingWhenMouseMove: ToolHooksFunc.UpdateCreatingWhenMouseMove =
    ({ object, event }) => {
      return updateMaskWhenMouseMove({
        object,
        event,
      });
    };

  const finishMaskWhenMouseUp = () => {
    if (!drawData.creatingObject && !drawData.prompt.creatingPrompt) return;
    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    const model = drawData.selectedModel[drawData.selectedTool];
    switch (drawData.selectedSubTool) {
      case ESubToolItem.BrushAdd:
      case ESubToolItem.BrushErase:
      case ESubToolItem.PenAdd:
      case ESubToolItem.PenErase: {
        setDrawDataWithHistory((s) => {
          if (
            s.creatingObject &&
            s.creatingObject.tempMaskSteps &&
            s.creatingObject.maskStep &&
            s.creatingObject.maskStep.points.length > 1
          ) {
            if (
              [ESubToolItem.BrushAdd, ESubToolItem.BrushErase].includes(
                s.selectedSubTool,
              ) ||
              ([ESubToolItem.PenAdd, ESubToolItem.PenErase].includes(
                s.selectedSubTool,
              ) &&
                isPointOnPoint(
                  s.creatingObject.maskStep.points[0],
                  contentMouse,
                ))
            ) {
              s.creatingObject.tempMaskSteps?.push(s.creatingObject.maskStep);
              s.creatingObject.maskStep = undefined;
            }
          }
          s.prompt.sessionId = undefined;
        });
        break;
      }
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
        const promptsQueue = drawData.prompt.promptsQueue
          ? [...drawData.prompt.promptsQueue, promptItem]
          : [promptItem];
        onAiAnnotation?.({ type: EObjectType.Mask, drawData, promptsQueue });
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
        const promptsQueue = drawData.prompt.promptsQueue
          ? [...drawData.prompt.promptsQueue, promptItem]
          : [promptItem];
        onAiAnnotation?.({ type: EObjectType.Mask, drawData, promptsQueue });
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
        const promptsQueue = drawData.prompt.promptsQueue
          ? [...drawData.prompt.promptsQueue, promptItem]
          : [promptItem];
        onAiAnnotation?.({ type: EObjectType.Mask, drawData, promptsQueue });
        break;
      }
      case ESubToolItem.AutoEdgeStitching: {
        if (!drawData.prompt.creatingPrompt?.stroke) break;
        onAiAnnotation?.({ type: EObjectType.Mask, drawData });
        break;
      }
      case ESubToolItem.PositiveVisualPrompt:
      case ESubToolItem.NegativeVisualPrompt: {
        if (
          model !== EnumModelType.IVP ||
          !drawData.prompt.creatingPrompt?.startPoint
        )
          break;
        const { startPoint } = drawData.prompt.creatingPrompt;
        if (mouse.x === startPoint.x || mouse.y === startPoint.y) {
          setDrawData((s) => (s.prompt.creatingPrompt = undefined));
          break;
        } else {
          const rect = getRectFromPoints(startPoint, mouse, {
            width: contentMouse.elementW,
            height: contentMouse.elementH,
          });
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
            type: EObjectType.Mask,
            drawData,
            promptsQueue,
          });
        }
      }
    }
  };

  const finishEditingWhenMouseUp: ToolHooksFunc.FinishEditingWhenMouseUp =
    () => {
      finishMaskWhenMouseUp();
      return true;
    };

  const finishCreatingWhenMouseUp: ToolHooksFunc.FinishCreatingWhenMouseUp =
    () => {
      finishMaskWhenMouseUp();
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

export default useMask;
