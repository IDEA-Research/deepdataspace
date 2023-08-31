import React from 'react';
import { useModel } from '@umijs/max';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AnnotationType, LabelDiffMode } from '@/constants';
import { backPath } from 'dds-utils/url';
import CategoryFilter from '@/components/CategoryFilter';
import LabelOptions from '@/components/LabelOptions';
import DisplayOptions from '@/components/DisplayOptions';
import { ColumnSettings } from 'dds-components';
import styles from './index.less';

const Header: React.FC = () => {
  const { filters, filterValues, comparisons, isTiledDiff, cloumnCount } =
    useModel('dataset.common', (model) => ({
      isTiledDiff: model.isTiledDiff,
      cloumnCount: model.pageState.cloumnCount,
      filters: model.pageData.filters,
      filterValues: model.pageState.filterValues,
      comparisons: model.pageState.comparisons,
    }));
  const {
    onCategoryChange,
    onDisplayOptionsChange,
    onDisplayAnnotationTypeChange,
    onLabelsChange,
    onLabelConfidenceChange,
    onLabelsDiffModeChange,
    onColumnCountChange,
  } = useModel('dataset.filters');

  const { labels } = filters;
  const { selectedLabelIds } = filterValues;
  const showMatting =
    filterValues.displayAnnotationType === AnnotationType.Matting;
  const showKeyPoints =
    filterValues.displayAnnotationType === AnnotationType.KeyPoints;

  return (
    <div className={styles.fixMenu} id="filterWrap">
      <div className={styles.filter}>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          className={styles.backBtn}
          onClick={() => backPath('/dataset')}
        />
        <CategoryFilter
          categoryId={filterValues.categoryId}
          categories={filters.categories}
          onCategoryChange={onCategoryChange}
        />
      </div>
      <div className={styles.rightFilters}>
        {/* labels options */}
        <LabelOptions
          showMatting={showMatting}
          showKeyPoints={showKeyPoints}
          isTiledDiff={isTiledDiff}
          labels={labels}
          selectedLabelIds={selectedLabelIds}
          diffMode={LabelDiffMode.Overlay}
          disableChangeDiffMode
          onLabelsChange={onLabelsChange}
          onLabelConfidenceChange={onLabelConfidenceChange}
          onLabelsDiffModeChange={onLabelsDiffModeChange}
        />
        {/* display options */}
        <DisplayOptions
          annotationTypes={filters.annotationTypes}
          disableChangeType={!!comparisons}
          displayAnnotationType={filterValues.displayAnnotationType}
          displayOptions={filters.displayOptions}
          displayOptionsValue={filterValues.displayOptions}
          onDisplayAnnotationTypeChange={onDisplayAnnotationTypeChange}
          onDisplayOptionsChange={onDisplayOptionsChange}
        />
        {/* settings */}
        {!isTiledDiff && (
          <ColumnSettings
            cloumnCount={cloumnCount}
            onColumnCountChange={onColumnCountChange}
          />
        )}
      </div>
    </div>
  );
};

export default Header;
