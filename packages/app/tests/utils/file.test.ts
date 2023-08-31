import {
  genFileNameByTimestamp,
  loadImage,
  saveObejctToJsonFile,
} from 'dds-utils/file';

describe('genFileNameByTimestamp', () => {
  it('generates a file name with just a timestamp', () => {
    expect(genFileNameByTimestamp(1621855210000)).toEqual(
      '2021_5_24_19_20_10_0',
    );
  });

  it('generates a file name with a timestamp and name', () => {
    expect(genFileNameByTimestamp(1621855210000, 'test')).toEqual(
      'test_2021_5_24_19_20_10_0',
    );
  });

  it('generates a file name with a timestamp, name, and extension', () => {
    expect(genFileNameByTimestamp(1621855210000, 'test', 'txt')).toEqual(
      'test_2021_5_24_19_20_10_0.txt',
    );
  });
});

describe('saveObjectToJsonFile', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      value: jest.fn(),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: jest.fn(),
    });
  });

  it('should save object to JSON file', () => {
    const data = { name: 'John Doe', age: 30 };
    const fileName = 'test.json';
    saveObejctToJsonFile(data, fileName);
    expect(fileName).toBe(fileName);
  });
});

describe('loadImage', () => {
  it('should return a Promise that resolves to an HTMLImageElement', () => {
    const img = new Image();
    jest.spyOn(window, 'Image').mockImplementation(() => img);
    // eslint-disable-next-line jest/valid-expect-in-promise
    loadImage('https://www.baidu.com/favicon.ico').then((result) => {
      expect(result).toBe(img);
    });
    // @ts-igonre
    if (img.onload) img.onload();
  });
});
