import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { history, useLocation } from '@umijs/max';
import { Card, List, Menu, Modal } from 'antd';
import {
  DatabaseOutlined,
  GatewayOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/locales/helper';
import styles from './index.less';

interface IProps {
  collapsed: boolean;
}

const CustomMenu: React.FC<IProps> = ({ collapsed }) => {
  const { localeText } = useLocale();
  const { pathname } = useLocation();
  const [showAnnotateModal, setShowAnnotateModal] = useState(false);

  const menu = useMemo(
    () => [
      {
        key: 'Dataset',
        label: localeText(`menu.Dataset`),
        title: '',
        icon: <DatabaseOutlined />,
        link: '/dataset',
      },
      {
        key: 'Annotate',
        label: localeText(`annotate`),
        title: '',
        icon: <GatewayOutlined />,
        action: () => {
          setShowAnnotateModal(true);
        },
      },
      {
        key: 'Lab',
        label: localeText(`menu.Lab`),
        title: '',
        icon: <BulbOutlined />,
        link: '/lab',
      },
    ],
    [],
  );

  const annotationWays = [
    {
      title: localeText('annotate.quick'),
      subTitle: localeText('annotate.quick.desc'),
      image: require('@/assets/images/cards/annotate_quick.png'),
      link: '/page/annotator',
    },
    {
      title: localeText('annotate.collaborative'),
      subTitle: localeText('annotate.collaborative.desc'),
      image: require('@/assets/images/cards/annotate_coop.png'),
      link: '/page/project',
    },
  ];

  const [selectedKeys, setSelectedKeys] = useState(() => {
    const matchItem = menu.find(
      (item) => item.link && pathname.indexOf(item.link) === 0,
    );
    if (matchItem) return [matchItem.key];
    return [];
  });

  const clickMenuItem = ({ key }: { key: string }) => {
    const item = menu.find((item) => item.key === key);
    if (item?.action) {
      item.action();
    } else {
      history.push(item?.link);
      setSelectedKeys([key]);
    }
  };

  const clickCardItem = (link: string) => {
    window.open(link, '_blank');
    // setShowAnnotateModal(false);
  };

  return (
    <>
      <Menu
        theme="light"
        mode="inline"
        className={classNames(styles.menu, {
          [styles.menuCollapsed]: collapsed,
        })}
        selectedKeys={selectedKeys}
        items={menu}
        defaultChecked
        onClick={clickMenuItem}
      />
      <Modal
        title={localeText('annotate')}
        footer={null}
        closable={false}
        centered
        open={showAnnotateModal}
        width={724}
        onCancel={() => setShowAnnotateModal(false)}
      >
        <List
          grid={{ gutter: 16, column: 2 }}
          className={styles.annotationWays}
          dataSource={annotationWays}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                className={styles.card}
                onClick={() => clickCardItem(item.link)}
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
      </Modal>
    </>
  );
};

export default CustomMenu;
