import { useModel } from '@umijs/max';
import { useKeyPress } from 'ahooks';
import { DEFAULT_PAGE_DATA, DEFAULT_PAGE_STATE } from '@/models/dataset/type';

export default () => {
  const { showLoginModal } = useModel('user');
  const { pageState, setPageState, pageData, setPageData } =
    useModel('dataset.common');
  const { selectItem, enterFlagTools, limitNoSaveChangePage } =
    useModel('dataset.flag');

  const clickItem = (index: number) => {
    selectItem(index);
  };

  const doubleClickItem = (index: number) => {
    setPageState((s) => {
      s.previewIndex = index;
    });
  };

  const onPageChange = (page: number) => {
    if (pageState.page === page) return;
    limitNoSaveChangePage().then(() => {
      setPageState((s) => {
        s.page = page;
      });
    });
  };

  const onPageSizeChange = (_current: number, size: number) => {
    limitNoSaveChangePage().then(() => {
      setPageState((s) => {
        s.pageSize = size;
      });
    });
  };

  /**
   * Next page：D
   * Previous page：A
   */
  useKeyPress(
    ['a', 'A', 'd', 'D', 'shift.q', 'shift.Q', 'shift.e', 'shift.E', 'z', 'Z'],
    (e: KeyboardEvent) => {
      if (pageState.previewIndex >= 0 || showLoginModal) {
        return;
      }
      if (['a', 'A'].includes(e.key) && pageState.page > 1) {
        onPageChange(pageState.page - 1);
      }
      if (
        ['d', 'D'].includes(e.key) &&
        pageState.page < Math.ceil(pageData.total / pageState.pageSize)
      ) {
        onPageChange(pageState.page + 1);
      }
    },
  );

  const onPageDidMount = () => {
    // Default enter flag
    enterFlagTools();
  };

  const onPageWillUnmount = () => {
    // Clear page data and status.
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
