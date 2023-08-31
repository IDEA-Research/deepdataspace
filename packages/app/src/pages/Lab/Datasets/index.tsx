import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { List } from 'antd';
import { useModel } from '@umijs/max';
import { usePageModelLifeCycle } from 'dds-hooks';
import DatasetItem from '@/components/DatasetItem';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { backPath } from 'dds-utils/url';
import styles from './index.less';
import { globalLocaleText } from 'dds-utils/locale';
import { DynamicPagination } from 'dds-components';

const HomePage: React.FC = () => {
  const { loading, pagination, datasetsData, onPageChange, onPageSizeChange } =
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
            />
          )}
        />
      </div>
      {!loading && (
        <DynamicPagination
          current={pagination.page}
          size={pagination.pageSize}
          total={datasetsData.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </PageContainer>
  );
};

export default HomePage;
