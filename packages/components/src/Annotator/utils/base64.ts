/**
 * Convert image to base64.
 * @param imgUrl
 * @returns
 */
export const getImageBase64 = async (imgUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.URL = window.URL || window.webkitURL;

    const xhr = new XMLHttpRequest();
    xhr.open('get', imgUrl, true);
    xhr.responseType = 'blob';
    xhr.setRequestHeader('If-Modified-Since', '0');
    xhr.send();
    xhr.onload = function () {
      if (this.status === 200) {
        const blob = this.response;
        const oFileReader = new FileReader();
        oFileReader.onloadend = function (e) {
          const base64 = e.target?.result;
          resolve(base64 as string);
        };
        oFileReader.onerror = function (e) {
          reject(e);
        };
        oFileReader.readAsDataURL(blob);
      }
    };
    xhr.onerror = function (e) {
      reject(e);
    };
  });
};

export const isBase64 = (str: string) => {
  const base64Regex = /^data:image\/(png|jpe?g|gif|svg|webp);base64,/i;
  return base64Regex.test(str);
};

export const isBlobUrl = (str: string) => {
  const blobUrlRegex = /^blob:/i;
  return blobUrlRegex.test(str);
};

export const getImgBase64ByBlob = (blobUrl: Blob) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      resolve(e.target?.result);
    };
    fileReader.readAsDataURL(blobUrl);
    fileReader.onerror = (e) => {
      reject(e);
    };
  });
};
