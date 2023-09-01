import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { List } from 'antd';
import { useModel } from '@umijs/max';
import { usePageModelLifeCycle } from 'dds-hooks';
import styles from './index.less';
import { LocaleText } from 'dds-utils/locale';
import DatasetItem from '@/components/DatasetItem';
import { DynamicPagination } from 'dds-components';

const HomePage: React.FC = () => {
  const { loading, pagination, datasetsData, onPageChange, onPageSizeChange } =
    useModel('datasets');
  const { onInitPageState, onClickItem, onClickCopyLink } =
    useModel('DatasetList.model');
  usePageModelLifeCycle({ onInitPageState, pageState: pagination });

  return (
    <PageContainer
      title={false}
      pageHeaderRender={() => null}
      className={styles.page}
    >
      <div className={styles.container}>
        <img
          className={styles.banner}
          alt="banner"
          src={require('@/assets/images/home_banner.png')}
        />
        <div className={styles.listTitle}>
          <LocaleText id="datasets" />
        </div>
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
