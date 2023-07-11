import { useImmer } from 'use-immer';
import { useRequest } from 'ahooks';
import { fetchDatasetList } from '@/services/dataset';
import { DEFAULT_PAGE_SIZE } from '@/constants';
import { DATA } from '@/services/type';

export interface PaginationState {
  page: number;
  pageSize: number;
  isPublic: string;
}

export interface DatasetsData {
  list: DATA.DataSet[];
  total: number;
}

export default () => {
  const [pagination, setPagination] = useImmer<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    isPublic: 'true',
  });
  const [datasetsData, setDatasetsData] = useImmer<DatasetsData>({
    list: [],
    total: 0,
  });
  const [datasetId, setDatasetId] = useImmer('');

  const { loading, run: loadDatasets } = useRequest(
    (page?: number, pageSize?: number, isPublic?: string) => {
      return fetchDatasetList({
        pageNum: page || pagination.page,
        pageSize: pageSize || pagination.pageSize,
        isPublic: isPublic || pagination.isPublic,
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

  const onPageChange = (page: number, size: number) => {
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
    datasetId,
    loadDatasets,
    setPagination,
    onPageChange,
    setDatasetId,
  };
};
