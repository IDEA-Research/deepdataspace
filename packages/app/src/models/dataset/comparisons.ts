/**
 * Comparison analysis (FN/FP)
 */
import { useState } from 'react';
import { useModel } from '@umijs/max';
import {
  LabelDiffMode,
  COMPARISONS_SORTBY,
  COMPARISONS_DISPLAY_OPTOIONS,
  AnnotationType,
} from '@/constants';
import { Comparisons, QueryMode } from './type';
import { floorFloatNum } from 'dds-utils/digit';
import { NsDataSet } from '@/types/dataset';

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
  const compareLabelSet = (label: NsDataSet.Label) => {
    setPageState((s) => {
      s.queryMode = QueryMode.pagination;
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
  };

  const exitComparisons = () => {
    setPageState((s) => {
      s.page = 1;
      s.comparisons = undefined;
    });
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
