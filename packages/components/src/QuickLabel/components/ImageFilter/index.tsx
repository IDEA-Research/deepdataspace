import { ClearOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
import { globalLocaleText } from 'dds-utils/locale';

import { Category } from '@/Annotator/type';

import './index.less';

interface IProps {
  categories: Category[];
  filterCategoryName: string | null;
  onSelectFilter: (name: string) => void;
  onClearFilter: () => void;
}

const ImageFilter: React.FC<IProps> = ({
  categories,
  filterCategoryName,
  onSelectFilter,
  onClearFilter,
}) => {
  return (
    <div className="dds-quicklabel-image-filter">
      <div>{globalLocaleText('quicklabel.imageFilter')}</div>
      <Select
        style={{ width: 150 }}
        showSearch
        placeholder={globalLocaleText('quicklabel.allCategories')}
        size="middle"
        value={filterCategoryName}
        onChange={onSelectFilter}
        popupClassName="filter-options-popup"
        onClick={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
        onInputKeyDown={(event) => {
          if (event.code !== 'Enter') {
            event.stopPropagation();
          }
        }}
        dropdownRender={(menu) => (
          <>
            {menu}
            {
              <Button
                type="text"
                icon={<ClearOutlined />}
                onClick={onClearFilter}
              >
                {globalLocaleText('quicklabel.clearFilter')}
              </Button>
            }
          </>
        )}
      >
        {categories?.map((category) => (
          <Select.Option key={category.name} value={category.name}>
            {category.name}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default ImageFilter;
