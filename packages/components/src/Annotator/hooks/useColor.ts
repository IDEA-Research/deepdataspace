import { useCallback, useMemo } from 'react';
import { generateUniformHexColor, getCategoryColors } from '../utils/color';
import { Category, EditState } from '../type';

interface IProps {
  categories: Category[];
  editState: EditState;
}

export default function useColor({ categories, editState }: IProps) {
  const labelColors = useMemo(() => {
    return getCategoryColors(categories.map((item) => item.name));
  }, [categories]);

  const getAnnotColor = useCallback(
    (category: string, forceColorByCategory?: boolean) => {
      if (
        editState.annotsDisplayOptions.colorByCategory ||
        forceColorByCategory
      ) {
        return labelColors[category] || '#fff';
      } else {
        return generateUniformHexColor();
      }
    },
    [editState.annotsDisplayOptions.colorByCategory, labelColors],
  );

  return {
    labelColors,
    getAnnotColor,
  };
}
