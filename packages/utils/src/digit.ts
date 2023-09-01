/**
 * Round the decimal to n digits (take the first few digits)
 * @param value
 * @param n
 * @returns
 */
export const floorFloatNum = (value: number, n: number = 2) => {
  return Math.floor(value * Math.pow(10, n)) / Math.pow(10, n);
};

/**
 * Round the decimal to n digits (rounding off)
 * @param value
 * @param n
 * @returns
 */
export const fixedFloatNum = (value: number, n: number = 2) => {
  return Number(value.toFixed(n));
};
