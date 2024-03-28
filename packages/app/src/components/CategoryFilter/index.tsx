import React, { useMemo } from 'react';
import { Select, SelectProps } from 'antd';
import { useLocale } from 'dds-utils/locale';
import styles from './index.less';
import { Category } from '@/types';

export interface IProps {
  categoryId?: string;
  categories: Category[];
  onCategoryChange: (categoryId: string) => void;
}

const CategoryFilter: React.FC<IProps> = (props) => {
  const { localeText } = useLocale();
  const { categoryId, categories, onCategoryChange } = props;

  const options: SelectProps['options'] = useMemo(() => {
    return categories.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  }, [categories]);

  return (
    <div className={styles.wrapper}>
      {localeText('dataset.detail.category')}:
      <Select
        showSearch
        style={{ width: '160px', marginLeft: '10px' }}
        placeholder="Select a category"
        options={options}
        optionFilterProp="label"
        value={categoryId}
        onChange={onCategoryChange}
        // @ts-ignore
        getPopupContainer={() =>
          document.getElementById('filterWrap')?.parentElement || null
        }
      />
    </div>
  );
};

export default CategoryFilter;
