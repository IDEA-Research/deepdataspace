import { floorFloatNum } from './digit';

export function genFileNameByTimestamp(
  timestamp: number,
  name?: string,
  ext?: string,
) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = floorFloatNum(date.getMonth() + 1);
  const day = floorFloatNum(date.getDate());
  const hours = floorFloatNum(date.getHours());
  const minutes = floorFloatNum(date.getMinutes());
  const seconds = floorFloatNum(date.getSeconds());
  const milliseconds = floorFloatNum(date.getMilliseconds(), 3);

  let fileName = `${year}_${month}_${day}_${hours}_${minutes}_${seconds}_${milliseconds}`;
  if (name) {
    fileName = `${name}_${fileName}`;
  }
  if (ext) {
    fileName = `${fileName}.${ext}`;
  }
  return fileName;
}

export function saveObejctToJsonFile(data: object, fileName: string) {
  const jsonString = JSON.stringify(data);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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

export async function scanFiles(
  entry: any,
  filesList: any[],
  acceptTypes?: string[],
) {
  return new Promise((resolve, reject) => {
    if (entry.isDirectory) {
      const directoryReader = entry.createReader();
      directoryReader.readEntries(
        async (entries: any[]) => {
          for (let index = 0; index < entries.length; index++) {
            await scanFiles(entries[index], filesList, acceptTypes);
            if (index === entries.length - 1) {
              resolve(1);
            }
          }
        },
        (e: any) => {
          reject(e);
        },
      );
    } else {
      entry.file(
        async (file: any) => {
          const path = entry.fullPath.substring(1);
          /**修改webkitRelativePath 是核心操作，原因是拖拽会的事件体中webkitRelativePath是空的，而且webkitRelativePath 是只读属性，普通赋值是不行的。所以目前只能使用这种方法将entry.fullPath 赋值给webkitRelativePath**/
          const newFile: File = Object.defineProperty(
            file,
            'webkitRelativePath',
            {
              value: path,
            },
          );
          if (!acceptTypes || acceptTypes.includes(newFile.type)) {
            filesList.push(newFile);
          }
          resolve(1);
          return;
        },
        (e: any) => {
          reject(e);
        },
      );
    }
  });
}

export async function scanDataTransfer(
  dataTransfer?: DataTransfer,
  acceptTypes?: string[],
) {
  if (!dataTransfer) return [];
  const filesList: File[] = [];

  // files filter
  for (const item of dataTransfer.files) {
    if (item && (!acceptTypes || acceptTypes.includes(item.type))) {
      filesList.push(item);
    }
  }

  // sub directory
  if (dataTransfer.items.length > 0) {
    for (const item of dataTransfer.items) {
      const itemEntry = item.webkitGetAsEntry();
      if (itemEntry?.isDirectory) {
        await scanFiles(itemEntry, filesList, acceptTypes);
      }
    }
  }
  return filesList;
}

export async function getImageDimensions(url: string): Promise<ISize> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      resolve({ width, height });
    };
    img.onerror = () => {
      reject(new Error('Load Image Error'));
    };
  });
}