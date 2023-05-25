import React, { useMemo } from 'react';
import { useModel } from '@umijs/max';
import usePageModelLifeCycle from '@/hooks/usePageModelLifeCycle';
import { PageContainer } from '@ant-design/pro-components';
import { List, Pagination, Spin } from 'antd';
import Masonry from 'react-masonry-component';
import Header from './components/Header';
import FlagToolsBar from './components/FlagToolsBar';
import Preview from '@/components/Preview';
import { ReactComponent as FlagIcon } from '@/assets/svg/flag.svg';
import { IMG_FLAG, IMG_FLAG_COLOR, IMG_PAGE_SIZE_OPTIONS } from '@/constants';
import { doubleImgList } from '@/utils/annotation';
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
    renderAnnotationImage,
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
                    {renderAnnotationImage({
                      wrapWidth: itemWidth,
                      wrapHeight: flagTools ? (itemWidth * 3) / 4 : undefined,
                      minHeight: (itemWidth * 3) / 4,
                      data: item,
                    })}
                  </div>
                  {item.flag > 0 && (
                    <FlagIcon
                      fill={IMG_FLAG_COLOR[item.flag as IMG_FLAG]}
                      className={styles.flagIcon}
                    />
                  )}
                  {displayOptionsResult.showImgDesc && (
                    <div className={styles.label}> {item.desc} </div>
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
        <div className={styles.pagination}>
          <Pagination
            current={pageState.page}
            pageSize={pageState.pageSize}
            total={pageData.total}
            showSizeChanger
            showQuickJumper
            pageSizeOptions={IMG_PAGE_SIZE_OPTIONS}
            onChange={(page) => onPageChange(page)}
            onShowSizeChange={onPageSizeChange}
          />
        </div>
      )}
      {/* Preview */}
      <Preview
        visible={pageState.previewIndex >= 0 && !isSingleAnnotation}
        onClose={exitPreview}
        list={imgList}
        current={pageState.previewIndex}
        onCurrentChange={onPreviewIndexChange}
        renderAnnotationImage={renderAnnotationImage}
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
