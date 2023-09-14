import { useModel } from '@umijs/max';
import { useImmer } from 'use-immer';
import { useRequest } from 'ahooks';
import {
  fetchProjectDetail,
  fetchProjectTasks,
  fetchUserLint,
  qaTask,
  requestAssignTeamLeader,
  requestAssignWorkers,
  requestCommitReiviewTask,
  requestReassignWorker,
  requestRestartTask,
} from '@/services/project';
import { globalLocaleText } from 'dds-utils/locale';
import { message } from 'antd';
import { EQaAction } from '../constants';
import { getUrlPathnameLastKey } from 'dds-utils/url';
import { NsProject } from '@/types/project';

const DEFAULT_PAGE_SIZE = 20;

interface PageState {
  page: number;
  pageSize: number;
}

interface PageData {
  isPm?: boolean;
  projectDetail?: NsProject.Project;
  list: NsProject.ProjectTask[];
  selectedTaskIds: string[];
  total: number;
}

export enum ASSIGN_TYPE {
  labelLeader,
  reviewLeader,
  labeler,
  reviewer,
  reassign,
}

export interface AssignModalForm {
  labelLeaderId?: string;
  reviewLeaderId?: string;
  labelerIds?: string[];
  reviewerIds?: string[];
  reassigner?: string;
}

export interface AssignModal {
  show: boolean;
  types: ASSIGN_TYPE[];
  tasks: NsProject.ProjectTask[];
  initialValues: AssignModalForm;
  reassignTarget?: NsProject.ProjectWorker;
}

const INIT_ASSIGN_MODAL = {
  show: false,
  types: [],
  tasks: [],
  initialValues: {},
};

