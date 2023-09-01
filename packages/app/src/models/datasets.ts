import { useImmer } from 'use-immer';
import { useRequest } from 'ahooks';
import { fetchDatasetList } from '@/services/dataset';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { NsDataSet } from '@/types/dataset';

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface DatasetsData {
  list: NsDataSet.DataSet[];
  total: number;
}

export default () => {
  const [pagination, setPagination] = useImmer<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [datasetsData, setDatasetsData] = useImmer<DatasetsData>({
    list: [],
    total: 0,
  });

  const { loading, run: loadDatasets } = useRequest(
    (page?: number, pageSize?: number) => {
      return fetchDatasetList({
        pageNum: page || pagination.page,
        pageSize: pageSize || pagination.pageSize,
      });
    },
    {
      manual: true,
      debounceWait: 100,
      refreshDeps: [pagination.page, pagination.pageSize],
      onSuccess: ({ datasetList, total }) => {
        setDatasetsData((s) => {
          s.list = datasetList;
          s.total = total;
        });
      },
      onError: () => {},
    },
  );

  const onPageChange = (page: number) => {
    setPagination((s) => {
      s.page = page;
    });
    loadDatasets(page);
  };

  const onPageSizeChange = (page: number, size: number) => {
    setPagination((s) => {
      s.page = page;
      s.pageSize = size;
    });
    loadDatasets(page, size);
  };

  return {
    loading,
    pagination,
    datasetsData,
    loadDatasets,
    setPagination,
    onPageChange,
    onPageSizeChange,
  };
};
