import { history, useModel } from '@umijs/max';
import copy from 'copy-to-clipboard';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { message } from 'antd';
import { DATA } from '@/services/type';
import { globalLocaleText } from '@/locales/helper';
import { PaginationState } from '@/models/datasets';
import { size, split, map } from 'lodash';
import { createDataset, updateDataset, importImages } from '@/services/dataset';

export interface newDatasetForm {
  name: string;
  description?: string;
  isPublic: string;
}

export default () => {
  const { loadDatasets, setPagination, setDatasetId, datasetId } =
    useModel('datasets');
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
    const { name, description, isPublic } = values;

    if (size(name) === 0) {
      message.warning(globalLocaleText('dataset.create.warn'));
      return;
    }

    try {
      const { id } = await createDataset({ name, description, isPublic });

      message.success(globalLocaleText('dataset.create.success'));
      setDatasetId(id);
    } catch (error) {
      message.error(globalLocaleText('dataset.create.error', { error }));
    }

    return true;
  };

  const handleUpdateDataset = async (values: newDatasetForm) => {
    const { name, description, isPublic } = values;

    if (!pageState?.datasetId) {
      message.warning(globalLocaleText('dataset.update.warn'));
      return;
    }

    try {
      await updateDataset(pageState.datasetId, { name, description, isPublic });
      message.success(globalLocaleText('dataset.update.success'));
    } catch (error) {
      message.error(globalLocaleText('dataset.update.error', { error }));
    }

    loadDatasetInfo();
  };

  const handleImportImages = async (values: any) => {
    if (!values?.imageUrl || size(values?.imageUrl) === 0) {
      message.warning(globalLocaleText('dataset.import.warn'));
      return;
    }

    const imageList = map(split(values?.imageUrl, ','), (url) => {
      const _obj = {
        imageUrl: url,
      };
      return _obj;
    });

    try {
      await importImages({ datasetId, imageList });
      message.success(globalLocaleText('dataset.import.success'));
    } catch (error) {
      message.error(globalLocaleText('dataset.import.error', { error }));
    }

    loadImgList();
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
