export const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imgNode = new Image();
    imgNode.src = src;

    imgNode.onload = () => {
      resolve(imgNode);
    };

    imgNode.onerror = () => {
      reject(imgNode);
    };
  });
};
