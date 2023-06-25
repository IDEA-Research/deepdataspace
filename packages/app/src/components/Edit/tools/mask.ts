import { decode, encode } from '@thi.ng/rle-pack';
import { mockRle } from './mockRle';
import { hexToRgbArray, hexToRgba } from '@/utils/color';
import { ICreatingMaskStep, ICreatingObject } from '..';
import { translatePointZoom, translatePolygonCoord } from '@/utils/compute';
import {
  clearCanvas,
  drawBooleanPolygon,
  drawCircleWithFill,
  drawImage,
  drawLine,
  drawBooleanBrush,
} from '@/utils/draw';
import { ESubToolItem, LABELS_STROKE_DASH } from '@/constants';
import { ANNO_STROKE_ALPHA } from '../constants/render';

export const mockMaskAnnotation = {
  categoryName: 'person',
  maskRle: mockRle,
};

export const renderMaskSteps = (
  maskCanvas: HTMLCanvasElement,
  imagePos: IPoint,
  strokeColor: string,
  tempMaskSteps?: ICreatingMaskStep[],
) => {
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
          hexToRgba(strokeColor, 0.8),
          'transparent',
        );
      }

      if (
        step.tool === ESubToolItem.BrushAdd ||
        step.tool === ESubToolItem.BrushErase
      ) {
        canvasCoordPoints.forEach((point, pointIdx) => {
          if (
            canvasCoordPoints.length > 1 &&
            pointIdx < canvasCoordPoints.length - 1
          ) {
            drawBooleanBrush(
              maskCanvas!,
              point,
              canvasCoordPoints[pointIdx + 1],
              step.positive,
              hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING),
              25,
              // LABELS_STROKE_DASH[0],
            );
          }
        });
      }
    });
  }
};

export const renderMask = (
  maskCanvas: HTMLCanvasElement,
  creatingObject: ICreatingObject,
  imagePos: IPoint,
  strokeColor: string,
  mousePoint: IPoint,
  clientSize: ISize,
) => {
  if (!maskCanvas) return;

  const { maskStep, tempMaskSteps, maskImage } = creatingObject;
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return null;

  // draw mask image
  if (maskImage) {
    ctx.globalAlpha = 0.8;
    drawImage(maskCanvas, maskImage, {
      x: imagePos.x,
      y: imagePos.y,
      width: clientSize.width,
      height: clientSize.height,
    });
    ctx.globalAlpha = 1;
  }

  // draw temp mask according to step queue
  renderMaskSteps(maskCanvas, imagePos, strokeColor, tempMaskSteps);

  // draw currently step when mouse move
  if (maskStep && maskStep.points.length > 0) {
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
        strokeColor,
        3,
        '#1f4dd8',
      );

      // draw line
      canvasCoordPath.forEach((point, pointIdx) => {
        if (
          canvasCoordPath.length > 1 &&
          pointIdx < canvasCoordPath.length - 1
        ) {
          drawLine(
            maskCanvas!,
            point,
            canvasCoordPath[pointIdx + 1],
            hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING),
            1,
            LABELS_STROKE_DASH[0],
          );
        } else if (pointIdx === canvasCoordPath.length - 1) {
          drawLine(
            maskCanvas!,
            canvasCoordPath[pointIdx],
            mousePoint,
            hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING_LINE),
            1,
            LABELS_STROKE_DASH[2],
          );
        }
      });
    }

    if (
      maskStep.tool === ESubToolItem.BrushAdd ||
      maskStep.tool === ESubToolItem.BrushErase
    ) {
      // draw line
      canvasCoordPath.forEach((point, pointIdx) => {
        if (
          canvasCoordPath.length > 1 &&
          pointIdx < canvasCoordPath.length - 1
        ) {
          drawLine(
            maskCanvas!,
            point,
            canvasCoordPath[pointIdx + 1],
            hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING),
            25,
            // LABELS_STROKE_DASH[0],
          );
        } else if (pointIdx === canvasCoordPath.length - 1) {
          drawLine(
            maskCanvas!,
            canvasCoordPath[pointIdx],
            mousePoint,
            hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING_LINE),
            25,
            // LABELS_STROKE_DASH[2],
          );
        }
      });
    }
  }
};

