import { isEmpty, isUndefined, includes } from 'lodash';

/**
 * check cover url of dataset, and display cover image based on different situation
 * @param url
 * @param type
 * @returns modified url
 */
export const renderDatasetCover = (url: string, type: string[]) => {
  if (isUndefined(url) || isEmpty(url)) {
    let _img_index = 5;

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
  } else if (/^http:/.test(url)) {
    return url;
  } else {
    return process.env.API_PATH + url;
  }
};
