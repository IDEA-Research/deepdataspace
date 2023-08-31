import React from 'react';
import { Checkbox, Radio, RadioChangeEvent, Slider, Space } from 'antd';
import styles from './index.less';
import DropdownSelector from '../DropdownSelector';
import classNames from 'classnames';
import {
  LABELS_STROKE_DASH,
  LABEL_DIFF_MODE_OPTIONS,
  LABEL_SOURCE,
  LabelDiffMode,
} from '@/constants';
import { getLabelCustomStyles } from '@/utils/datasets';
import { useLocale } from 'dds-utils/locale';
import { NsDataSet } from '@/types/dataset';

export interface IProps {
  showMatting?: boolean;
  showKeyPoints?: boolean;
  isTiledDiff?: boolean;
  labels: NsDataSet.Label[];
  selectedLabelIds: string[];
  diffMode: LabelDiffMode;
  disableChangeDiffMode?: boolean;
  onLabelsChange: (values: any) => void;
  onLabelConfidenceChange: (index: number, value: [number, number]) => void;
  onLabelsDiffModeChange: (mode: LabelDiffMode) => void;
}

const LabelOptions: React.FC<IProps> = (props) => {
  const { localeText } = useLocale();
  const {
    showMatting,
    showKeyPoints,
    isTiledDiff,
    labels,
    selectedLabelIds,
    diffMode,
    disableChangeDiffMode,
    onLabelsChange,
    onLabelConfidenceChange,
    onLabelsDiffModeChange,
  } = props;

  return (
    <DropdownSelector
      customOverlay={
        <div className={classNames(styles.labelsPanel)} id="labelsPanel">
          <div className={styles.labels}>
            <div className={styles.labelTitle}>
              <div style={{ width: '240px', paddingLeft: '24px' }}>
                {localeText('dataset.detail.labelSetsName')}
              </div>
              {!showMatting && (
                <>
                  <div style={{ width: '132px' }}>
                    {localeText('dataset.detail.confidence')}
                  </div>
                  <div style={{ width: '100px', marginLeft: '40px' }}>
                    {localeText('dataset.detail.style')}
                  </div>
                </>
              )}
            </div>
            <Checkbox.Group
              onChange={onLabelsChange}
              value={selectedLabelIds}
              className={styles.options}
            >
              <Space direction="vertical">
                {labels.map((item, index) => {
                  const { strokeDash, lineWidth, colorAplha } =
                    getLabelCustomStyles(
                      item.id,
                      selectedLabelIds,
                      isTiledDiff,
                    );
                  return (
                    <div className={styles.optionRow} key={item.id}>
                      <Checkbox
                        value={item.id}
                        className={styles.checkbox}
                        disabled={
                          !selectedLabelIds.includes(item.id) &&
                          selectedLabelIds.length >= LABELS_STROKE_DASH.length
                        }
                      >
                        {item.name}
                      </Checkbox>
                      {!showMatting && (
                        <>
                          <Slider
                            // @ts-ignore
                            tooltip={{
                              open: true,
                              prefixCls: 'slider-tooltip',
                              getPopupContainer: () =>
                                document.getElementById('labelsPanel')!,
                            }}
                            className={styles.slider}
                            range
                            min={0}
                            max={1}
                            value={item.confidenceRange}
                            step={0.01}
                            onChange={(value) =>
                              onLabelConfidenceChange(index, value)
                            }
                            disabled={item.source !== LABEL_SOURCE.pred}
                          />
                          <div
                            style={{
                              width: '100px',
                              marginLeft: '40px',
                            }}
                          >
                            {selectedLabelIds.includes(item.id) && (
                              <svg className={styles.lineStyle}>
                                <line
                                  x1={5}
                                  y1={5}
                                  x2={70}
                                  y2={5}
                                  strokeDasharray={strokeDash.join(',')}
                                  strokeWidth={`${lineWidth}pt`}
                                />
                                {showKeyPoints && (
                                  <>
                                    <circle
                                      cx={5}
                                      cy={5}
                                      r={3}
                                      stroke="black"
                                      strokeWidth={1}
                                      fill={`rgba(133, 208, 252, ${colorAplha})`}
                                    />
                                    <circle
                                      cx={70}
                                      cy={5}
                                      r={3}
                                      stroke="black"
                                      strokeWidth={1}
                                      fill={`rgba(133, 208, 252, ${colorAplha})`}
                                    />
                                  </>
                                )}
                              </svg>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </Space>
            </Checkbox.Group>
          </div>
          {!showMatting && !disableChangeDiffMode && (
            <div className={styles.modes}>
              <Radio.Group
                onChange={(e: RadioChangeEvent) =>
                  onLabelsDiffModeChange(e.target.value)
                }
                value={diffMode}
              >
                {LABEL_DIFF_MODE_OPTIONS.map((item) => (
                  <Radio key={item} value={item}>
                    {localeText(item)}
                  </Radio>
                ))}
              </Radio.Group>
            </div>
          )}
        </div>
      }
    >
      {localeText('dataset.detail.labelSets')}
    </DropdownSelector>
  );
};

export default LabelOptions;