export const rleToImage = (rle: number[], size: ISize, color: string) => {
  const { width, height } = size;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  if (!ctx) return null;

  const newdata = ctx.createImageData(width, height);
  const decoded = decode(rle as unknown as Uint8Array);

  newdata.data.set(decoded, 0);

  const rgb = hexToRgbArray(color);

  for (let i = newdata.data.length / 4; i--; ) {
    if (newdata.data[i * 4 + 3] > 0) {
      newdata.data[i * 4] = rgb[0];
      newdata.data[i * 4 + 1] = rgb[1];
      newdata.data[i * 4 + 2] = rgb[2];
      newdata.data[i * 4 + 3] = 255;
    }
  }

  ctx.putImageData(newdata, 0, 0);
  const newImage = new Image();
  newImage.src = canvas.toDataURL();
  canvas.remove();

  return newImage;
};

export const changeMaskImageColor = (
  maskImage: HTMLImageElement,
  color: string,
) => {
  return new Promise<HTMLImageElement | null>((resolve) => {
    // 1. Convert to image
    const imageCanvas = document.createElement('canvas');
    const imageCtx = imageCanvas.getContext('2d');

    imageCanvas.width = maskImage.naturalWidth;
    imageCanvas.height = maskImage.naturalHeight;
    drawImage(imageCanvas, maskImage, {
      x: 0,
      y: 0,
      width: maskImage.naturalWidth,
      height: maskImage.naturalHeight,
    });

    if (!imageCtx) {
      resolve(null);
      return;
    }
    const nImageData = imageCtx.getImageData(
      0,
      0,
      maskImage.naturalWidth,
      maskImage.naturalHeight,
    );

    // Change color
    const rgb = hexToRgbArray(color);
    for (let i = nImageData.data.length / 4; i--; ) {
      if (nImageData.data[i * 4 + 3] > 0) {
        nImageData.data[i * 4] = rgb[0];
        nImageData.data[i * 4 + 1] = rgb[1];
        nImageData.data[i * 4 + 2] = rgb[2];
        nImageData.data[i * 4 + 3] = 255;
      }
    }
    clearCanvas(imageCanvas);
    imageCtx.putImageData(nImageData, 0, 0);

    // Change to image
    const newImage = new Image();
    newImage.src = imageCanvas.toDataURL();
    imageCanvas.remove();

    newImage.onload = () => {
      resolve(newImage);
      return;
    };
  });
};

export const objectToRle = async (
  clientSize: ISize,
  naturalSize: ISize,
  maskSteps?: ICreatingMaskStep[],
  maskImage?: HTMLImageElement,
) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
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
  if (maskImage) {
    drawImage(canvas, maskImage, {
      x: 0,
      y: 0,
      width: naturalSize.width,
      height: naturalSize.height,
    });
  }

  // render new mask object
  renderMaskSteps(canvas, { x: 0, y: 0 }, '#fff', newSteps);

  // getImageData
  const maskData = ctx.getImageData(
    0,
    0,
    naturalSize.width,
    naturalSize.height,
  );

  // Grayscale pixels respecting the opacity
  for (let i = maskData.data.length / 4; i--; ) {
    maskData.data[i * 4] =
      maskData.data[i * 4 + 1] =
      maskData.data[i * 4 + 2] =
      maskData.data[i * 4 + 3] =
        maskData.data[i * 4 + 3] > 0 ? 1 : 0;
  }

  const arr = encode(maskData.data, maskData.data.length);
  // console.log('>>>> output', maskData, Array.from(arr));
  return Array.from(arr);
};
