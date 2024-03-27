import React from 'react';
import { useModel } from '@umijs/max';
import { Button, Radio, RadioChangeEvent } from 'antd';
import { ArrowLeftOutlined, FundViewOutlined } from '@ant-design/icons';
import { ReactComponent as RandomIcon } from '@/assets/svg/random.svg';
import { AnnotationType } from '@/constants';
import { backPath } from 'dds-utils/url';
import CategoryFilter from '@/components/CategoryFilter';
import LabelOptions from '@/components/LabelOptions';
import DisplayOptions from '@/components/DisplayOptions';
import { ColumnSettings } from 'dds-components';
import { useLocale } from 'dds-utils/locale';
import styles from './index.less';
import { QueryMode } from '@/models/dataset/type';

const Header: React.FC = () => {
  const { localeText } = useLocale();
  const {
    filters,
    filterValues,
    comparisons,
    isTiledDiff,
    cloumnCount,
    queryMode,
    loadImgList,
  } = useModel('dataset.common', (model) => ({
    isTiledDiff: model.isTiledDiff,
    cloumnCount: model.pageState.cloumnCount,
    filters: model.pageData.filters,
    filterValues: model.pageState.filterValues,
    comparisons: model.pageState.comparisons,
    queryMode: model.pageState.queryMode,
    loadImgList: model.loadImgList,
  }));
  const {
    onCategoryChange,
    onDisplayOptionsChange,
    onDisplayAnnotationTypeChange,
    onLabelsChange,
    onLabelConfidenceChange,
    onLabelsDiffModeChange,
    onColumnCountChange,
    onQueryModeChanged,
  } = useModel('dataset.filters');
  const { openAnalysisModal } = useModel('dataset.comparisons');

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
        {!comparisons ? (
          <>
            <Radio.Group
              value={queryMode}
              buttonStyle="solid"
              className={styles.dropBtn}
              onChange={(e: RadioChangeEvent) =>
                onQueryModeChanged(e.target.value)
              }
            >
              <Radio.Button value={QueryMode.pagination}>
                {localeText('dataset.detail.pagination')}
              </Radio.Button>
              <Radio.Button value={QueryMode.random}>
                {localeText('dataset.detail.random')}
              </Radio.Button>
            </Radio.Group>
            {queryMode === QueryMode.random && (
              <Button
                type="text"
                icon={<RandomIcon />}
                className={styles.randomBtn}
                onClick={() => loadImgList()}
              >
                {localeText('dataset.detail.randomQuery')}
              </Button>
            )}
          </>
        ) : null}
      </div>
      <div className={styles.rightFilters}>
        {/* labels options */}
        {!comparisons ? (
          <LabelOptions
            showMatting={showMatting}
            showKeyPoints={showKeyPoints}
            isTiledDiff={isTiledDiff}
            labels={labels}
            selectedLabelIds={selectedLabelIds}
            diffMode={filterValues.diffMode}
            onLabelsChange={onLabelsChange}
            onLabelConfidenceChange={onLabelConfidenceChange}
            onLabelsDiffModeChange={onLabelsDiffModeChange}
          />
        ) : null}
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
        {!comparisons ? (
          <Button
            className={styles.dropBtn}
            type="primary"
            onClick={openAnalysisModal}
          >
            <FundViewOutlined />
            {localeText('dataset.detail.analysis')}
          </Button>
        ) : null}
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
