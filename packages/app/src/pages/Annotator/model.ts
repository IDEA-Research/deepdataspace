import { useImmer } from 'use-immer';
import { useState } from 'react';
import { DATA } from '@/services/type';
import { genFileNameByTimestamp, saveObejctToJsonFile } from '@/utils/file';
import { convertToCocoDateset } from '@/utils/adapter';
import { LabelImageFile } from '@/types/annotator';

export default () => {
  const [images, setImages] = useImmer<LabelImageFile[]>([]);
  const [current, setCurrent] = useState(0);
  const [categories, setCategories] = useImmer<DATA.Category[]>([]);

  /** Export with COCO formats*/
  const exportAnnotations = () => {
    const dataset = convertToCocoDateset(images, categories);
    const fileName = genFileNameByTimestamp(Date.now(), 'Annotations');
    saveObejctToJsonFile(dataset, fileName);
  };

  return {
    images,
    setImages,
    current,
    setCurrent,
    categories,
    setCategories,
    exportAnnotations,
  };
};
