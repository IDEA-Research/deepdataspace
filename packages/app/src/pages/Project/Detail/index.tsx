import { ArrowLeftOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Popconfirm, Tag } from 'antd';
import { Link, useModel } from '@umijs/max';
import {
  EQaAction,
  ETaskImageStatus,
  ETaskStatus,
  TASK_STATUS_MAP,
} from '../constants';
import TableTags from '../components/TableTags';
import { usePageModelLifeCycle } from 'dds-hooks';
import { useLocale } from 'dds-utils/locale';
import TaskAssignModal from '../components/TaskAssignModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { EProjectAction } from '../models/auth';
import { ASSIGN_TYPE } from '../models/detail';
import { useState } from 'react';
import TaskProgress from '../components/TaskProgress';
import { useSize } from 'ahooks';
import styles from './index.less';
import { backPath, getUrlPathnameLastKey } from 'dds-utils/url';
import { NsProject } from '@/types/project';

const TaskList: React.FC = () => {
  const { user } = useModel('user');
  const { getUserRoles, checkPermission } = useModel('Project.auth');
  const [hideDescription, setHideDescription] = useState(false);
  const containerSize = useSize(
    document.querySelector('.ant-pro-grid-content'),
  );
  const {
    pageData,
    pageState,
    loading,
    onSelectChange,
    onPageChange,
    onInitPageState,
    setTaskDetailModalIndex,
    assignLeaders,
    assignWorker,
    restartTask,
    onChangeTaskResult,
  } = useModel('Project.detail');
  usePageModelLifeCycle({ onInitPageState, pageState });
  const { localeText } = useLocale();

  const getActions = (record: NsProject.ProjectTask, index: number) => {
    if (!pageData.projectDetail) return [];

    const actions = [];
    const userRoles = getUserRoles(pageData.projectDetail, record);
    if (checkPermission(userRoles, EProjectAction.AssignLeader)) {
      actions.push(
        <a
          key="assignLeader"
          style={{ color: '#2db7f5' }}
          onClick={() => assignLeaders([record.id])}
        >
          {localeText('proj.table.detail.action.assignLeader')}
        </a>,
      );
    }

    const ableToAssignLabeler =
      checkPermission(userRoles, EProjectAction.AssignLabeler) &&
      pageData.projectDetail.labelTimes > 0 &&
      record.labelers.length <= 0;
    const ableToAssignReviewer =
      checkPermission(userRoles, EProjectAction.AssignReviewer) &&
      pageData.projectDetail.reviewTimes > 0 &&
      record.reviewers.length <= 0;
    if (ableToAssignLabeler || ableToAssignReviewer) {
      const types: ASSIGN_TYPE[] = [];
      if (ableToAssignLabeler) types.push(ASSIGN_TYPE.labeler);
      if (ableToAssignReviewer) types.push(ASSIGN_TYPE.reviewer);
      actions.push(
        <a
          key="assignWorker"
          style={{ color: '#2db7f5' }}
          onClick={() => assignWorker(record, types)}
        >
          {localeText('proj.table.detail.action.assignWorker')}
        </a>,
      );
    }

    if (record.labelers.length || record.reviewers.length) {
      actions.push(
        <a key="detail" onClick={() => setTaskDetailModalIndex(index)}>
          {localeText('proj.table.detail.action.detail')}
        </a>,
      );
    }

    if (
      checkPermission(userRoles, EProjectAction.RestartTask) &&
      record.status === ETaskStatus.Rejected
    ) {
      actions.push(
        <a
          key="restart"
          style={{ color: '#4fbb30' }}
          onClick={() => restartTask(record)}
        >
          {localeText('proj.table.detail.action.restart')}
        </a>,
      );
    }

    if (checkPermission(userRoles, EProjectAction.TaskQa)) {
      if (
        record.status === ETaskStatus.Reviewing ||
        record.status === ETaskStatus.Rejected
      ) {
        actions.push(
          <a
            key="accept"
            style={{ color: '#4fbb30' }}
            onClick={() =>
              onChangeTaskResult(
                record,
                record.status === ETaskStatus.Rejected
                  ? EQaAction.ForceAccept
                  : EQaAction.Accept,
              )
            }
          >
            {localeText('proj.table.detail.action.accept')}
          </a>,
        );
      }
      if (record.status === ETaskStatus.Reviewing) {
        actions.push(
          <Popconfirm
            key="reject"
            title={localeText('proj.table.detail.action.reject.tips')}
            onConfirm={() => onChangeTaskResult(record, EQaAction.Reject)}
          >
            <a key="reject" style={{ color: 'red' }}>
              {localeText('proj.table.detail.action.reject')}
            </a>
          </Popconfirm>,
        );
      }
    }

    const getWorkspaceUrl = (states?: object) => {
      const workspaceUrl = `/project/task/workspace?projectId=${getUrlPathnameLastKey()}&taskId=${
        record.id
      }`;
      const pageState = {
        taskStatus: record.status,
        ...states,
      };
      return `${workspaceUrl}&pageState=${encodeURIComponent(
        JSON.stringify(pageState),
      )}`;
    };

    if (checkPermission(userRoles, EProjectAction.View)) {
      actions.push(
        <Link key="view" to={getWorkspaceUrl()}>
          {localeText('proj.table.detail.action.view')}
        </Link>,
      );
    }
    if (
      checkPermission(userRoles, EProjectAction.StartLabel) &&
      record.status === ETaskStatus.Working
    ) {
      const roleId = record.labelers.find(
        (item) => item.userId === user.userId,
      )?.id;
      actions.push(
        <Link
          key="StartLabel"
          to={getWorkspaceUrl({
            status: ETaskImageStatus.Labeling,
            roleId,
          })}
        >
          {localeText('proj.table.detail.action.startLabel')}
        </Link>,
      );
    }
    if (
      checkPermission(userRoles, EProjectAction.StartReview) &&
      record.status === ETaskStatus.Working
    ) {
      const roleId = record.reviewers.find(
        (item) => item.userId === user.userId,
      )?.id;
      actions.push(
        <Link
          key="StartReview"
          to={getWorkspaceUrl({
            status: ETaskImageStatus.Reviewing,
            roleId,
          })}
        >
          {localeText('proj.table.detail.action.startReview')}
        </Link>,
      );
    }
    return actions;
  };

  const columns: ProColumns<NsProject.ProjectTask>[] = [
    {
      title: localeText('proj.table.detail.index'),
      valueType: 'index',
      width: 80,
      render: (_, record) => record.idx + 1,
    },
    {
      title: localeText('proj.table.detail.labelLeader'),
      ellipsis: true,
      width: 200,
      render: (_, record) =>
        record.labelLeader ? (
          <TableTags
            isPerson
            data={[{ text: record.labelLeader.userName, color: 'green' }]}
          />
        ) : (
          '-'
        ),
    },
    {
      title: localeText('proj.table.detail.labeler'),
      dataIndex: 'labeler',
      ellipsis: true,
      width: 200,
      render: (_, record) =>
        record.labelers && record.labelers.length ? (
          <TableTags
            isPerson
            data={(record.labelers || []).map((item) => ({
              text: item.userName,
            }))}
          />
        ) : (
          '-'
        ),
    },
    ...(pageData.projectDetail && pageData.projectDetail.reviewTimes > 0
      ? [
          {
            title: localeText('proj.table.detail.reviewLeader'),
            ellipsis: true,
            width: 200,
            render: (_: React.ReactNode, record: NsProject.ProjectTask) =>
              record.reviewLeader ? (
                <TableTags
                  isPerson
                  data={[
                    { text: record.reviewLeader.userName, color: 'green' },
                  ]}
                />
              ) : (
                '-'
              ),
          },
          {
            title: localeText('proj.table.detail.reviewer'),
            dataIndex: 'reviewer',
            ellipsis: true,
            width: 200,
            render: (_: React.ReactNode, record: NsProject.ProjectTask) =>
              record.reviewers && record.reviewers.length ? (
                <TableTags
                  isPerson
                  data={(record.reviewers || []).map((item) => ({
                    text: item.userName,
                  }))}
                />
              ) : (
                '-'
              ),
          },
        ]
      : []),
    {
      title: localeText('proj.table.detail.progress'),
      dataIndex: 'progress',
      valueType: 'progress',
      ellipsis: true,
      width: 350,
      render: (_, record) => {
        const isOnlyLabeler =
          record.labelLeader?.userId !== user.userId &&
          record.labelers.length === 1 &&
          record.labelers[0].userId === user.userId;
        const isOnlyReviewer =
          record.reviewLeader?.userId !== user.userId &&
          record.reviewers.length === 1 &&
          record.reviewers[0].userId === user.userId;
        let curWorker = record.labelLeader;
        // ** Display the progress of the user when they are a single labeler/reviewer.
        if (isOnlyLabeler && !isOnlyReviewer) {
          curWorker = record.labelers[0];
        } else if (isOnlyReviewer && !isOnlyLabeler) {
          curWorker = record.reviewers[0];
        }
        return record.labelers.length > 0 || record.reviewers.length > 0 ? (
          <TaskProgress data={curWorker} />
        ) : (
          '-'
        );
      },
    },
    {
      title: localeText('proj.table.detail.status'),
      dataIndex: 'status',
      valueType: 'select',
      ellipsis: true,
      width: 120,
      render: (_, record) => {
        if (!!record.status) {
          const { text, color } = TASK_STATUS_MAP[record.status];
          return <Tag color={color}>{localeText(text)}</Tag>;
        }
      },
    },
    {
      title: localeText('proj.table.detail.action'),
      valueType: 'option',
      key: 'option',
      width: 240,
      render: (_, record, index) => (
        <div className={styles.actionCell}>{getActions(record, index)}</div>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.page}
      header={{
        title: pageData.projectDetail?.name,
        // subTitle: `Owner: ${pageData.projectDetail?.owner.name}  Manager: ${pageData.projectDetail?.owner.name}`,
        // desc: pageData.projectDetail?.description,
        backIcon: <ArrowLeftOutlined />,
        onBack: () => backPath('/project'),
        extra: [
          // <ProjectInfoModal key="info" />,
          <div key="owner" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
            {localeText('proj.detail.owner')}:{' '}
            {pageData.projectDetail?.owner.name} |{' '}
            {localeText('proj.detail.managers')}:{' '}
            {pageData.projectDetail?.managers
              .map((item) => item.name)
              .join(', ')}
          </div>,
          <Button
            size="small"
            type="text"
            key="icon"
            icon={hideDescription ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setHideDescription((s) => !s)}
          />,
        ],
        breadcrumb: {},
      }}
      content={hideDescription ? null : pageData.projectDetail?.description}
    >
      <ProTable<NsProject.ProjectTask>
        rowKey="id"
        className={styles.table}
        scroll={{
          x: 1200,
          y: containerSize?.height ? containerSize.height - 124 : undefined,
        }}
        columns={columns}
        cardBordered
        dataSource={pageData.list}
        toolBarRender={() => [<></>]}
        options={false}
        search={false}
        rowSelection={
          checkPermission(
            getUserRoles(pageData.projectDetail),
            EProjectAction.AssignLeader,
          )
            ? {
                getCheckboxProps: (record) => ({
                  disabled: Boolean(record.labelLeader || record.reviewLeader),
                }),
                selectedRowKeys: pageData.selectedTaskIds,
                onChange: onSelectChange,
              }
            : false
        }
        tableAlertOptionRender={() => (
          <Button type="primary" onClick={() => assignLeaders()}>
            + {localeText('proj.table.detail.batchAssignLeader')}
          </Button>
        )}
        loading={loading}
        pagination={{
          current: pageState.page,
          pageSize: pageState.pageSize,
          total: pageData.total,
          showSizeChanger: true,
          onChange: onPageChange,
        }}
      />
      <TaskDetailModal />
      <TaskAssignModal />
    </PageContainer>
  );
};

export default TaskList;
