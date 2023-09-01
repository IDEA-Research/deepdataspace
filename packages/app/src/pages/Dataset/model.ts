import { useModel } from '@umijs/max';
import { DEFAULT_PAGE_DATA, DEFAULT_PAGE_STATE } from '@/models/dataset/type';

export default () => {
  /** The import order here will affect whether internal calls to each other are successful. */
  const { pageState, setPageState, setPageData } = useModel('dataset.common');

  const clickItem = (index: number) => {
    setPageState((s) => {
      s.previewIndex = index;
    });
  };

  const doubleClickItem = (index: number) => {
    setPageState((s) => {
      s.previewIndex = index;
    });
  };

  const onPageChange = (page: number) => {
    if (pageState.page === page) return;
    setPageState((s) => {
      s.page = page;
    });
  };

  const onPageSizeChange = (_current: number, size: number) => {
    setPageState((s) => {
      s.pageSize = size;
    });
  };

  const onPageDidMount = () => {
    // todo
  };

  const onPageWillUnmount = () => {
    setPageData((s) => {
      Object.assign(s, DEFAULT_PAGE_DATA);
    });
    setPageState((s) => {
      Object.assign(s, DEFAULT_PAGE_STATE);
    });
  };

  return {
    onPageDidMount,
    onPageWillUnmount,
    clickItem,
    doubleClickItem,
    onPageChange,
    onPageSizeChange,
  };
};
