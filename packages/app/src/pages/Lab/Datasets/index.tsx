import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { List, Pagination } from 'antd';
import { useModel } from '@umijs/max';
import usePageModelLifeCycle from '@/hooks/usePageModelLifeCycle';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants';
import DatasetItem from '@/components/DatasetItem';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { backPath } from '@/utils/url';
import styles from './index.less';
import { globalLocaleText } from '@/locales/helper';

const HomePage: React.FC = () => {
  const { loading, pagination, datasetsData, onPageChange } =
    useModel('datasets');
  const { labType, onInitPageState, onClickItem, onClickCopyLink } =
    useModel('Lab.Datasets.model');
  usePageModelLifeCycle({ onInitPageState, pageState: pagination });

  return (
    <PageContainer
      className={styles.page}
      header={{
        title: globalLocaleText(`menu.Lab.${labType}`),
        backIcon: <ArrowLeftOutlined />,
        onBack: () => backPath('/lab'),
        breadcrumb: {},
      }}
      fixedHeader
    >
      <div className={styles.container}>
        <List
          grid={{ gutter: 16, column: 4 }}
          loading={loading}
          dataSource={datasetsData.list}
          renderItem={(item) => (
            <DatasetItem
              data={item}
              onClickItem={onClickItem}
              onClickCopyLink={onClickCopyLink}
              supportExport
            />
          )}
        />
      </div>
      {!loading && (
        <div className={styles.pagination}>
          <Pagination
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={datasetsData.total}
            showSizeChanger
            showQuickJumper
            pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            onChange={onPageChange}
          />
        </div>
      )}
    </PageContainer>
  );
};

export default HomePage;
