import { decode } from '@thi.ng/rle-pack';
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
    if (newdata.data[i * 4 + 3]) {
      newdata.data[i * 4] = rgb[0];
      newdata.data[i * 4 + 1] = rgb[1];
      newdata.data[i * 4 + 2] = rgb[2];
      newdata.data[i * 4 + 3] = opacity * newdata.data[i * 4 + 3];
    }
  }

  ctx.putImageData(newdata, 0, 0);
  const newImage = new Image();
  newImage.src = canvas.toDataURL();

  return newImage;
};
