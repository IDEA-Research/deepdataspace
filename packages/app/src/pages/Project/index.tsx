import {
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Popconfirm, Tag } from 'antd';
import { Link, useModel } from '@umijs/max';
import ProjectEditModal from './components/ProjectEditModal';
import { EProjectStatus, EQaAction, PROJECT_STATUS_MAP } from './constants';
import ProgressBar from './components/ProgressBar';
import usePageModelLifeCycle from '@/hooks/usePageModelLifeCycle';
import { DATA } from '@/services/type';
import { useLocale } from '@/locales/helper';
import TableTags from './components/TableTags';
import { EProjectAction } from './models/auth';
import { useSize } from 'ahooks';
import styles from './index.less';

const ProjectList: React.FC = () => {
  const { user } = useModel('user');
  const { checkPermission } = useModel('Project.auth');
  const containerSize = useSize(
    document.querySelector('.ant-pro-grid-content'),
  );
  const {
    pageData,
    pageState,
    loading,
    onPageChange,
    onInitPageState,
    onNewProject,
    onEditProject,
    onChangeProjectResult,
  } = useModel('Project.list');
  usePageModelLifeCycle({ onInitPageState, pageState });
  const { localeText } = useLocale();

  const getActions = (record: DATA.Project) => {
    const actions = [];
    if (
      checkPermission(record.userRoles, EProjectAction.ProjectQa) &&
      [
        EProjectStatus.Reviewing,
        EProjectStatus.Accepted,
        EProjectStatus.Rejected,
      ].includes(record.status)
    ) {
      // ProjectQa
      if (record.status !== EProjectStatus.Accepted) {
        actions.push(
          <a
            key="accept"
            style={{ color: '#4fbb30' }}
            onClick={() => onChangeProjectResult(record, EQaAction.Accept)}
          >
            {localeText('proj.table.action.accept')}
          </a>,
        );
      }
      if (record.status !== EProjectStatus.Rejected) {
        actions.push(
          <Popconfirm
            key="reject"
            title="Are you sure to reject this project?"
            onConfirm={() => onChangeProjectResult(record, EQaAction.Reject)}
          >
            <a key="reject" style={{ color: 'red' }}>
              {localeText('proj.table.action.reject')}
            </a>
          </Popconfirm>,
        );
      }
    }
    if (checkPermission(record.userRoles, EProjectAction.ProjectEdit)) {
      // Init/info is not necessary when there is an edit function.
      actions.push(
        <a
          key="edit"
          onClick={() => {
            onEditProject(record);
          }}
        >
          {localeText('proj.table.action.edit')}
        </a>,
      );
    } else if (
      checkPermission(record.userRoles, EProjectAction.ProjectInit) &&
      record.status === EProjectStatus.Waiting
    ) {
      actions.push(
        <a
          key="init"
          onClick={() => {
            onEditProject(record);
          }}
        >
          {localeText('proj.table.action.init')}
        </a>,
      );
    } else if (
      checkPermission(record.userRoles, EProjectAction.ProjectInfo) &&
      record.status !== EProjectStatus.Waiting
    ) {
      actions.push(
        <a
          key="info"
          onClick={() => {
            onEditProject(record);
          }}
        >
          {localeText('proj.table.action.info')}
        </a>,
      );
    }
    if (
      ![EProjectStatus.Waiting, EProjectStatus.Initializing].includes(
        record.status,
      )
    ) {
      actions.push(
        <Link key="detail" to={`/project/${record.id}`}>
          {localeText('proj.table.action.detail')}
        </Link>,
      );
    }
    return actions;
  };

  const columns: ProColumns<DATA.Project>[] = [
    {
      title: localeText('proj.table.name'),
      dataIndex: 'name',
      ellipsis: false,
    },
    {
      title: localeText('proj.table.owner'),
      ellipsis: true,
      render: (_, record) => (
        <TableTags
          isPerson
          data={[{ text: record.owner.name, color: 'green' }]}
        />
      ),
    },
    {
      title: localeText('proj.table.datasets'),
      ellipsis: true,
      render: (_, record) => (
        <TableTags
          max={2}
          data={record.datasets.map((item) => ({
            text: item.name,
            color: 'blue',
          }))}
        />
      ),
    },
    {
      title: localeText('proj.table.progress'),
      render: (_, record) =>
        record.taskNumTotal ? (
          <ProgressBar
            complete={record.taskNumAccepted}
            total={record.taskNumTotal}
          />
        ) : (
          '-'
        ),
    },
    {
      title: localeText('proj.table.PM'),
      ellipsis: true,
      render: (_, record) => (
        <TableTags
          isPerson
          max={2}
          data={record.managers?.map((item) => ({ text: item.name }))}
        />
      ),
    },
    {
      title: localeText('proj.table.status'),
      dataIndex: 'status',
      ellipsis: true,
      valueType: 'select',
      valueEnum: PROJECT_STATUS_MAP,
      render: (_, record) => {
        const { text, color } = PROJECT_STATUS_MAP[record.status];
        return <Tag color={color}>{localeText(text)}</Tag>;
      },
    },
    {
      title: localeText('proj.table.createAt'),
      dataIndex: 'createdTs',
      valueType: 'date',
    },
    {
      title: localeText('proj.table.action'),
      valueType: 'option',
      key: 'option',
      render: (_, record) => (
        <div className={styles.actionCell}>{getActions(record)}</div>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.page}
      header={{
        title: localeText('proj.title'),
        // All internal employees have the permission to create new projects.
        extra: user.isStaff
          ? [
              <Button key="new" type="primary" onClick={onNewProject}>
                + {localeText('proj.table.newProject')}
              </Button>,
            ]
          : [],
        breadcrumb: {},
      }}
    >
      <ProTable<DATA.Project>
        rowKey={'id'}
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
        // request={() => {}}
        loading={loading}
        pagination={{
          current: pageState.page,
          pageSize: pageState.pageSize,
          total: pageData.total,
          showSizeChanger: true,
          onChange: onPageChange,
        }}
      />
      <ProjectEditModal />
    </PageContainer>
  );
};

export default ProjectList;
