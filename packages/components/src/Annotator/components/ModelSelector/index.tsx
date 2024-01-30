import Icon from '@ant-design/icons';
import { Select } from 'antd';
import { useLocale } from 'dds-utils/locale';
import { memo } from 'react';

import {
  EBasicToolItem,
  EBasicToolTypeMap,
  EnumModelType,
  MODEL_INTRO_MAP,
  OBJECT_AI_ICON,
} from '../../constants';

import './index.less';

interface IProps {
  selectedTool: EBasicToolItem;
  selectedModel?: EnumModelType;
  modelOptions: EnumModelType[];
  onSelectModel: (type: EnumModelType) => void;
}

const ModelSelector: React.FC<IProps> = memo(
  ({ selectedTool, selectedModel, modelOptions, onSelectModel }) => {
    const { localeText } = useLocale();

    const objectType = EBasicToolTypeMap[selectedTool];

    return (
      <div className="dds-annotator-model-selector">
        <Select
          placeholder={localeText('DDSAnnotator.label.select')}
          size="middle"
          value={selectedModel}
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
              <Icon component={OBJECT_AI_ICON[objectType]} />
              {MODEL_INTRO_MAP[model] &&
                localeText(MODEL_INTRO_MAP[model]!.name)}
            </Select.Option>
          ))}
        </Select>
      </div>
    );
  },
);

export default ModelSelector;
