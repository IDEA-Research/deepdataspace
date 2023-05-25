import React from 'react';
import { Checkbox, Radio, RadioChangeEvent, Space } from 'antd';
import styles from './index.less';
import DropdownSelector from '../DropdownSelector';
import classNames from 'classnames';
import { useLocale } from '@/locales/helper';
import {
  AnnotationType,
  DISPLAY_OPTION_LABELS,
  DisplayOption,
} from '@/constants';

export interface IProps {
  annotationTypes: string[];
  disableChangeType?: boolean;
  displayAnnotationType?: AnnotationType;
  displayOptions: DisplayOption[];
  displayOptionsValue: DisplayOption[];
  onDisplayAnnotationTypeChange: (type: AnnotationType) => void;
  onDisplayOptionsChange: (values: any) => void;
}

const DisplayOptions: React.FC<IProps> = (props) => {
  const { localeText } = useLocale();
  const {
    annotationTypes,
    disableChangeType,
    displayAnnotationType,
    displayOptions,
    displayOptionsValue,
    onDisplayAnnotationTypeChange,
    onDisplayOptionsChange,
  } = props;

  return (
    <DropdownSelector
      className={styles.dropBtn}
      customOverlay={
        <div className={classNames(styles.displayPanel)}>
          {annotationTypes.length > 0 && (
            <div className={styles.objectTypeOption}>
              <span className={styles.typeTitle}>
                {localeText('dataset.detail.displayType')}:
              </span>
              <Radio.Group
                disabled={disableChangeType}
                onChange={(e: RadioChangeEvent) =>
                  onDisplayAnnotationTypeChange(e.target.value)
                }
                value={displayAnnotationType}
              >
                {annotationTypes.map((item) => (
                  <Radio key={item} value={item}>
                    {item}
                  </Radio>
                ))}
              </Radio.Group>
            </div>
          )}
          <Checkbox.Group
            className={styles.displayOptions}
            onChange={onDisplayOptionsChange}
            value={displayOptionsValue}
          >
            <Space direction="vertical">
              {displayOptions.map((item) => (
                <Checkbox key={item} value={item}>
                  {localeText(DISPLAY_OPTION_LABELS[item])}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      }
    >
      {localeText('dataset.detail.displayOptions')}
    </DropdownSelector>
  );
};

export default DisplayOptions;
