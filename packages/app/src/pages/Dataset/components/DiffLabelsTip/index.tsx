import React from 'react';
import { useModel } from '@umijs/max';
import { getDiffLabels } from '@/utils/annotation';
import styles from './index.less';

export interface IProps {
  itemWidth: number;
}

const DiffLabelsTip: React.FC<IProps> = ({ itemWidth }) => {
  const {
    comparisons,
    isTiledDiff,
    labels,
    selectedLabelIds,
    displayAnnotationType,
  } = useModel('dataset.common', (model) => ({
    selectedLabelIds: model.pageState.filterValues.selectedLabelIds,
    displayAnnotationType: model.pageState.filterValues.displayAnnotationType,
    labels: model.pageData.filters.labels,
    comparisons: model.pageState.comparisons,
    isTiledDiff: model.isTiledDiff,
  }));

  if (comparisons || selectedLabelIds.length <= 1) return null;

  const tiledLabels = getDiffLabels(
    labels,
    selectedLabelIds,
    displayAnnotationType,
  );

  return (
    <div className={styles.toolsBar}>
      {tiledLabels.map((item, index) => (
        <React.Fragment key={item.id}>
          {!isTiledDiff && index > 0 && <span className={styles.vs}>VS</span>}
          <span
            className={styles.name}
            style={{
              width:
                isTiledDiff && index + 1 !== tiledLabels.length
                  ? itemWidth
                  : 'auto',
            }}
          >
            {item.name}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default DiffLabelsTip;
