import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button, List, Pagination, Tabs } from 'antd';
import { useModel } from '@umijs/max';
import usePageModelLifeCycle from '@/hooks/usePageModelLifeCycle';
import styles from './index.less';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants';
import { LocaleText, useLocale } from '@/locales/helper';
import DatasetItem from '@/components/DatasetItem';
import NewDatasetModal from './components/NewDatasetModal';

const HomePage: React.FC = () => {
  const { loading, pagination, datasetsData, onPageChange } =
    useModel('datasets');
  const { onInitPageState, onClickItem, onClickCopyLink, updateListFilter } =
    useModel('DatasetList.model');
  usePageModelLifeCycle({ onInitPageState, pageState: pagination });
  const [openModal, setModalOpen] = useState(false);
  const { localeText } = useLocale();

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
        <Button onClick={() => setModalOpen(true)}>
          {localeText('dataset.filter.newDataset')}
        </Button>
        <Tabs
          activeKey={pagination?.isPublic}
          onChange={updateListFilter}
          items={[
            {
              key: 'true',
              label: localeText('dataset.filter.public'),
            },
            {
              key: 'false',
              label: localeText('dataset.filter.private'),
            },
          ]}
        />
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
      <NewDatasetModal open={openModal} setOpen={setModalOpen} />
    </PageContainer>
  );
};

export default HomePage;
