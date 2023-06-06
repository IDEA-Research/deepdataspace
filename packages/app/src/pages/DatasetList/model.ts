import { history, useModel } from '@umijs/max';
import copy from 'copy-to-clipboard';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { message } from 'antd';
import { DATA } from '@/services/type';
import { globalLocaleText } from '@/locales/helper';
import { PaginationState } from '@/models/datasets';

export default () => {
  const { loadDatasets, setPagination } = useModel('datasets');

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

  return {
    onInitPageState,
    onClickItem,
    onClickCopyLink,
  };
};
