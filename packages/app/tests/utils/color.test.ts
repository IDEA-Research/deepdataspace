import { rgbArrayToHex } from '@/utils/color';

describe('rgbArrayToHex', () => {
  it('should convert RGB array to hexadecimal', () => {
    expect(rgbArrayToHex([255, 0, 0])).toEqual('#FF0000');
    expect(rgbArrayToHex([255, 0, 255])).toEqual('#FF00FF');
    expect(rgbArrayToHex([0, 0, 0])).toEqual('#000000');
  });

  it('should return transparent if input is not an RGB array', () => {
    expect(rgbArrayToHex([])).toEqual('transparent');
    expect(rgbArrayToHex([255, 0])).toEqual('transparent');
  });
});
