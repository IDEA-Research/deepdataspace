import { history, useModel } from '@umijs/max';
import copy from 'copy-to-clipboard';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { message } from 'antd';
import { getUrlQueryVal } from 'dds-utils/url';
import { globalLocaleText } from 'dds-utils/locale';
import { PaginationState } from '@/models/datasets';
import { NsDataSet } from '@/types/dataset';

export default () => {
  const { loadDatasets, setPagination } = useModel('datasets');
  const labType = getUrlQueryVal('type') || 'flagtool';

  const onClickItem = (item: NsDataSet.DataSet) => {
    const pageState = JSON.stringify({
      datasetId: item.id,
      datasetName: item.name,
    });
    history.push(`/lab/${labType}?pageState=${encodeURIComponent(pageState)}`);
  };

  const onClickCopyLink = (
    e: React.UIEvent<HTMLElement, UIEvent>,
    item: NsDataSet.DataSet,
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
      message.success(globalLocaleText('lab.onClickCopyLink.success'));
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
    labType,
    onInitPageState,
    onClickItem,
    onClickCopyLink,
  };
};
