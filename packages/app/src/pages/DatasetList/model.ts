import { history, useModel } from '@umijs/max';
import copy from 'copy-to-clipboard';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { message } from 'antd';
import { DATA } from '@/services/type';
import { globalLocaleText } from '@/locales/helper';
import { PaginationState } from '@/models/datasets';
import { size, map } from 'lodash';
import { createDataset, updateDataset, importImages } from '@/services/dataset';

export interface newDatasetForm {
  name: string;
  description?: string;
}

export default () => {
  const { loadDatasets, setPagination, setDatasetId } = useModel('datasets');
  const { pageState, loadDatasetInfo, loadImgList } =
    useModel('dataset.common');

  const onClickItem = (item: DATA.DataSet) => {
    const pageState = JSON.stringify({
      datasetId: item.id,
      datasetName: item.name,
    });
    history.push(`/dataset/detail?pageState=${encodeURIComponent(pageState)}`);
  };

  const onClickCopyLink = (
    e: React.UIEvent<HTMLElement, UIEvent>,
    item: DATA.DataSet,
  ) => {
    const pageState = JSON.stringify({
      datasetId: item.id,
      datasetName: item.name,
    });
    const link = `${
      window.location.origin
    }/page/dataset/detail?pageState=${encodeURIComponent(pageState)}`;
    const copySuccess = copy(link);
    if (copySuccess)
      message.success(globalLocaleText('dataset.onClickCopyLink.success'));
    e.stopPropagation();
  };

  const onInitPageState = (urlPageState: PaginationState) => {
    setPagination((s) => {
      Object.assign(
        s,
        {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
        },
        urlPageState,
      );
    });
    loadDatasets();
  };

  const updateListFilter = (isPublic: string) => {
    setPagination((s) => {
      Object.assign(s, {
        isPublic,
      });
    });
    loadDatasets();
  };

  const checkImageUrls = async (imgs: string[]) => {
    let results: string[] = [];

    const promises = imgs.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          resolve(url);
          results.push(url);
        };
        img.onerror = () => {
          reject();
        };
      });
    });

    return Promise.allSettled(promises).then(() => {
      return results;
    });
  };

  const handleCreateDataset = async (values: newDatasetForm) => {
    const { name, description } = values;

    if (size(name) === 0) {
      message.warning(globalLocaleText('dataset.create.warn'));
      return;
    }

    try {
      const { id } = await createDataset({ name, description });

      message.success(globalLocaleText('dataset.create.success'));
      setDatasetId(id);
      loadDatasets();
    } catch (error) {
      message.error(globalLocaleText('dataset.create.error', { error }));
    }
  };

  const handleUpdateDataset = async (values: newDatasetForm) => {
    const { name, description } = values;

    if (!pageState?.datasetId) {
      message.warning(globalLocaleText('dataset.update.warn'));
      return;
    }

    try {
      await updateDataset(pageState.datasetId, { name, description });
      message.success(globalLocaleText('dataset.update.success'));
      loadDatasetInfo();
    } catch (error) {
      message.error(globalLocaleText('dataset.update.error', { error }));
    }
  };

  const handleImportImages = async (datasetId: string, imgs: string[]) => {
    if (size(datasetId) === 0) {
      return message.warning(globalLocaleText('dataset.update.warn'));
    }

    if (size(imgs) === 0) {
      return message.warning(globalLocaleText('dataset.import.warn'));
    }

    const imageList = map(imgs, (url) => {
      const _obj = {
        imageUrl: url,
      };
      return _obj;
    });

    try {
      await importImages({ datasetId, imageList });
      message.success(globalLocaleText('dataset.import.success'));

      loadImgList();
      loadDatasets();
    } catch (error) {
      message.error(globalLocaleText('dataset.import.error', { error }));
    }
  };

  return {
    onInitPageState,
    onClickItem,
    onClickCopyLink,
    updateListFilter,
    checkImageUrls,
    handleCreateDataset,
    handleUpdateDataset,
    handleImportImages,
  };
};