export default () => {
  const { user } = useModel('user');
  const [pageData, setPageData] = useImmer<PageData>({
    list: [],
    total: 0,
    selectedTaskIds: [],
  });
  const [pageState, setPageState] = useImmer<PageState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [taskDetailModalIndex, setTaskDetailModalIndex] = useImmer<
    number | undefined
  >(undefined);
  const [assignModal, setAssignModal] =
    useImmer<AssignModal>(INIT_ASSIGN_MODAL);

  const { loading, run: loadPageData } = useRequest(
    (page?: number, pageSize?: number) => {
      setPageData((s) => {
        s.list = [];
      });
      // const id = user.userId;
      return fetchProjectTasks({
        projectId: getUrlPathnameLastKey(),
        pageNum: page || pageState.page,
        pageSize: pageSize || pageState.pageSize,
      });
    },
    {
      manual: true,
      debounceWait: 100,
      refreshDeps: [pageState.page, pageState.pageSize],
      onSuccess: ({ taskList, total }) => {
        setPageData((s) => {
          s.list = taskList;
          s.total = total;
          s.selectedTaskIds = [];
        });
      },
      onError: () => {},
    },
  );

  const { run: loadProjectDetail } = useRequest(
    () => {
      return fetchProjectDetail(getUrlPathnameLastKey());
    },
    {
      manual: true,
      debounceWait: 100,
      refreshDeps: [pageState.page, pageState.pageSize],
      onSuccess: (project) => {
        setPageData((s) => {
          s.projectDetail = project;
          s.isPm = !!project.managers.find((item) => item.id === user.userId);
        });
      },
      onError: () => {},
    },
  );

  const onPageChange = (page: number, pageSize: number) => {
    setPageState((s) => {
      s.page = pageSize === s.pageSize ? page : 1;
      s.pageSize = pageSize;
    });
    loadPageData(page, pageSize);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setPageData((s) => {
      s.selectedTaskIds = newSelectedRowKeys as string[];
    });
  };

  const assignLeaders = (ids?: string[]) => {
    if (!pageData.projectDetail) return;
    const taskIds = ids || pageData.selectedTaskIds;
    const types: ASSIGN_TYPE[] = [];
    const initialValues: AssignModalForm = {};
    const task = pageData.list.find((item) => item.id === taskIds[0]);
    if (pageData.projectDetail.labelTimes > 0) {
      types.push(ASSIGN_TYPE.labelLeader);
      initialValues.labelLeaderId = task?.labelLeader?.userId;
    }
    if (pageData.projectDetail.reviewTimes > 0) {
      types.push(ASSIGN_TYPE.reviewLeader);
      initialValues.reviewLeaderId = task?.reviewLeader?.userId;
    }
    setAssignModal((s) => {
      s.show = true;
      s.types = types;
      s.tasks = pageData.list.filter((item) => taskIds.includes(item.id));
      s.initialValues = initialValues;
    });
  };

  const assignWorker = (task: NsProject.ProjectTask, types: ASSIGN_TYPE[]) => {
    if (!pageData.projectDetail) return;
    const initialValues: AssignModalForm = {};
    if (types.includes(ASSIGN_TYPE.labeler)) {
      initialValues.labelerIds = task.labelers?.map((item) => item.userId);
    }
    if (types.includes(ASSIGN_TYPE.reviewer)) {
      initialValues.reviewerIds = task.reviewers?.map((item) => item.userId);
    }
    setAssignModal((s) => {
      s.show = true;
      s.types = types;
      s.tasks = [task];
      s.initialValues = initialValues;
    });
  };

  const reassignWorker = (
    task: NsProject.ProjectTask,
    worker: NsProject.ProjectWorker,
  ) => {
    setAssignModal((s) => {
      s.show = true;
      s.types = [ASSIGN_TYPE.reassign];
      s.tasks = [task];
      s.reassignTarget = worker;
    });
  };

  const onCloseAssignModal = () => {
    setAssignModal(INIT_ASSIGN_MODAL);
  };

  /** Search users. */
  const userLintRequest = async ({ keyWords = '' }) => {
    let userList: { name: string; id: string }[] = [];
    const { tasks, types } = assignModal;
    // Add the original options by default.
    tasks.forEach((item) => {
      const users = [];
      if (types.includes(ASSIGN_TYPE.labelLeader)) users.push(item.labelLeader);
      if (types.includes(ASSIGN_TYPE.reviewLeader))
        users.push(item.reviewLeader);
      if (types.includes(ASSIGN_TYPE.labeler)) users.push(...item.labelers);
      if (types.includes(ASSIGN_TYPE.reviewer)) users.push(...item.reviewers);
      users.forEach((user) => {
        if (user && !userList.find((u) => user.userId === u.id)) {
          userList.push({
            id: user.userId,
            name: user.userName,
          });
        }
      });
    });
    if (keyWords) {
      userList = (await fetchUserLint({ name: keyWords })).userList.map(
        (item) => ({
          name: item.name,
          id: item.id,
        }),
      );
    }
    return userList.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  };

  const assignModalFinish = async (values: AssignModalForm) => {
    const { initialValues } = assignModal;
    if (
      assignModal.types.includes(ASSIGN_TYPE.labelLeader) ||
      assignModal.types.includes(ASSIGN_TYPE.reviewLeader)
    ) {
      if (
        values.labelLeaderId !== initialValues.labelLeaderId ||
        values.reviewLeaderId !== initialValues.reviewLeaderId
      ) {
        // assign leader (batch)
        try {
          await requestAssignTeamLeader({
            projectId: pageData.projectDetail?.id || '',
            taskIds: assignModal.tasks.map((item) => item.id),
            labelLeaderId:
              values.labelLeaderId !== initialValues.labelLeaderId
                ? values.labelLeaderId
                : undefined,
            reviewLeaderId:
              values.reviewLeaderId !== initialValues.reviewLeaderId
                ? values.reviewLeaderId
                : undefined,
          });
          loadPageData();
          message.success(
            globalLocaleText('proj.assignModalFinish.assignLeader'),
          );
        } catch (error: any) {
          console.error(error);
          return Promise.resolve(false);
        }
      }
    } else {
      const task = assignModal.tasks[0];
      if (
        assignModal.types.includes(ASSIGN_TYPE.labeler) ||
        assignModal.types.includes(ASSIGN_TYPE.reviewer)
      ) {
        // assign worker
        try {
          await requestAssignWorkers(task.id, values);
          loadPageData();
          message.success(
            globalLocaleText('proj.assignModalFinish.assignWorker'),
          );
        } catch (error) {
          console.error(error);
          return Promise.resolve(false);
        }
      } else if (
        assignModal.types.includes(ASSIGN_TYPE.reassign) &&
        values.reassigner !== assignModal.reassignTarget?.userId
      ) {
        // reassign worker
        try {
          await requestReassignWorker(task.id, {
            oldWorkerId: assignModal.reassignTarget?.userId || '',
            newWorkerId: values.reassigner || '',
            role: assignModal.reassignTarget?.role || '',
          });
          loadPageData();
          message.success(
            globalLocaleText('proj.assignModalFinish.reassignWorker'),
          );
        } catch (error) {
          console.error(error);
          return Promise.resolve(false);
        }
      }
    }
    onCloseAssignModal();
    return Promise.resolve(false);
  };

  const restartTask = async (task: NsProject.ProjectTask) => {
    try {
      await requestRestartTask(task.id);
      loadPageData();
      message.success(globalLocaleText('proj.assignModalFinish.restarTask'));
    } catch (error) {
      console.error(error);
      return Promise.resolve(false);
    }
  };

  const commitReviewTask = async (task: NsProject.ProjectTask) => {
    try {
      await requestCommitReiviewTask(task.id);
      loadPageData();
      message.success(globalLocaleText('proj.assignModalFinish.commiTask'));
    } catch (error) {
      console.error(error);
      return Promise.resolve(false);
    }
  };

  /** For pm */
  const onChangeTaskResult = async (
    task: NsProject.ProjectTask,
    action: EQaAction,
  ) => {
    try {
      await qaTask(task.id, {
        action,
      });
      message.success(
        globalLocaleText('proj.assignModalFinish.changeTaskStatus'),
      );
      loadPageData();
    } catch (error) {
      console.error(error);
      return Promise.reject(false);
    }
  };

  /**
   * Initialize page parameters from the URL.
   * @param urlPageState
   */
  const onInitPageState = (urlPageState: PageState) => {
    setPageState((s) => {
      Object.assign(
        s,
        {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
        },
        urlPageState,
      );
    });
    loadProjectDetail();
    loadPageData();
  };

  return {
    pageData,
    pageState,
    loading,
    onPageChange,
    onSelectChange,
    onInitPageState,
    taskDetailModalIndex,
    setTaskDetailModalIndex,
    assignModal,
    assignLeaders,
    assignWorker,
    reassignWorker,
    onCloseAssignModal,
    userLintRequest,
    assignModalFinish,
    restartTask,
    commitReviewTask,
    onChangeTaskResult,
  };
};
