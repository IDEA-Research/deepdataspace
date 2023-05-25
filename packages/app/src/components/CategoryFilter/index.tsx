import React from 'react';
import { Select } from 'antd';
import { DATA } from '@/services/type';
import { useLocale } from '@/locales/helper';
import styles from './index.less';

export interface IProps {
  categoryId?: string;
  categories: DATA.Category[];
  onCategoryChange: (categoryId: string) => void;
}

const CategoryFilter: React.FC<IProps> = (props) => {
  const { localeText } = useLocale();
  const { categoryId, categories, onCategoryChange } = props;

  return (
    <div className={styles.wrapper}>
      {localeText('dataset.detail.category')}:
      <Select
        showSearch
        style={{ width: '160px', marginLeft: '10px' }}
        dropdownMatchSelectWidth={false}
        placeholder="Select a category"
        optionFilterProp="children"
        value={categoryId}
        onChange={onCategoryChange}
        filterOption={(input, option) =>
          (option!.children as unknown as string)
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        getPopupContainer={() => document.getElementById('filterWrap')!}
      >
        {categories.map((item) => (
          <Select.Option key={item.id} value={item.id}>
            {item.name}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default CategoryFilter;
