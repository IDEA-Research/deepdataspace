import {
  EBasicToolItem,
  EnumModelType,
  MODEL_INTRO_MAP,
  TOOL_MODELS_MAP,
} from '../../constants';
import Icon from '@ant-design/icons';
import { Modal, Tag } from 'antd';
import { memo, useMemo } from 'react';
import './index.less';
import { useLocale } from 'dds-utils';
import classNames from 'classnames';

interface IProps {
  selectedTool: EBasicToolItem;
  AIAnnotation: boolean;
  selectedModel?: EnumModelType;
  onSelectModel: (type: EnumModelType) => void;
  onCloseModal: () => void;
}

const ModelSelectModal: React.FC<IProps> = memo(
  ({
    selectedTool,
    AIAnnotation,
    selectedModel,
    onSelectModel,
    onCloseModal,
  }) => {
    const { localeText } = useLocale();

    const autoOpen = useMemo(() => {
      if (
        AIAnnotation &&
        TOOL_MODELS_MAP[selectedTool] &&
        TOOL_MODELS_MAP[selectedTool]!.length > 1 &&
        !selectedModel
      ) {
        return true;
      }
      return false;
    }, [AIAnnotation, selectedTool, selectedModel]);

    return (
      <Modal
        open={autoOpen}
        title={'Enable Intelligent Annotate'}
        onCancel={onCloseModal}
        footer={null}
        centered
        destroyOnClose
      >
        <div className="dds-annotator-model-selector-modal">
          {TOOL_MODELS_MAP[selectedTool]?.map((model, index) => {
            const intro = MODEL_INTRO_MAP[model];
            if (!intro) return <></>;
            return (
              <div
                className={classNames(
                  'dds-annotator-model-selector-modal-option',
                  {
                    'dds-annotator-model-selector-modal-option-hightlight':
                      intro.hightlight,
                  },
                )}
                onClick={() => onSelectModel(model)}
                key={index}
              >
                <Icon
                  className="dds-annotator-model-selector-modal-option-icon"
                  component={intro.icon}
                />
                <div className="dds-annotator-model-selector-modal-option-name">
                  {intro.name}
                </div>
                <div className="dds-annotator-model-selector-modal-option-description">
                  {localeText(intro.description)}
                </div>
                {intro.hightlight && (
                  <Tag
                    color="geekblue"
                    className="dds-annotator-model-selector-modal-option-tag"
                  >
                    {'New'}
                  </Tag>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    );
  },
);

export default ModelSelectModal;
