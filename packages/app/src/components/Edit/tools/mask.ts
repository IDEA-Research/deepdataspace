import { decode, encode } from '@thi.ng/rle-pack';
import { mockRle } from './mockRle';
import { hexToRgbArray, hexToRgba } from '@/utils/color';
import { ICreatingMaskStep, ICreatingObject } from '../type';
import { translatePointZoom, translatePolygonCoord } from '@/utils/compute';
import {
  clearCanvas,
  drawBooleanPolygon,
  drawCircleWithFill,
  drawImage,
  drawLine,
  drawBooleanBrush,
  drawPath,
  drawQuadraticPath,
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
          hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING_MASK),
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
          ANNO_STROKE_ALPHA.CREATING_MASK,
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

      if (canvasCoordPath.length > 0) {
        // draw path
        drawPath(
          maskCanvas!,
          canvasCoordPath,
          hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING),
          1,
          LABELS_STROKE_DASH[0],
        );

        // draw dash line for mouse
        drawLine(
          maskCanvas!,
          canvasCoordPath[canvasCoordPath.length - 1],
          mousePoint,
          hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING_LINE),
          1,
          LABELS_STROKE_DASH[2],
        );
      }
    }

    if (
      maskStep.tool === ESubToolItem.BrushAdd ||
      maskStep.tool === ESubToolItem.BrushErase
    ) {
      if (canvasCoordPath.length > 1) {
        drawQuadraticPath(
          maskCanvas!,
          canvasCoordPath,
          hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING_MASK),
          (maskStep.radius * clientSize.width) / naturalSize.width,
        );
      }
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
  for (let i = maskData.data.length / 4; i--; ) {
    let maskAplha = 0;
    if (maskData.data[i * 4 + 3] > 0) {
      maskPixelCount++;
      maskAplha = 1;
    }
    maskData.data[i * 4] =
      maskData.data[i * 4 + 1] =
      maskData.data[i * 4 + 2] =
      maskData.data[i * 4 + 3] =
        maskAplha;
  }

  const arr = encode(maskData.data, maskData.data.length);
  // console.log('>>>> output', maskData, Array.from(arr));
  return maskPixelCount > 0 ? Array.from(arr) : [];
};
