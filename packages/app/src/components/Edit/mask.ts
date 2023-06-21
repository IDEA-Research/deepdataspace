import { decode, encode } from '@thi.ng/rle-pack';
import { mockRle } from './mockRle';
import { hexToRgbArray } from '@/utils/color';

export const mockMaskAnnotation = {
  categoryName: 'person',
  maskRle: mockRle,
};

export const rleToImage = (rle: number[], size: ISize, color: string) => {
  const opacity = 0.3;

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
      newdata.data[i * 4 + 3] = opacity * 255;
    }
  }

  ctx.putImageData(newdata, 0, 0);
  const newImage = new Image();
  newImage.src = canvas.toDataURL();
  canvas.remove();

  return newImage;
};

export const canvasToRle = async (
  maskCanvas: HTMLCanvasElement,
  imagePos: IPoint,
  clientSize: ISize,
  naturalSize: ISize,
) => {
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return null;
  const maskData = maskCtx.getImageData(
    imagePos.x,
    imagePos.y,
    clientSize.width,
    clientSize.height,
  );

  return new Promise<Uint8Array | null>((resolve) => {
    // 1. Convert to image
    const imageCanvas = document.createElement('canvas');
    const imageCtx = imageCanvas.getContext('2d');

    imageCanvas.width = clientSize.width;
    imageCanvas.height = clientSize.height;
    if (!imageCtx) {
      resolve(null);
      return;
    }

    imageCtx.putImageData(maskData, 0, 0);
    const maskImage = new Image();
    maskImage.src = imageCanvas.toDataURL();

    maskImage.onload = () => {
      // 2. Convert to naturl size
      const naturalCanvas = document.createElement('canvas');
      const naturalCtx = naturalCanvas.getContext('2d');

      naturalCanvas.width = naturalSize.width;
      naturalCanvas.height = naturalSize.height;
      if (!naturalCtx) {
        resolve(null);
        return null;
      }

      naturalCtx.drawImage(
        maskImage,
        0,
        0,
        naturalSize.width,
        naturalSize.height,
      );
      const nImageData = naturalCtx.getImageData(
        0,
        0,
        naturalSize.width,
        naturalSize.height,
      );

      // maskCtx.putImageData(
      //   data,
      //   imagePos.x,
      //   imagePos.y,
      //   0, 0,
      //   clientSize.width,
      //   clientSize.height
      // );

      // Grayscale pixels respecting the opacity
      for (let i = nImageData.data.length / 4; i--; ) {
        nImageData.data[i * 4] =
          nImageData.data[i * 4 + 1] =
          nImageData.data[i * 4 + 2] =
          nImageData.data[i * 4 + 3] =
            nImageData.data[i * 4 + 3] > 0 ? 1 : 0;
      }

      const arr = encode(nImageData.data, nImageData.data.length);
      // console.log('>>>> output', nImageData, Array.from(arr), maskImage.src);
      resolve(arr);
    };
  });
};
