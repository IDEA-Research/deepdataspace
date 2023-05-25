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
