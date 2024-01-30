import Icon from '@ant-design/icons';
import { Modal, Tag } from 'antd';
import classNames from 'classnames';
import { useLocale } from 'dds-utils';
import { memo, useMemo } from 'react';

import { EnumModelType, MODEL_INTRO_MAP } from '../../constants';

import './index.less';

interface IProps {
  AIAnnotation: boolean;
  modelOptions: EnumModelType[];
  selectedModel?: EnumModelType;
  onSelectModel: (type: EnumModelType) => void;
  onCloseModal: () => void;
}

const ModelSelectModal: React.FC<IProps> = memo(
  ({
    AIAnnotation,
    modelOptions,
    selectedModel,
    onSelectModel,
    onCloseModal,
  }) => {
    const { localeText } = useLocale();

    const modalWidth =
      modelOptions.length * 220 + (modelOptions.length + 1) * 20;

    const autoOpen = useMemo(() => {
      if (
        AIAnnotation &&
        modelOptions &&
        modelOptions.length > 1 &&
        !selectedModel
      ) {
        return true;
      }
      return false;
    }, [AIAnnotation, modelOptions, selectedModel]);

    return (
      <Modal
        open={autoOpen}
        title={localeText('DDSAnnotator.smart.modelSelectModal.title')}
        width={modalWidth}
        onCancel={onCloseModal}
        footer={null}
        centered
        destroyOnClose
      >
        <div className="dds-annotator-model-selector-modal">
          {modelOptions.map((model, index) => {
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
                  {localeText(intro.name)}
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
