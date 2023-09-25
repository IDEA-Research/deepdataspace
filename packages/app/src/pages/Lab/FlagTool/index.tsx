import React, { useMemo } from 'react';
import { useModel } from '@umijs/max';
import { usePageModelLifeCycle } from 'dds-hooks';
import { PageContainer } from '@ant-design/pro-components';
import { List, Spin } from 'antd';
import Masonry from 'react-masonry-component';
import Header from './components/Header';
import FlagToolsBar from './components/FlagToolsBar';
import { AnnotateView, AnnotatePreview } from 'dds-components/Annotator';
import { DynamicPagination } from 'dds-components';
import { ReactComponent as FlagIcon } from '@/assets/svg/flag.svg';
import { IMG_FLAG, IMG_FLAG_COLOR } from '@/constants';
import { doubleImgList } from '@/utils/datasets';
import styles from './index.less';
import { useSize } from 'ahooks';

const Page: React.FC = () => {
  const {
    pageState,
    onInitPageState,
    pageData,
    loading,
    displayLabelIds,
    isTiledDiff,
    displayOptionsResult,
    onPageContentLoaded,
    onPreviewIndexChange,
    exitPreview,
    displayObjectsFilter,
    getCustomObjectStyles,
  } = useModel('dataset.common');
  const {
    onPageDidMount,
    onPageWillUnmount,
    clickItem,
    doubleClickItem,
    onPageChange,
    onPageSizeChange,
  } = useModel('Lab.FlagTool.model');
  const { cloumnCount, isSingleAnnotation, filterValues, flagTools } =
    pageState;
  usePageModelLifeCycle({
    onPageDidMount,
    onPageWillUnmount,
    onInitPageState,
    pageState,
  });

  const size = useSize(() => document.querySelector('.ant-pro-page-container'));
  const listContentWidth = size?.width ? size.width - 80 : 0;

  const imgList = useMemo(
    () =>
      isTiledDiff
        ? doubleImgList(
            pageData.imgList,
            displayLabelIds,
            filterValues.displayAnnotationType,
          )
        : pageData.imgList,
    [isTiledDiff, pageData.imgList, displayLabelIds],
  );
  const realCloumnCount = isTiledDiff
    ? imgList.length / (pageData.imgList.length || 1)
    : cloumnCount;
  const itemWidth = listContentWidth
    ? (listContentWidth - 16 * (realCloumnCount - 1)) / (realCloumnCount || 1)
    : 0;

  return (
    <PageContainer
      ghost
      className={styles.page}
      pageHeaderRender={() => (
        <>
          <Header />
          <FlagToolsBar />
        </>
      )}
      fixedHeader
    >
      {/* Image list */}
      <div className={styles.container}>
        <List loading={loading}>
          {imgList.length ? (
            // @ts-ignore
            <Masonry
              options={{
                gutter: 16,
                horizontalOrder: true,
                transitionDuration: 0,
              }}
              onImagesLoaded={() => onPageContentLoaded()}
            >
              {imgList.map((item, index) => (
                <div
                  className={styles.item}
                  style={{ width: itemWidth }}
                  key={`${item.id}_${index}`}
                  onClick={() => clickItem(index)}
                  onDoubleClick={() => doubleClickItem(index)}
                >
                  <div
                    className={styles.itemImgWrap}
                    style={{
                      width: itemWidth,
                      height: flagTools ? (itemWidth * 3) / 4 : 'auto',
                    }}
                  >
                    <AnnotateView
                      categories={pageData.filters.categories}
                      data={item}
                      wrapWidth={itemWidth}
                      wrapHeight={flagTools ? (itemWidth * 3) / 4 : undefined}
                      minHeight={(itemWidth * 3) / 4}
                      objectsFilter={displayObjectsFilter}
                      getCustomObjectStyles={getCustomObjectStyles}
                      displayOptionsResult={displayOptionsResult}
                      displayAnnotationType={
                        pageState.filterValues.displayAnnotationType
                      }
                    />
                  </div>
                  {item.flag > 0 && (
                    <FlagIcon
                      fill={IMG_FLAG_COLOR[item.flag as IMG_FLAG]}
                      className={styles.flagIcon}
                    />
                  )}
                  {displayOptionsResult.showImgDesc && (
                    <div className={styles.label}>
                      {' '}
                      {item.caption || item.desc}{' '}
                    </div>
                  )}
                  {flagTools && item.selected ? (
                    <div className={styles.itemSelectedMask} />
                  ) : null}
                </div>
              ))}
            </Masonry>
          ) : null}
        </List>
      </div>
      {/* Pagination */}
      {!loading && (
        <DynamicPagination
          current={pageState.page}
          size={pageState.pageSize}
          total={pageData.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
      {/* Preview */}
      <AnnotatePreview
        visible={pageState.previewIndex >= 0 && !isSingleAnnotation}
        categories={pageData.filters.categories}
        list={imgList}
        current={pageState.previewIndex}
        onCancel={exitPreview}
        onNext={async () => {
          if (pageState.previewIndex < imgList.length - 1)
            onPreviewIndexChange(pageState.previewIndex + 1);
        }}
        onPrev={async () => {
          if (pageState.previewIndex > 0)
            onPreviewIndexChange(pageState.previewIndex - 1);
        }}
        objectsFilter={displayObjectsFilter}
        getCustomObjectStyles={getCustomObjectStyles}
        displayOptionsResult={displayOptionsResult}
        displayAnnotationType={pageState.filterValues.displayAnnotationType}
      />
      {/* Screen loading */}
      {pageData.screenLoading ? (
        <div className={styles.pageSpin}>
          <Spin spinning tip={pageData.screenLoading} />
        </div>
      ) : null}
    </PageContainer>
  );
};

export default Page;
