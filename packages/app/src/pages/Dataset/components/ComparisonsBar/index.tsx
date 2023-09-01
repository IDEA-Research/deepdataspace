import React, { useState } from 'react';
import { useModel } from '@umijs/max';
import { Button, Checkbox, Modal, Radio, Select, Slider, message } from 'antd';
import DropdownSelector from '@/components/DropdownSelector';
import styles from './index.less';
import {
  COMPARE_RESULT,
  COMPARISONS_SORTBY_OPTOIONS,
  LABEL_DIFF_MODE_OPTIONS,
  LABEL_SOURCE,
} from '@/constants';
import { useLocale } from 'dds-utils/locale';
import { fixedFloatNum } from 'dds-utils/digit';

const ComparisonsBar: React.FC = () => {
  const { localeText } = useLocale();
  const { comparisons, labels } = useModel('dataset.common', (model) => ({
    comparisons: model.pageState.comparisons,
    labels: model.pageData.filters.labels,
  }));
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(
    undefined,
  );
  const {
    showAnalysisModal,
    closeAnalysisModal,
    compareLabelSet,
    exitComparisons,
    onFilterComparisonsPrecision,
  } = useModel('dataset.comparisons');

  // TODO: judge whether support analysis
  const supportAnalysis =
    labels.length > 0 &&
    labels.find((item) => item.source === LABEL_SOURCE.gt) &&
    labels.find((item) => item.comparePrecisions?.length > 0);

  const gtLabel = labels.find((item) => item.source === LABEL_SOURCE.gt);
  const predLabels = labels
    .filter((item) => item.comparePrecisions?.length > 0)
    .map((item) => ({
      value: item.id,
      label: item.name,
    }));

  const changeLabelSelected = (item: string) => {
    setSelectedLabel(item);
  };

  const toAnalysis = () => {
    if (!supportAnalysis) {
      message.warning(localeText('dataset.toAnalysis.unSupportWarn'));
      return;
    }

    const selected = labels.find((item) => item.id === selectedLabel);
    if (!selectedLabel || !selected) {
      message.warning(localeText('dataset.toAnalysis.unSelectWarn'));
      return;
    }
    closeAnalysisModal();
    compareLabelSet(selected);
  };

  return (
    <>
      <Modal
        title={localeText('dataset.detail.analModal.title')}
        footer={[
          <Button key="analysis" type="primary" onClick={toAnalysis}>
            {localeText('dataset.detail.analModal.btn')}
          </Button>,
        ]}
        open={showAnalysisModal}
        onCancel={closeAnalysisModal}
      >
        <div className={styles.anlysisModal}>
          <div>{gtLabel?.name}</div>
          <div className={styles.vs}>vs</div>
          <Select
            placeholder={localeText('dataset.detail.analModal.select')}
            style={{ width: 240 }}
            onChange={changeLabelSelected}
            options={predLabels}
            value={selectedLabel}
          />
        </div>
      </Modal>
      {comparisons && (
        <div className={styles.tools}>
          <div className={styles.toolsBar}>
            <div className={styles.selector}>
              <div className={styles.title}>
                {localeText('dataset.detail.analModal.sort')} :
              </div>
              {/* orderby filter */}
              <DropdownSelector
                data={COMPARISONS_SORTBY_OPTOIONS}
                value={comparisons.orderBy}
                filterOptionName={(option) => option.name}
                filterOptionValue={(option) => option.value}
                onChange={(value) =>
                  onFilterComparisonsPrecision('orderBy', value)
                }
                ghost={false}
                type="default"
              >
                {
                  COMPARISONS_SORTBY_OPTOIONS.find(
                    (item) => item.value === comparisons.orderBy,
                  )?.name
                }
              </DropdownSelector>
              <span className={styles.text}>with Confidence Precision</span>
              {/* precision filter */}
              <DropdownSelector
                data={comparisons.label.comparePrecisions}
                value={comparisons.precision}
                filterOptionName={(option) =>
                  `${option.precision} (Threshold: ${fixedFloatNum(
                    option.threshold,
                  )})`
                }
                filterOptionValue={(option) => option.precision}
                onChange={(value) =>
                  onFilterComparisonsPrecision('precision', value)
                }
                ghost={false}
                type="default"
              >
                {comparisons.precision}
                {` (Threshold: ${fixedFloatNum(
                  comparisons.label.comparePrecisions.find(
                    (item) => item.precision === comparisons.precision,
                  )?.threshold || 0,
                )})`}
              </DropdownSelector>
            </div>
            <div>
              <span className={styles.vsText}>
                GroundTruch <span className={styles.vs}>VS</span>{' '}
                {comparisons?.label.name}
              </span>
              <Button onClick={exitComparisons}>
                {localeText('dataset.detail.analModal.exit')}
              </Button>
            </div>
          </div>
          <div className={styles.displayBar}>
            <div className={styles.title}>
              {localeText('dataset.detail.analModal.display')} :
            </div>
            <Radio.Group
              options={LABEL_DIFF_MODE_OPTIONS.map((item) => ({
                label: `${localeText(item)}${localeText(
                  'dataset.detail.analModal.diff',
                )}`,
                value: item,
              }))}
              onChange={(event) =>
                onFilterComparisonsPrecision('diffMode', event.target.value)
              }
              value={comparisons.diffMode}
              optionType="button"
            />
            <div className={styles.splitLine} />
            <Checkbox.Group
              value={comparisons.displays}
              onChange={(value) =>
                onFilterComparisonsPrecision('displays', value)
              }
            >
              <span className={styles.optionsTitle}>GroundTruth :</span>
              <Checkbox value={LABEL_SOURCE.gt}>Matched</Checkbox>
              <Checkbox value={COMPARE_RESULT.fn}>FN</Checkbox>
              <div className={styles.splitLineLeft} />
              <span className={styles.optionsTitle}>Prediction :</span>
              <Checkbox value={LABEL_SOURCE.pred}>Matched</Checkbox>
              <Checkbox value={COMPARE_RESULT.fp}>FP</Checkbox>
            </Checkbox.Group>
            <div className={styles.splitLineLeft} />
            <div className={styles.scoreSlider}>
              Confidence threshold:
              <Slider
                className={styles.slider}
                min={0}
                max={1}
                value={comparisons.score}
                step={0.01}
                onChange={(value) =>
                  onFilterComparisonsPrecision('score', value)
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComparisonsBar;
