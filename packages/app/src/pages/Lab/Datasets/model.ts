import { history, useModel } from '@umijs/max';
import copy from 'copy-to-clipboard';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { message } from 'antd';
import { DATA } from '@/services/type';
import { getUrlQueryVal } from '@/utils/url';
import { globalLocaleText } from '@/locales/helper';
import { PaginationState } from '@/models/datasets';

export default () => {
  const { loadDatasets, setPagination } = useModel('datasets');
  const labType = getUrlQueryVal('type') || 'flagtool';

  const onClickItem = (item: DATA.DataSet) => {
    const pageState = JSON.stringify({
      datasetId: item.id,
      datasetName: item.name,
    });
    history.push(`/lab/${labType}?pageState=${encodeURIComponent(pageState)}`);
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
          isPublic: 'false', // Only private datasets are avaliable in flag tool
        },
        urlPageState,
      );
    });
    loadDatasets(1, DEFAULT_PAGE_SIZE, 'false'); // Force to fetch private dataset for flag tool
  };

  return {
    labType,
    onInitPageState,
    onClickItem,
    onClickCopyLink,
  };
};
