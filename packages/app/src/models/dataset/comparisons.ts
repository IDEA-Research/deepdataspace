/**
 * Comparison analysis (FN/FP)
 */
import { useState } from 'react';
import { useModel } from '@umijs/max';
import { decamelize } from 'humps';
import {
  LabelDiffMode,
  COMPARISONS_SORTBY,
  COMPARISONS_DISPLAY_OPTOIONS,
  AnnotationType,
} from '@/constants';
import { Comparisons } from './type';
import { floorFloatNum } from '@/utils/digit';
import { reportEvent } from '@/logs';
import { DATA } from '@/services/type';

export default () => {
  // common
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const { setPageState } = useModel('dataset.common');

  const openAnalysisModal = () => {
    setShowAnalysisModal(true);
  };

  const closeAnalysisModal = () => {
    setShowAnalysisModal(false);
  };

  /** Enter the comparison analysis. */
  const compareLabelSet = (label: DATA.Label) => {
    setPageState((s) => {
      s.page = 1;
      s.filterValues.displayAnnotationType = AnnotationType.Detection; // just support detection now
      s.flagTools = undefined;
      s.comparisons = {
        label,
        orderBy: COMPARISONS_SORTBY.fn,
        precision: label.comparePrecisions[0].precision,
        displays: COMPARISONS_DISPLAY_OPTOIONS.map((item) => item.value),
        diffMode: LabelDiffMode.Overlay,
        score: floorFloatNum(label.comparePrecisions[0].threshold, 2),
      };
    });
    reportEvent('dataset_enter_comparisons');
  };

  const exitComparisons = () => {
    setPageState((s) => {
      s.page = 1;
      s.comparisons = undefined;
    });
    reportEvent('dataset_exit_comparisons');
  };

  const onFilterComparisonsPrecision = (
    type: keyof Comparisons,
    value: any,
  ) => {
    setPageState((s) => {
      if (!s.comparisons) return;
      // @ts-ignore
      s.comparisons[type] = value;

      if (type === 'precision') {
        // Reset the score when changing precision.
        const prec = s.comparisons.label.comparePrecisions.find(
          (item) => item.precision === value,
        );
        if (prec) s.comparisons.score = floorFloatNum(prec.threshold, 2);
      }
      reportEvent(`dataset_comparisons_filter_${decamelize(type)}`, {
        [type]: value,
      });
    });
  };

  return {
    showAnalysisModal,
    openAnalysisModal,
    closeAnalysisModal,
    compareLabelSet,
    exitComparisons,
    onFilterComparisonsPrecision,
  };
};
