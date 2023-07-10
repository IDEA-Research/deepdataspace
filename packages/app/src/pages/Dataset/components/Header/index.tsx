import React, { useState } from 'react';
import { useModel } from '@umijs/max';
import { Button } from 'antd';
import { ArrowLeftOutlined, FundViewOutlined } from '@ant-design/icons';
import { AnnotationType } from '@/constants';
import { backPath } from '@/utils/url';
import CategoryFilter from '@/components/CategoryFilter';
import LabelOptions from '@/components/LabelOptions';
import DisplayOptions from '@/components/DisplayOptions';
import ColumnSettings from '@/components/ColumnSettings';
import { useLocale } from '@/locales/helper';
import EditDatasetModal from '@/pages/DatasetList/components/EditDatasetModal';
import ImportImgsModal from '@/pages/DatasetList/components/ImportImgsModal';
import styles from './index.less';

const Header: React.FC = () => {
  const { localeText } = useLocale();
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
  const { openAnalysisModal } = useModel('dataset.comparisons');
  const { withLoginCheck } = useModel('user');

  const { labels } = filters;
  const { selectedLabelIds } = filterValues;
  const showMatting =
    filterValues.displayAnnotationType === AnnotationType.Matting;
  const showKeyPoints =
    filterValues.displayAnnotationType === AnnotationType.KeyPoints;
  const [openEditModal, setEditModalOpen] = useState(false);
  const [openImportModal, setImportModalOpen] = useState(false);

  return (
    <div className={styles.fixMenu} id="filterWrap">
      <div className={styles.filter}>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          className={styles.backBtn}
          onClick={() => backPath('/dataset')}
        />
        <div className={styles.editGroup}>
          <Button
            onClick={withLoginCheck(() => {
              setEditModalOpen(true);
            })}
          >
            {localeText('dataset.edit.modal.title')}
          </Button>

          <Button
            onClick={withLoginCheck(() => {
              setImportModalOpen(true);
            })}
          >
            {localeText('dataset.import.edit.modal.title')}
          </Button>
        </div>
        <CategoryFilter
          categoryId={filterValues.categoryId}
          categories={filters.categories}
          onCategoryChange={onCategoryChange}
        />
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
      <EditDatasetModal open={openEditModal} setOpen={setEditModalOpen} />
      <ImportImgsModal open={openImportModal} setOpen={setImportModalOpen} />
    </div>
  );
};

export default Header;
