/** Convert RGB array to hexadecimal. */
export const rgbArrayToHex = (rgb: (number | string)[]) => {
  if (rgb.length !== 3) return 'transparent';
  return `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1]
    .toString(16)
    .padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`.toUpperCase();
};

/** Convert RGB string to hexadecimal. */
export const rgbToHex = (rgb: string) => {
  const arr = /^rgba?\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(rgb);
  if (!arr) return 'transparent';
  return rgbArrayToHex(arr);
};

/** Convert hexadecimal to RGB array. */
export const hexToRgbArray = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const formatHex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });
  const arr = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formatHex);
  if (!arr) {
    return [0, 0, 0];
  }
  return [parseInt(arr[1], 16), parseInt(arr[2], 16), parseInt(arr[3], 16)];
};

/** Convert hexadecimal to RGBA string. */
export const hexToRgba = (hex: string, opacity = 1) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const formatHex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });
  const arr = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formatHex);
  const op = opacity < 0 || opacity > 1 ? 1 : opacity;
  if (!arr) {
    return 'transparent';
  }
  return `rgba(${parseInt(arr[1], 16)},${parseInt(arr[2], 16)},${parseInt(
    arr[3],
    16,
  )},${op})`;
};

/** Generate a color list based on the number of categories. */
export const createColorList = (count: number) => {
  const colors = [
    '#FFFF00',
    '#FF0000',
    '#0000FF',
    '#00FF00',
    '#FF00FF',
    '#00FFFF',
  ];
  const preList = [255, 128, 64, 32, 16, 8, 4, 2, 1];
  for (let cur = colors.length + 1; colors.length < count; cur++) {
    let rgb = [0, 0, 0];
    let flag = 1;
    let finded = true;
    for (let i = 0; flag <= cur; i++) {
      if ((cur & flag) > 0) {
        if (rgb[i % 3] + preList[Math.floor(i / 3)] <= 255) {
          rgb[i % 3] += preList[Math.floor(i / 3)];
        } else {
          finded = false;
          break;
        }
      }
      flag <<= 1;
    }
    if (finded) {
      const hexColor = `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1]
        .toString(16)
        .padStart(2, '0')}${rgb[2]
        .toString(16)
        .padStart(2, '0')}`.toUpperCase();
      if (!colors.includes(hexColor)) {
        colors.push(hexColor);
      }
    }
  }
  return colors;
};

export const getCategoryColors = (list: string[], cur?: string) => {
  if (!list.length) return {};

  const sortList = [...list];
  if (cur === 'All') {
    sortList.shift();
  } else if (cur) {
    // Move cur to the first position in the array.
    const curIndex = sortList.findIndex((item) => item === cur);
    sortList.splice(curIndex, 1);
    sortList[0] = cur;
  }

  const colors = createColorList(sortList.length);
  const result: Record<string, string> = {};
  sortList.forEach((item, index) => {
    result[item] = colors[index];
  });
  return result;
};

/** Convert RGB array to RGBA string. */
export const rgbArrayToRgba = (rgb: (number | string)[], alpha: number) => {
  if (rgb.length !== 3) return 'transparent';
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

/** Convert RGBA string to RGB array. */
export const rgbaToRgbArray = (rgba: string): string[] => {
  const rgbaValues = rgba
    .slice(5, -1)
    .split(',')
    .map((value) => value.trim());
  if (rgbaValues.length !== 4 || isNaN(parseFloat(rgbaValues[3]))) {
    return [];
  }
  return rgbaValues.slice(0, 3);
};

/** Modify the transparency of the RGBA format. */
export const changeRgbaOpacity = (rgba: string, opacity: number): string => {
  if (!rgba) return 'rgba(0,0,0,0)';
  const rgbaArray = rgba
    .substring(5, rgba.length - 1)
    .split(',')
    .map((value) => parseInt(value.trim()));
  const newRgbaArray = [...rgbaArray.slice(0, 3), opacity];
  const newRgbaString = `rgba(${newRgbaArray.join(',')})`;
  return newRgbaString;
};

/** HSV to RGB */
const hsvToRgb = (
  h: number,
  s: number,
  v: number,
): [number, number, number] => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 1 / 6) {
    r = c;
    g = x;
  } else if (h < 2 / 6) {
    r = x;
    g = c;
  } else if (h < 3 / 6) {
    g = c;
    b = x;
  } else if (h < 4 / 6) {
    g = x;
    b = c;
  } else if (h < 5 / 6) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

export const generateUniformHexColor = (() => {
  const goldenRatio = 0.618033988749895; // Golden ratio for even color distribution
  let hue = Math.random();

  return (): string => {
    hue = (hue + goldenRatio) % 1;
    const rgbColor = hsvToRgb(hue, 0.8, 0.95);
    return rgbArrayToHex(rgbColor);
  };
})();
