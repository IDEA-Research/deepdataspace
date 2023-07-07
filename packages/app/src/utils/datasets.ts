import { includes } from 'lodash';

/**
 * set cover image based on dataset type
 * @param type
 */
export const generateDefaultCover = (type: string[]) => {
  let _img_index: number = 0;

  if (includes(type, 'Classification')) {
    _img_index = 1;
  }
  if (includes(type, 'Detection')) {
    _img_index = 2;
  }
  if (includes(type, 'Segmentation')) {
    _img_index = 3;
  }
  if (includes(type, 'Matting')) {
    _img_index = 4;
  }
  if (includes(type, 'KeyPoints')) {
    _img_index = 5;
  }

  return require(`@/assets/images/cards/card_cover_${_img_index}.png`);
};
