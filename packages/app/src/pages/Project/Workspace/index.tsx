import React, { useMemo } from 'react';
import { useModel } from '@umijs/max';
import usePageModelLifeCycle from '@/hooks/usePageModelLifeCycle';
import { PageContainer } from '@ant-design/pro-components';
import { Button, List, Spin, Tabs } from 'antd';
import VirtualList, { ListRef } from 'rc-virtual-list';
import useWindowResize from '@/hooks/useWindowResize';
import styles from './index.less';
import { DATA } from '@/services/type';
import AnnotationImage from '@/components/AnnotationImage';
import { chunk } from 'lodash';
import DropdownSelector from '@/components/DropdownSelector';
import { AnnotationType } from '@/constants';
import { LabelImage, LoadImagesType } from '../models/workspace';
import Edit from '@/components/Edit';
import { EditorMode } from '@/components/Edit/type';
import { ETaskImageStatus, ETaskStatus } from '../constants';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { EProjectAction } from '../models/auth';
import { useSize } from 'ahooks';
import { backPath } from '@/utils/url';
import { useLocale } from '@/locales/helper';

const Page: React.FC = () => {
  const { checkPermission } = useModel('Project.auth');
  const {
    pageData,
    pageState,
    loading,
    loadPageData,
    onInitPageState,
    projectId,
    curRole,
    userRoles,
    tabItems,
    labelImages,
    categoryColors,
    isEditorVisible,
    onStatusTabChange,
    onRoleChange,
    clickItem,
    loadMore,
    onExitEditor,
    onNextImage,
    onPrevImage,
    onLabelSave,
    onReviewResult,
    onEnterEdit,
    onStartLabel,
    onStartRework,
    onStartReview,
  } = useModel('Project.workspace');
  usePageModelLifeCycle({ onInitPageState, pageState });
  const { localeText } = useLocale();

  const { height } = useWindowResize();
  const size = useSize(() => document.querySelector('.ant-pro-page-container'));
  const listContentWidth = size?.width ? size.width - 80 : 0;
  const listRef = React.useRef<ListRef>(null);

  const realCloumnCount = 5;
  const itemWidth = listContentWidth
    ? (listContentWidth - 16 * (realCloumnCount - 1)) / (realCloumnCount || 1)
    : 0;
  const itemHeight = (itemWidth * 3) / 4;
  const containerHeight = height - 46;

  const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    if (
      Math.floor(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
      Math.floor(containerHeight)
    ) {
      loadMore();
    }
  };

  const imageList = useMemo(
    () =>
      chunk(labelImages, realCloumnCount).map((item, index) => ({
        index,
        lineImgs: item,
      })),
    [pageData.list],
  );

  const actionElements = useMemo(() => {
    if (
      pageData.editorMode !== EditorMode.View ||
      pageState.taskStatus !== ETaskStatus.Working
    ) {
      return [];
    }
    if (checkPermission(userRoles, EProjectAction.StartLabel)) {
      if (pageState.status === ETaskImageStatus.Labeling) {
        return [
          <Button key="label" type="primary" onClick={onStartLabel}>
            {localeText('proj.workspace.eTask.startLabel')}
          </Button>,
        ];
      }
      if (pageState.status === ETaskImageStatus.Reviewing) {
        return [
          <Button key="edit" type="primary" onClick={onEnterEdit}>
            {localeText('proj.workspace.eTask.edit')}
          </Button>,
        ];
      }
      if (pageState.status === ETaskImageStatus.Rejected) {
        return [
          <Button key="rework" type="primary" onClick={onStartRework}>
            {localeText('proj.workspace.eTask.startRework')}
          </Button>,
        ];
      }
      return [];
    } else if (
      checkPermission(userRoles, EProjectAction.StartReview) &&
      pageState.status === ETaskImageStatus.Reviewing
    ) {
      return [
        <Button key="review" type="primary" onClick={onStartReview}>
          {localeText('proj.workspace.eTask.startReview')}
        </Button>,
      ];
    }
    return [];
  }, [pageState.status, pageState.taskStatus, pageData.editorMode, userRoles]);

  return (
    <PageContainer
      ghost
      className={styles.page}
      fixedHeader
      pageHeaderRender={() => (
        <div className={styles.header}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            className={styles.backBtn}
            onClick={() => backPath(`/project/${projectId}`)}
          />
          <Tabs
            className={styles.tabs}
            activeKey={pageState.status}
            onChange={onStatusTabChange}
            items={tabItems}
            tabBarExtraContent={
              <div>
                <Button
                  type="text"
                  className={styles.btn}
                  icon={<ReloadOutlined />}
                  onClick={() => loadPageData()}
                />
                {curRole &&
                  curRole?.labelNumWaiting > 0 &&
                  pageState.taskStatus === ETaskStatus.Working &&
                  checkPermission(userRoles, EProjectAction.StartLabel) && (
                    <Button
                      type="primary"
                      className={styles.btn}
                      onClick={onStartLabel}
                    >
                      {localeText('proj.workspace.eProj.startLabeling')}
                    </Button>
                  )}
                {curRole &&
                  curRole?.reviewNumRejected > 0 &&
                  pageState.taskStatus === ETaskStatus.Working &&
                  checkPermission(userRoles, EProjectAction.StartLabel) && (
                    <Button
                      type="primary"
                      className={styles.btn}
                      onClick={onStartRework}
                    >
                      {localeText('proj.workspace.eProj.startRework')}
                    </Button>
                  )}
                {curRole &&
                  curRole?.reviewNumWaiting > 0 &&
                  pageState.taskStatus === ETaskStatus.Working &&
                  checkPermission(userRoles, EProjectAction.StartReview) && (
                    <Button
                      type="primary"
                      className={styles.btn}
                      onClick={onStartReview}
                    >
                      {localeText('proj.workspace.eProj.startReview')}
                    </Button>
                  )}
                <DropdownSelector<DATA.ProjectWorker, string>
                  data={pageData.taskRoles}
                  value={pageState.roleId || ''}
                  filterOptionName={(option: DATA.ProjectWorker) =>
                    `${option.userName} (${option.role})`
                  }
                  filterOptionValue={(option) => option.id}
                  onChange={onRoleChange}
                  ghost={false}
                  type="default"
                >
                  {localeText('proj.workspace.eProj.role')}: {curRole?.userName}
                  ({curRole?.role})
                </DropdownSelector>
              </div>
            }
          />
        </div>
      )}
    >
      {/* Image List */}
      <List loading={loading} className={styles.list}>
        {imageList.length > 0 && (
          <VirtualList<{ lineImgs: LabelImage[]; index: number }>
            ref={listRef}
            data={imageList}
            height={containerHeight}
            itemHeight={itemHeight + 16}
            itemKey="index"
            onScroll={onScroll}
          >
            {(line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                <div className={styles.line}>
                  {line.lineImgs.map((item, index) => (
                    <div
                      className={styles.item}
                      style={{ width: itemWidth }}
                      key={`${item.id}_${index}`}
                      onClick={() =>
                        clickItem(lineIndex * realCloumnCount + index)
                      }
                    >
                      <div
                        className={styles.itemImgWrap}
                        style={{
                          width: itemWidth,
                          height: itemHeight,
                        }}
                      >
                        <AnnotationImage
                          wrapWidth={itemWidth}
                          wrapHeight={itemHeight}
                          image={item}
                          objects={item.objects}
                          displayType={AnnotationType.Detection}
                          globalDisplayOptions={{
                            categoryColors,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {lineIndex === imageList.length - 1 &&
                  pageData.loadingImagesType === LoadImagesType.More && (
                    <Spin className={styles.bottomSpin} />
                  )}
              </React.Fragment>
            )}
          </VirtualList>
        )}
      </List>
      {/* Annotator */}
      {isEditorVisible && (
        <div className={styles.editor}>
          <Edit
            isSeperate={false}
            mode={pageData.editorMode}
            visible={isEditorVisible}
            categories={pageData.categoryList}
            list={labelImages}
            current={pageData.curIndex}
            pagination={{
              show:
                pageData.editorMode !== EditorMode.Review &&
                !(
                  pageData.editorMode === EditorMode.Edit &&
                  pageState.status === ETaskImageStatus.Reviewing
                ),
              total: pageData.total,
              customText:
                pageData.editorMode === EditorMode.Edit ? <></> : undefined,
              // Restrict jumping to the next page in label mode.
              customDisableNext:
                pageData.editorMode === EditorMode.Edit
                  ? !pageData.list[pageData.curIndex]?.labeled ||
                    pageData.curIndex >= pageData.total - 1
                  : undefined,
            }}
            actionElements={actionElements}
            onCancel={onExitEditor}
            onSave={onLabelSave}
            onReviewResult={onReviewResult}
            onEnterEdit={onEnterEdit}
            onNext={onNextImage}
            onPrev={onPrevImage}
          />
        </div>
      )}
    </PageContainer>
  );
};

export default Page;
