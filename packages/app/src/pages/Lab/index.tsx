import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, List } from 'antd';
import { history } from '@umijs/max';
import { useLocale } from '@/locales/helper';
import styles from './index.less';

const Page: React.FC = () => {
  const { localeText } = useLocale();
  const _title = localeText('lab.card.title'),
    _subTitle = localeText('lab.card.subTitle');

  const listData = [
    {
      title: _title,
      subTitle: _subTitle,
      image: require('@/assets/images/cards/flagtool.png'),
      link: '/lab/datasets?type=flagtool',
    },
  ];

  return (
    <PageContainer className={styles.page} fixedHeader>
      <List
        className={styles.list}
        dataSource={listData}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              className={styles.card}
              onClick={() => history.push(item.link)}
              bodyStyle={{ padding: 0 }}
            >
              <img src={item.image} alt={item.title} />
              <div className={styles.content}>
                <div className={styles.title}>{item.title}</div>
                <div className={styles.subTitle}>{item.subTitle}</div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </PageContainer>
  );
};

export default Page;
