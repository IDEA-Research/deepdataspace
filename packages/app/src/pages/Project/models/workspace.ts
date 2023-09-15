import { useImmer } from 'use-immer';
import { useRequest } from 'ahooks';
import {
  requestLabelTaskConfigs,
  requestLabelTaskImages,
  requestLabelTaskRoles,
  saveLabelTaskLabels,
  saveLabelTaskReviews,
} from '@/services/project';
import { EQaAction, ETaskImageStatus, ETaskStatus } from '../constants';
import { useMemo } from 'react';
import { message } from 'antd';
import { EditorMode } from 'dds-components/Annotator';
import { useModel } from '@umijs/max';
import { EProjectRole } from './auth';
import { getUrlQueryVal } from 'dds-utils/url';
import { globalLocaleText } from 'dds-utils/locale';
import { BaseObject, Category } from '@/types';
import { NsProject } from '@/types/project';

const DEFAULT_PAGE_SIZE = 100;

interface PageState {
  status: ETaskImageStatus;
  taskStatus: ETaskStatus;
  roleId?: string;
}

interface PageData {
  categoryList: Category[];
  taskRoles: NsProject.ProjectWorker[];
  list: NsProject.TaskImage[];
  curIndex: number;
  page: number;
  pageSize: number;
  total: number;
  loadingImagesType?: LoadImagesType;
  editorMode: EditorMode;
  shouldExitWithRefresh?: boolean;
}

export interface LabelImage {
  id: string;
  url: string;
  urlFullRes: string;
  labelId: string;
  objects: BaseObject[];
}

export const enum LoadImagesType {
  Init,
  More,
}

