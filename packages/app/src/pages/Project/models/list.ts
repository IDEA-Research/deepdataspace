import { useModel } from '@umijs/max';
import { useImmer } from 'use-immer';
import { useRequest } from 'ahooks';
import {
  editProject,
  fetchProjectList,
  initProject,
  newProject,
  qaProject,
} from '@/services/project';
import { DATA } from '@/services/type';
import { message } from 'antd';
import { globalLocaleText } from '@/locales/helper';
import { EProjectStatus, EQaAction } from '../constants';
import { isEqual } from 'lodash';

const DEFAULT_PAGE_SIZE = 20;

interface PageState {
  page: number;
  pageSize: number;
}

interface PageData {
  list: DATA.Project[];
  total: number;
}

export interface ProjectModalForm {
  basics: {
    name?: string;
    description?: string;
    datasetIds?: string[];
    categories?: string;
    managerIds?: string[];
  };
  settings: {
    batchSize?: number;
  };
  workflowInitNow?: string[];
  hadBatchSize?: boolean;
  hadReviewer?: boolean;
}

export interface ProjectModal {
  show: boolean;
  current: number;
  targetProject?: DATA.Project; // edit (if had value) | new
  initialValues: ProjectModalForm;
  disableInitProject?: boolean;
}

export const SET_WORKFLOW_NOW = 'proj.editModal.setWorkflowNow';

const INIT_PROJECT_MODEL = {
  show: false,
  current: 0,
  initialValues: {
    basics: {},
    settings: {},
    workflowInitNow: [],
    hadBatchSize: false,
    hadReviewer: false,
  },
};

export default () => {
  const { user } = useModel('user');
  const { getUserRoles } = useModel('Project.auth');
  const [pageData, setPageData] = useImmer<PageData>({
    list: [],
    total: 0,
  });
  const [pageState, setPageState] = useImmer<PageState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [projectModal, setProjectModal] =
    useImmer<ProjectModal>(INIT_PROJECT_MODEL);

  const { loading, run: loadPageData } = useRequest(
    (page?: number, pageSize?: number) => {
      setPageData((s) => {
        s.list = [];
      });
      return fetchProjectList({
        pageNum: page || pageState.page,
        pageSize: pageSize || pageState.pageSize,
      });
    },
    {
      manual: true,
      debounceWait: 100,
      refreshDeps: [pageState.page, pageState.pageSize],
      onSuccess: ({ projectList, total }) => {
        setPageData({
          list: projectList.map((item) => ({
            ...item,
            userRoles: getUserRoles(item),
          })),
          total,
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

  /** For owner */
  const onNewProject = () => {
    setProjectModal((s) => {
      s.show = true;
    });
  };

  /** For owner / pm */
  const onEditProject = (project: DATA.Project, isInit?: boolean) => {
    setProjectModal((s) => {
      const {
        name,
        description,
        categories,
        datasets,
        managers,
        batchSize,
        reviewTimes,
        status,
      } = project;
      s.show = true;
      s.targetProject = project;
      s.current = isInit ? 1 : 0;
      s.initialValues.basics = {
        name,
        description,
        categories,
        datasetIds: datasets.map((item) => item.id),
        managerIds: managers.map((item) => item.id),
      };
      s.initialValues.settings =
        status !== EProjectStatus.Waiting
          ? {
              batchSize: batchSize > 0 ? batchSize : undefined,
            }
          : {};
      s.initialValues.workflowInitNow = [globalLocaleText(SET_WORKFLOW_NOW)];
      s.initialValues.hadBatchSize = batchSize > 0;
      s.initialValues.hadReviewer = reviewTimes > 0;
    });
  };

  const closeProjectModal = () => {
    setProjectModal(INIT_PROJECT_MODEL);
  };

  const onProjectModalCurrentChange = (current: number) => {
    setProjectModal((s) => {
      if (current === 0) s.current = 0;
    });
  };

  const projectModalNext = (values: ProjectModalForm) => {
    setProjectModal((s) => {
      /** Dynamically control based on the form results. */
      s.disableInitProject = !values.basics.managerIds?.includes(user.userId!);
      s.current = 1;
    });
    return Promise.resolve(false);
  };

  const projectModalFinish = async (values: ProjectModalForm) => {
    // owner
    let hadRequested = false;
    let targetProjectId = projectModal.targetProject?.id;
    if (!targetProjectId) {
      // new project
      try {
        const project = await newProject(values.basics);
        targetProjectId = project.id;
        setProjectModal((s) => {
          s.targetProject = project;
        });
        hadRequested = true;
        message.success(globalLocaleText('proj.projectModalFinish.new'));
      } catch (error) {
        console.error(error);
      }
    } else {
      // Determine if there have been changes.
      const { description, managerIds } = projectModal.initialValues.basics;
      if (
        values.basics.description !== description ||
        !isEqual(values.basics.managerIds, managerIds)
      ) {
        // edit project
        try {
          await editProject(targetProjectId, values.basics);
          hadRequested = true;
          message.success(globalLocaleText('proj.projectModalFinish.edit'));
        } catch (error) {
          console.error(error);
        }
      }
    }
    // init project
    if (
      (!projectModal.targetProject ||
        projectModal.targetProject?.status === EProjectStatus.Waiting) &&
      values.workflowInitNow &&
      values.workflowInitNow.length
    ) {
      try {
        await initProject(targetProjectId!, {
          batchSize: values.hadBatchSize ? values.settings.batchSize : 0,
          labelTimes: 1,
          reviewTimes: values.hadReviewer ? 1 : 0,
        });
        hadRequested = true;
        message.success(globalLocaleText('proj.projectModalFinish.init'));
      } catch (error) {
        console.error(error);
      }
    }
    if (hadRequested) {
      loadPageData();
    }
    closeProjectModal();
    return Promise.resolve(false);
  };

  /** For owner */
  const onChangeProjectResult = async (
    project: DATA.Project,
    action: EQaAction,
  ) => {
    try {
      await qaProject(project.id, {
        action,
      });
      message.success(globalLocaleText('proj.projectModalFinish.change'));
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
    loadPageData();
  };

  return {
    pageData,
    pageState,
    loading,
    onPageChange,
    onInitPageState,
    projectModal,
    onNewProject,
    onEditProject,
    closeProjectModal,
    onProjectModalCurrentChange,
    projectModalNext,
    projectModalFinish,
    onChangeProjectResult,
  };
};
