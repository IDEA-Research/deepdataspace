import { Select } from 'antd';
import { useLocale } from 'dds-utils/locale';
import { memo, useMemo } from 'react';

import {
  EBasicToolItem,
  EBasicToolTypeMap,
  LABEL_TOOL_MAP,
  OBJECT_ICON,
} from '../../constants';
import { Category, DrawData } from '../../type';
import CategoryCreator from '../CategoryCreator';

import './index.less';

interface IProps {
  drawData: DrawData;
  latestLabelId: string;
  isSeperate?: boolean;
  labelOptions: Category[];
  labelColors?: Record<string, string>;
  onChangeObjectLabel: (labelId: string) => void;
  onCreateCategory: (name: string) => void;
}

const LabelSelector: React.FC<IProps> = memo(
  ({
    drawData,
    latestLabelId,
    isSeperate,
    labelOptions,
    labelColors,
    onChangeObjectLabel,
    onCreateCategory,
  }) => {
    const { localeText } = useLocale();
    const TypeIcon = useMemo(() => {
      if (labelOptions.length > 0) {
        const labelType = labelOptions[0]?.labelType;
        // @ts-ignore
        const toolType = labelType && LABEL_TOOL_MAP[labelType];
        const objectType =
          EBasicToolTypeMap[toolType as unknown as EBasicToolItem];
        if (objectType) {
          return OBJECT_ICON[objectType];
        }
      }
      return undefined;
    }, [labelOptions]);

    return (
      <div className="dds-annotator-label-selector">
        <Select
          showSearch
          placeholder={localeText('DDSAnnotator.label.select')}
          size="middle"
          value={
            drawData.objectList[drawData.activeObjectIndex]?.labelId ||
            latestLabelId
          }
          onChange={onChangeObjectLabel}
          popupClassName="objects-select-popup"
          onClick={(event) => event.stopPropagation()}
          onKeyUp={(event) => event.stopPropagation()}
          onInputKeyDown={(event) => {
            if (event.code !== 'Enter') {
              event.stopPropagation();
            }
          }}
          filterOption={(inputValue, option) => {
            const label =
              option?.children?.[(option?.children?.length || 0) - 1] || '';
            return label.toLowerCase()?.includes(inputValue.toLowerCase());
          }}
          dropdownRender={(menu) => (
            <>
              {menu}
              {isSeperate && <CategoryCreator onAdd={onCreateCategory} />}
            </>
          )}
        >
          {labelOptions?.map((label) => (
            <Select.Option
              key={label.id}
              value={label.id}
              className="dds-annotator-label-selector-option"
            >
              {TypeIcon ? (
                <TypeIcon color={label.renderColor} fill={label.renderColor} />
              ) : (
                <div
                  className="dds-annotator-label-selector-option-color"
                  style={{ backgroundColor: labelColors?.[label.id] }}
                />
              )}
              {label.name}
            </Select.Option>
          ))}
        </Select>
      </div>
    );
  },
);

export default LabelSelector;