export default () => {
  const { user } = useModel('user');
  const { setLoading } = useModel('global');
  const [pageData, setPageData] = useImmer<PageData>({
    taskRoles: [],
    categoryList: [],
    list: [],
    curIndex: -1,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    editorMode: EditorMode.View,
  });
  const [pageState, setPageState] = useImmer<PageState>({
    status: ETaskImageStatus.Labeling,
    taskStatus: ETaskStatus.Working,
  });
  const projectId = useMemo(
    () => getUrlQueryVal('projectId') || '',
    [window.location.search],
  );
  const taskId = useMemo(
    () => getUrlQueryVal('taskId') || '',
    [window.location.search],
  );
  const curRole = useMemo(
    () => pageData.taskRoles?.find((item) => item.id === pageState.roleId),
    [pageData.taskRoles, pageState.roleId],
  );
  const userRoles: EProjectRole[] = useMemo(
    () => (curRole && user.userId === curRole?.userId ? [curRole.role] : []),
    [user.userId, curRole],
  );

  const labelImages = useMemo(() => {
    return (
      pageData.list?.map((item) => {
        const objects: BaseObject[] = [];
        let labelId = '';
        if (pageState.status === ETaskImageStatus.Labeling && !item.labeled) {
          // Load pre-annotation data.
          if (item.defaultLabels && item.defaultLabels.annotations) {
            objects.push(...item.defaultLabels.annotations);
          }
        } else {
          // TODO: Just support single labeler.
          item.labels.forEach((label) => {
            labelId = label.id;
            objects.push(...label.annotations);
          });
        }
        return {
          id: item.id,
          url: item.url,
          urlFullRes: item.urlFullRes,
          labelId,
          objects,
        };
      }) || []
    );
  }, [pageData.list, pageState.status]);

  const loadImages = async (
    loadType: LoadImagesType,
    params: {
      status?: ETaskImageStatus;
      roleId?: string;
      page: number;
    },
  ) => {
    if (pageData.loadingImagesType) {
      return Promise.reject(null);
    }
    setPageData((s) => {
      s.loadingImagesType = loadType;
      if (loadType === LoadImagesType.Init) {
        s.list = [];
      }
    });
    try {
      const { imageList, total, pageNum } = await requestLabelTaskImages(
        getUrlQueryVal('taskId') || '',
        {
          status: params.status || pageState.status,
          roleId: params.roleId || pageState.roleId,
          pageNum: params.page,
          pageSize: pageData.pageSize,
        },
      );
      setPageData((s) => {
        s.list = s.list.concat(imageList);
        s.page = pageNum;
        s.total = total;
        s.loadingImagesType = undefined;
      });
    } catch (error) {
      setPageData((s) => {
        s.loadingImagesType = undefined;
      });
      return Promise.reject(error);
    }
  };

  const { loading: loadingTaskInfos, run: loadTaskInfos } = useRequest(
    () => {
      return Promise.all([
        requestLabelTaskRoles(getUrlQueryVal('taskId') || ''),
        requestLabelTaskConfigs(getUrlQueryVal('taskId') || ''),
      ]);
    },
    {
      manual: true,
      debounceWait: 60,
      onSuccess: ([rolesRsp, configRsp]) => {
        setPageData((s) => {
          s.categoryList = configRsp.categoryList;
          s.taskRoles = rolesRsp.roleList;
        });
        setPageState((s) => {
          if (
            rolesRsp.roleList.length &&
            (!s.roleId ||
              !rolesRsp.roleList.find((item) => item.id === s.roleId))
          ) {
            s.roleId = rolesRsp.roleList[0].id;
          }
        });
      },
      onError: () => {},
    },
  );

  const loadPageData = (
    params: {
      status?: ETaskImageStatus;
      roleId?: string;
    } = {},
  ) => {
    Promise.all([
      loadTaskInfos(),
      loadImages(LoadImagesType.Init, {
        ...params,
        page: 1,
      }),
    ]);
  };

  const loadMore = async () => {
    if (pageData.list.length < pageData.total) {
      await loadImages(LoadImagesType.More, { page: pageData.page + 1 });
    }
  };

  const onStatusTabChange = (status: string) => {
    setPageState((s) => {
      s.status = status as ETaskImageStatus;
    });
    loadImages(LoadImagesType.Init, {
      status: status as ETaskImageStatus,
      page: 1,
    });
  };

  const onRoleChange = (roleId: string) => {
    setPageState((s) => {
      s.roleId = roleId;
    });
    loadImages(LoadImagesType.Init, { roleId, page: 1 });
  };

  const clickItem = (index: number) => {
    setPageData((s) => {
      s.curIndex = index;
    });
  };

  const onPrevImage = async () => {
    setPageData((s) => {
      if (s.curIndex > 0) {
        s.curIndex = s.curIndex - 1;
      }
    });
    return Promise.resolve();
  };

  const onNextImage = async () => {
    if (pageData.curIndex < pageData.list.length - 1) {
      // There is data for the next image.
      setPageData((s) => {
        s.curIndex = s.curIndex + 1;
      });
      return Promise.resolve();
    } else if (pageData.curIndex < pageData.total - 1) {
      // There is no data for the next image => loadmore
      setLoading(true);
      try {
        await loadImages(LoadImagesType.More, {
          // If not in view mode, continuously load the first page.
          page: pageData.editorMode !== EditorMode.View ? 1 : pageData.page + 1,
        });
        setPageData((s) => {
          s.curIndex = s.curIndex + 1;
        });
      } catch (error) {
        console.error('loadMore error', error);
      }
      setLoading(false);
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  };

  const onEnterEdit = () => {
    setPageData((s) => {
      s.editorMode = EditorMode.Edit;
    });
  };

  const onStartLabel = async () => {
    if (pageState.status !== ETaskImageStatus.Labeling) {
      setLoading(true);
      setPageState((s) => {
        s.status = ETaskImageStatus.Labeling;
      });
      await loadImages(LoadImagesType.Init, {
        status: ETaskImageStatus.Labeling,
        page: 1,
      });
    }
    setPageData((s) => {
      s.curIndex = 0;
      s.editorMode = EditorMode.Edit;
    });
    setLoading(false);
  };

  const onStartRework = async () => {
    if (pageState.status !== ETaskImageStatus.Rejected) {
      setLoading(true);
      setPageState((s) => {
        s.status = ETaskImageStatus.Rejected;
      });
      await loadImages(LoadImagesType.Init, {
        status: ETaskImageStatus.Rejected,
        page: 1,
      });
    }
    setPageData((s) => {
      s.curIndex = 0;
      s.editorMode = EditorMode.Edit;
    });
    setLoading(false);
  };

  const onStartReview = async () => {
    if (pageState.status !== ETaskImageStatus.Reviewing) {
      setLoading(true);
      setPageState((s) => {
        s.status = ETaskImageStatus.Reviewing;
      });
      await loadImages(LoadImagesType.Init, {
        status: ETaskImageStatus.Reviewing,
        page: 1,
      });
    }
    setPageData((s) => {
      s.curIndex = 0;
      s.editorMode = EditorMode.Review;
    });
    setLoading(false);
  };

  const onExitEditor = () => {
    if (
      pageState.status === ETaskImageStatus.Reviewing &&
      pageData.editorMode === EditorMode.Edit
    ) {
      // Re edit
      setPageData((s) => {
        s.editorMode = EditorMode.View;
      });
      return;
    }

    if (
      (pageData.editorMode === EditorMode.Edit ||
        pageData.editorMode === EditorMode.Review) &&
      pageData.shouldExitWithRefresh
    ) {
      loadPageData();
    }
    setPageData((s) => {
      s.curIndex = -1;
      s.editorMode = EditorMode.View;
      s.shouldExitWithRefresh = false;
    });
  };

  const onLabelSave = async (imageId: string, annotations: BaseObject[]) => {
    setLoading(true);
    const hide = message.loading(
      globalLocaleText('proj.onLabelSave.loading'),
      100000,
    );
    try {
      const label = await saveLabelTaskLabels(imageId, {
        annotations,
      });
      setPageData((s) => {
        s.shouldExitWithRefresh = true;
        // TODO: Just support single labeler.
        s.list[s.curIndex].labels = [label];
        s.list[s.curIndex].labeled = true;
      });
      message.success(globalLocaleText('proj.onLabelSave.save'));

      if (pageState.status === ETaskImageStatus.Reviewing) {
        // re edit
        setPageData((s) => {
          s.editorMode = EditorMode.View;
        });
      } else {
        try {
          await onNextImage();
        } catch (error) {
          message.success(globalLocaleText('proj.onLabelSave.finish'));
          onExitEditor();
        }
      }
    } catch (error) {
      console.error('error', error);
      message.error(globalLocaleText('proj.onLabelSave.error'));
    }
    hide();
    setLoading(false);
  };

  const onReviewResult = async (imageId: string, action: EQaAction) => {
    setLoading(true);
    const hide = message.loading(
      globalLocaleText('proj.onReviewResult.loading'),
      100000,
    );
    try {
      await saveLabelTaskReviews(imageId, {
        labelId: labelImages[pageData.curIndex].labelId,
        action,
      });
      setPageData((s) => {
        s.shouldExitWithRefresh = true;
      });
      message.success(globalLocaleText('proj.onReviewResult.save'));
      try {
        await onNextImage();
      } catch (error) {
        message.success(globalLocaleText('proj.onReviewResult.finish'));
        onExitEditor();
      }
    } catch (error) {
      console.error('error', error);
      message.error(globalLocaleText('proj.onReviewResult.error'));
    }
    hide();
    setLoading(false);
  };

  /**
   * Initialize page parameters from the URL.
   * @param urlPageState
   */
  const onInitPageState = (urlPageState: PageState) => {
    setPageState((s) => {
      Object.assign(s, urlPageState);
    });
    loadPageData({
      ...urlPageState,
    });
  };

  const tabItems = useMemo(
    () => [
      {
        label: globalLocaleText('proj.tabItems.toLabel', {
          num: curRole?.labelNumWaiting || 0,
        }),
        key: ETaskImageStatus.Labeling,
      },
      {
        label: globalLocaleText('proj.tabItems.toReview', {
          num: curRole?.reviewNumWaiting || 0,
        }),
        key: ETaskImageStatus.Reviewing,
      },
      {
        label: globalLocaleText('proj.tabItems.inRework', {
          num: curRole?.reviewNumRejected || 0,
        }),
        key: ETaskImageStatus.Rejected,
      },
      {
        label: globalLocaleText('proj.tabItems.done', {
          num: curRole?.reviewNumAccepted || 0,
        }),
        key: ETaskImageStatus.Accepted,
      },
    ],
    [curRole],
  );

  const isEditorVisible = pageData.curIndex >= 0;

  return {
    pageData,
    pageState,
    loading:
      loadingTaskInfos || pageData.loadingImagesType === LoadImagesType.Init,
    loadPageData,
    loadMore,
    onInitPageState,
    projectId,
    taskId,
    curRole,
    userRoles,
    tabItems,
    labelImages,
    isEditorVisible,
    onStatusTabChange,
    onRoleChange,
    clickItem,
    onExitEditor,
    onPrevImage,
    onNextImage,
    onLabelSave,
    onReviewResult,
    onEnterEdit,
    onStartLabel,
    onStartRework,
    onStartReview,
  };
};
