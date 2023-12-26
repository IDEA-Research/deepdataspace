import { Select } from 'antd';
import { useLocale } from 'dds-utils/locale';
import { memo } from 'react';
import { DrawData } from '../../type';
import {
  EnumModelType,
  EObjectType,
  MODEL_INTRO_MAP,
  OBJECT_AI_ICON,
} from '../../constants';
import './index.less';
import Icon from '@ant-design/icons';

interface IProps {
  drawData: DrawData;
  modelOptions: EnumModelType[];
  onSelectModel: (type: EnumModelType) => void;
}

const ModelSelector: React.FC<IProps> = memo(
  ({ drawData, modelOptions, onSelectModel }) => {
    const { localeText } = useLocale();

    return (
      <div className="dds-annotator-model-selector">
        <Select
          placeholder={localeText('DDSAnnotator.label.select')}
          size="middle"
          value={drawData.selectedModel}
          onChange={onSelectModel}
          popupClassName="objects-select-popup"
          onClick={(event) => event.stopPropagation()}
          onKeyUp={(event) => event.stopPropagation()}
          onInputKeyDown={(event) => {
            if (event.code !== 'Enter') {
              event.stopPropagation();
            }
          }}
        >
          {modelOptions?.map((model, index) => (
            <Select.Option
              key={index}
              value={model}
              className="dds-annotator-model-selector-option"
            >
              <Icon component={OBJECT_AI_ICON[EObjectType.Rectangle]} />
              {MODEL_INTRO_MAP[model]?.name}
            </Select.Option>
          ))}
        </Select>
      </div>
    );
  },
);

export default ModelSelector;
