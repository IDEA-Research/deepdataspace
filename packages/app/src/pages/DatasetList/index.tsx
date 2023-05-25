import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { List, Pagination } from 'antd';
import { useModel } from '@umijs/max';
import usePageModelLifeCycle from '@/hooks/usePageModelLifeCycle';
import styles from './index.less';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants';
import { LocaleText } from '@/locales/helper';
import DatasetItem from '@/components/DatasetItem';

const HomePage: React.FC = () => {
  const {
    pageState,
    onInitPageState,
    loading,
    datasetsData,
    onClickItem,
    onClickCopyLink,
    onPageChange,
  } = useModel('DatasetList.model');
  usePageModelLifeCycle({ onInitPageState, pageState });

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
        <div className={styles.pagination}>
          <Pagination
            current={pageState.page}
            pageSize={pageState.pageSize}
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
