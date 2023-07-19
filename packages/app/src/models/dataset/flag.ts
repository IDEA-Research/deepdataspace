/**
 * flag tools
 */
import { useModel } from '@umijs/max';
import { useImmer } from 'use-immer';
import { message, Modal } from 'antd';
import { useKeyPress, useRequest } from 'ahooks';
import {
  queryAsyncTaskStatus,
  rerankByFlags,
  queryGenEmbedStatus,
  genDatasetEmbed,
  saveFlagReq,
} from '@/services/dataset';
import { IMG_FLAG } from '@/constants';
import { reportEvent } from '@/logs';
import { DATA } from '@/services/type';

const getSlectedIndex = (list: Array<DATA.DataSetImg>) => {
  const selectIndexs: number[] = [];
  const selectedIds: string[] = [];
  list.forEach((item, index) => {
    if (item.selected) {
      selectIndexs.push(index);
      selectedIds.push(item.id);
    }
  });
  return { selectIndexs, selectedIds };
};

export default () => {
  const { pageState, setPageState, pageData, setPageData, loadImgList } =
    useModel('dataset.common');
  const [isShiftKeyDown, setIsShiftKeyDown] = useImmer(false);

  const selectItem = (index: number) => {
    setPageData((s) => {
      if (!pageState.flagTools) return;
      const newSelected = !!!s.imgList[index].selected;
      if (
        isShiftKeyDown &&
        s.flagTools.lastShiftIndex >= 0 &&
        index !== s.flagTools.lastShiftIndex
      ) {
        // Shift key is pressed && there is a previously selected item.
        let selectedCount = s.flagTools.count;
        s.imgList.forEach((item, i) => {
          if (
            (i >= s.flagTools.lastShiftIndex && i <= index) ||
            (i >= index && i <= s.flagTools.lastShiftIndex)
          ) {
            selectedCount += item.selected ? 0 : 1;
            item.selected = true;
          }
        });
        // clear after mult select
        s.flagTools.lastShiftIndex = -1;
        s.flagTools.count = selectedCount;
      } else {
        // single select
        s.imgList[index].selected = newSelected;
        // Record the most recent selection.
        s.flagTools.lastShiftIndex = newSelected ? index : -1;
        s.flagTools.count += newSelected ? 1 : -1;
      }
      reportEvent('dataset_flagtools_select', {
        selectedCount: s.flagTools.count,
      });
    });
  };

  const changeSelectAll = () => {
    const shouldSelectAll = Boolean(
      pageData.flagTools.count !== pageState.pageSize,
    );
    setPageData((s) => {
      s.imgList.forEach((item) => {
        item.selected = shouldSelectAll;
      });
      s.flagTools.lastShiftIndex = -1;
      s.flagTools.count = shouldSelectAll ? pageState.pageSize : 0;
      reportEvent('dataset_flagtools_select_all', {
        selectedCount: s.flagTools.count,
      });
    });
  };

  const antiSelect = (isShortcut = false) => {
    setPageData((s) => {
      s.imgList.forEach((item) => {
        item.selected = !!!item.selected;
      });
      s.flagTools.lastShiftIndex = -1;
      s.flagTools.count = pageState.pageSize - s.flagTools.count;
      reportEvent('dataset_flagtools_select_invert', {
        selectedCount: s.flagTools.count,
        isShortcut: isShortcut,
      });
    });
  };

  const limitNoSaveChangePage = () => {
    return new Promise((resolve) => {
      if (!pageState.flagTools) {
        resolve(null);
        return;
      }
      const { selectIndexs } = getSlectedIndex(pageData.imgList);
      if (
        selectIndexs.length > 0 &&
        (selectIndexs.length !== pageData.flagTools.lastSavedIndexs.length ||
          pageData.flagTools.lastSavedIndexs.find(
            (item) => !selectIndexs.includes(item),
          ))
      ) {
        Modal.confirm({
          content: `Now selected items have not been saved, these will lose if you click 'OK', are you sure?`,
          onOk: () => {
            resolve(null);
          },
        });
        return;
      }
      resolve(null);
    });
  };

  /** flag status filter */
  const onChangeFlagStatus = (value: IMG_FLAG) => {
    limitNoSaveChangePage().then(() => {
      setPageState((s) => {
        s.page = 1;
        s.flagTools!.flagStatus = value;
      });
      reportEvent('dataset_flagtools_filter_status', { status: value });
    });
  };

  const enterFlagTools = () => {
    // initialize
    setPageData((s) => {
      s.flagTools.lastShiftIndex = -1;
      s.flagTools.lastSavedIndexs = [];
      s.flagTools.count = 0;
    });
    setPageState((s) => {
      s.page = 1;
      s.flagTools = {
        flagStatus: IMG_FLAG.all,
      };
    });
    reportEvent('dataset_enter_flagtools');
  };

  const exitFlagTools = () => {
    limitNoSaveChangePage().then(() => {
      setPageState((s) => {
        s.page = 1;
        s.flagTools = undefined;
      });
      reportEvent('dataset_exit_flagtools');
    });
  };

  const saveFlag = async (flag: IMG_FLAG, isShortcut = false) => {
    if (pageData.flagTools.count <= 0) {
      message.warning('No any image to be selected!');
      return;
    }

    const { selectIndexs, selectedIds } = getSlectedIndex(pageData.imgList);
    const hide = message.loading('Flag saving...');
    try {
      reportEvent('dataset_flagtools_save_flag', {
        selectedCount: selectedIds.length,
        status: flag,
        pageSize: pageState.pageSize,
        isShortcut,
      });
      await saveFlagReq({
        datasetId: pageState.datasetId,
        flagGroups: [
          {
            flag,
            ids: selectedIds,
          },
        ],
      });
      // request success
      hide();
      setPageData((s) => {
        s.imgList.forEach((item) => {
          if (item.selected) item.flag = flag;
        });
        s.flagTools.lastSavedIndexs = selectIndexs;
      });
    } catch (error) {
      console.error('error', error);
      hide();
      message.error('Flag save fail, please retry!');
    }
  };

  const { run: queryAsyncTask, cancel: cancelQueryAsyncTask } = useRequest(
    (params) => {
      return queryAsyncTaskStatus(params);
    },
    {
      manual: true,
      pollingInterval: 1000,
      pollingWhenHidden: true,
      onSuccess: ({ status }) => {
        if (status === 'success') {
          cancelQueryAsyncTask();
          message.success('Order update success!');
          setPageData((s) => {
            s.screenLoading = '';
          });
          // Manually trigger the update of the first page of data.
          setPageState((s) => {
            s.page = 1;
          });
          loadImgList();
        } else if (status === 'fail') {
          cancelQueryAsyncTask();
          message.error('Query order task fail, Please retry!');
          setPageData((s) => {
            s.screenLoading = '';
          });
        }
      },
    },
  );

  const updateOrder = async () => {
    try {
      reportEvent('dataset_flagtools_update_order');
      setPageData((s) => {
        s.screenLoading = 'Updating order...';
      });
      // Trigger the backend task.
      const { id, name } = await rerankByFlags({
        datasetId: pageState.datasetId,
      });
      // Poll for task results.
      queryAsyncTask({ id, name });
    } catch (error) {
      console.error('error', error);
      setPageData((s) => {
        s.screenLoading = '';
      });
    }
  };

  const { run: queryGenEmbedTask, cancel: cancelQueryGenEmbedTask } =
    useRequest(
      (params) => {
        return queryGenEmbedStatus(params);
      },
      {
        manual: true,
        pollingInterval: 1000,
        pollingWhenHidden: true,
        onSuccess: ({ status }) => {
          if (status === 'success') {
            cancelQueryGenEmbedTask();
            message.success('Generated embedding success!');
            setPageData((s) => {
              s.screenLoading = '';
              s.hasEmbedFile = true;
            });
          } else if (status === 'fail') {
            cancelQueryGenEmbedTask();
            message.error('Query generate embed task fail, Please retry!');
            setPageData((s) => {
              s.screenLoading = '';
            });
          }
        },
      },
    );

  const genEmbed = async () => {
    try {
      reportEvent('dataset_flagtools_generate_embedding');
      setPageData((s) => {
        s.screenLoading = 'Generating embedding...';
      });
      // Trigger the backend task.
      const { id, name } = await genDatasetEmbed({
        datasetId: pageState.datasetId,
      });
      // Poll for task results.
      queryGenEmbedTask({ id, name });
    } catch (error) {
      console.error('error', error);
      setPageData((s) => {
        s.screenLoading = '';
      });
    }
  };

  useKeyPress(
    ['Shift'],
    (e: KeyboardEvent) => {
      if (!pageState.flagTools || pageState.previewIndex >= 0) {
        return;
      }
      setIsShiftKeyDown(e.type === 'keydown');
    },
    { events: ['keydown', 'keyup'] },
  );

  /**
   * Green flag：shift+Q
   * Red flag：shift+E
   * Anti select：Z
   */
  useKeyPress(
    ['shift.q', 'shift.Q', 'shift.e', 'shift.E', 'v', 'V'],
    (e: KeyboardEvent) => {
      if (!pageState.flagTools || pageState.previewIndex >= 0) {
        return;
      }
      if (['v', 'V'].includes(e.key)) {
        antiSelect(true);
      }
      if (['q', 'Q'].includes(e.key) && e.shiftKey) {
        saveFlag(IMG_FLAG.picked, true);
      }
      if (['e', 'E'].includes(e.key) && e.shiftKey) {
        saveFlag(IMG_FLAG.rejected, true);
      }
    },
  );

  return {
    enterFlagTools,
    exitFlagTools,
    onChangeFlagStatus,
    selectItem,
    changeSelectAll,
    antiSelect,
    limitNoSaveChangePage,
    saveFlag,
    updateOrder,
    genEmbed,
  };
};
