import { DATA } from '@/services/type';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Modal } from 'antd';
import { useMemo } from 'react';
import { useLocale } from '@/locales/helper';
import TableTags from '../TableTags';
import { EProjectAction, EProjectRole } from '../../models/auth';
import TaskProgress from '../TaskProgress';

const TaskDetailModal = () => {
  const { getUserRoles, checkPermission } = useModel('Project.auth');
  const {
    taskDetailModalIndex,
    setTaskDetailModalIndex,
    pageData,
    reassignWorker,
  } = useModel('Project.detail');
  const { localeText } = useLocale();

  const task =
    taskDetailModalIndex !== undefined
      ? pageData.list[taskDetailModalIndex]
      : undefined;
  const workerList: DATA.ProjectWorker[] = useMemo(() => {
    if (!task) return [];
    return task.labelers.concat(task.reviewers);
  }, [task]);

  const getActions = (record: DATA.ProjectWorker) => {
    const actions = [];
    const userRoles = getUserRoles(pageData.projectDetail, task);
    if (
      (checkPermission(userRoles, EProjectAction.AssignLabeler) &&
        record.role === EProjectRole.Labeler) ||
      (checkPermission(userRoles, EProjectAction.AssignReviewer) &&
        record.role === EProjectRole.Reviewer)
    ) {
      actions.push(
        <a
          key="Reassign"
          style={{ color: '#2db7f5' }}
          onClick={() => reassignWorker(task!, record)}
        >
          {localeText('proj.detail.modal.reassign')}
        </a>,
      );
    }
    return actions;
  };

  const columns: ProColumns<DATA.ProjectWorker>[] = [
    {
      title: localeText('proj.detail.modal.index'),
      valueType: 'index',
      width: 80,
    },
    {
      title: localeText('proj.detail.modal.role'),
      dataIndex: 'role',
    },
    {
      title: localeText('proj.detail.modal.worker'),
      ellipsis: true,
      render: (_, record) => (
        <TableTags isPerson data={[{ text: record.userName }]} />
      ),
    },
    {
      title: localeText('proj.detail.modal.progress'),
      ellipsis: true,
      width: 350,
      render: (_, record) => {
        return <TaskProgress data={record} />;
      },
    },
    {
      title: localeText('proj.detail.modal.action'),
      valueType: 'option',
      key: 'option',
      render: (_, record) => getActions(record),
    },
  ];

  return (
    <Modal
      title={localeText('proj.detail.modal.title', { id: task?.id })}
      width={1200}
      open={Boolean(task)}
      onCancel={() => setTaskDetailModalIndex(undefined)}
      destroyOnClose
      footer={null}
    >
      {task && (
        <ProTable<DATA.ProjectWorker>
          scroll={{ x: 800 }}
          rowKey="id"
          columns={columns}
          cardBordered
          dataSource={workerList}
          toolBarRender={() => [<></>]}
          options={false}
          search={false}
        />
      )}
    </Modal>
  );
};

export default TaskDetailModal;
