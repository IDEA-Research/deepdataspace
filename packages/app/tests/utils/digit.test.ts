import { floorFloatNum, fixedFloatNum } from '@/utils/digit';

describe('test digit util', () => {
  test('format 2.355 to 2.35', () => {
    expect(floorFloatNum(2.356, 2)).toBe(2.35);
  });

  test('format 2.355 to 2.36', () => {
    expect(fixedFloatNum(2.356, 2)).toBe(2.36);
  });
});
