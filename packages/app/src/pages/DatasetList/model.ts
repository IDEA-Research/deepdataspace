import { history } from '@umijs/max';
import copy from 'copy-to-clipboard';
import useDatasetListLoader from '@/hooks/useDatasetListLoader';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { message } from 'antd';
import { DATA } from '@/services/type';
import { globalLocaleText } from '@/locales/helper';

interface PageState {
  page: number;
  pageSize: number;
}

export default () => {
  const {
    loading,
    pagination,
    datasetsData,
    loadDatasets,
    setPagination,
    onPageChange,
  } = useDatasetListLoader();

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

  const pageState: PageState = {
    ...pagination,
  };

  const onInitPageState = (urlPageState: PageState) => {
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

  return {
    loading,
    pageState,
    onInitPageState,
    datasetsData,
    onClickItem,
    onClickCopyLink,
    onPageChange,
  };
};
