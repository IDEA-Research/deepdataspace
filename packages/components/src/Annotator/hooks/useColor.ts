import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Category, EditState } from '../type';
import { getCategoryColors, hsvToRgb, rgbArrayToHex } from '../utils/color';

interface IProps {
  categories: Category[];
  editState: EditState;
  forceColorByObject?: boolean;
}

export default function useColor({
  categories,
  editState,
  forceColorByObject,
}: IProps) {
  const labelColors = useMemo(() => {
    return getCategoryColors(categories.map((item) => item.id));
  }, [categories]);

  const colorSeedRef = useRef(0);

  const getUniformHexColor = (seed: number) => {
    // update seed
    const goldenRatio = 0.618;
    colorSeedRef.current = seed + goldenRatio;

    // generate uniform hex color
    const hue = (seed + goldenRatio) % 1;
    const rgbColor = hsvToRgb(hue, 0.8, 0.95);
    return rgbArrayToHex(rgbColor);
  };

  useEffect(() => {
    // reset seed
    colorSeedRef.current = 0;
  }, [editState.annotsDisplayOptions.colorByCategory]);

  const getAnnotColor = useCallback(
    (categoryId: string, forceColorByCategory?: boolean) => {
      if (
        !forceColorByObject &&
        (editState.annotsDisplayOptions.colorByCategory || forceColorByCategory)
      ) {
        const catagory = categories.find((item) => item.id === categoryId);
        return catagory?.renderColor || labelColors[categoryId] || '#fff';
      } else {
        return getUniformHexColor(colorSeedRef.current);
      }
    },
    [
      editState.annotsDisplayOptions.colorByCategory,
      labelColors,
      getUniformHexColor,
      colorSeedRef.current,
      forceColorByObject,
    ],
  );

  return {
    labelColors,
    getAnnotColor,
  };
}
