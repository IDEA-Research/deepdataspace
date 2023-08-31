import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Layout, Tooltip } from 'antd';
import {
  Link,
  Outlet,
  setLocale,
  useLocation,
  useModel,
  getLocale,
} from '@umijs/max';
import { GlobalLoading, LangSelector, MobileAlert } from 'dds-components';
import { STORAGE_KEY } from '@/constants';
import LoginModal from '@/components/LoginModal';
import {
  FileSearchOutlined,
  LeftOutlined,
  LoginOutlined,
  LogoutOutlined,
  RightOutlined,
} from '@ant-design/icons';
import routes from '@/routes';
import classNames from 'classnames';
import { useLocale } from 'dds-utils/locale';
import CustomMenu from './menu';
import { useSize } from 'ahooks';
import styles from './index.less';

const SLIDER_WIDTH = 226;
const SLIDER_COLLAPSED_WIDTH = 88;

export default () => {
  const { loading, loadingTip } = useModel('global');
  const { user, setUser, checkLoginStatus, limitLoginAction, onLogout } =
    useModel('user');
  const { pathname } = useLocation();
  const { localeText } = useLocale();
  const [collapsed, setCollapsed] = useState(true);
  const { isMobile, setFixSliderWidth } = useModel('global');

  /** Compute hide slider paths */
  const hideSiderPaths = useMemo(() => {
    const paths: string[] = [];
    routes.forEach((item) => {
      if (item.routes) {
        if (item.hideSider) {
          paths.push(...item.routes.map((sub) => sub.path));
        } else {
          item.routes.forEach((sub) => {
            // @ts-ignore
            if (sub?.hideSider) paths.push(sub.path);
          });
        }
      } else if (item.hideSider && item.path) {
        paths.push(item.path);
      }
    });
    return paths;
  }, []);

  // update fixSlider width
  const size = useSize(() => document.querySelector('#fixSlider'));

  useEffect(() => {
    setFixSliderWidth(size?.width || 0);
  }, [size?.width]);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY.AUTH_TOKEN)) {
      setUser({
        isLogin: false,
      });
    }
  }, [localStorage.getItem(STORAGE_KEY.AUTH_TOKEN)]);

  const sliderWidth = collapsed
    ? `${SLIDER_COLLAPSED_WIDTH}px`
    : `${SLIDER_WIDTH}px`;

  const renderSilder = () => {
    if (hideSiderPaths.find((item) => item && pathname.includes(item))) {
      return <></>;
    } else {
      return (
        <>
          <div
            className={styles.fixSlider}
            style={{
              width: sliderWidth,
              minWidth: sliderWidth,
              maxWidth: sliderWidth,
            }}
          />
          <Layout.Sider
            id="fixSlider"
            className={styles.slider}
            theme="light"
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={SLIDER_WIDTH}
            collapsedWidth={SLIDER_COLLAPSED_WIDTH}
          >
            <div
              className={styles.sliderHeader}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <Link to="/">
                <img alt="logo" src={require('@/assets/images/favicon.png')} />
                {!collapsed && <h1>Deep Data Space</h1>}
              </Link>
            </div>
            <CustomMenu collapsed={collapsed} />
            <div
              className={classNames(styles.bottomActions, {
                [styles.collapsedActions]: collapsed,
              })}
            >
              {/* <div className={styles.userBlock}> */}
              {user.isLogin ? (
                <Dropdown
                  placement="topRight"
                  menu={{
                    items: [
                      {
                        title: '',
                        label: localeText('logout'),
                        key: 'accout-logout',
                        icon: <LogoutOutlined />,
                        onClick: onLogout,
                      },
                    ],
                  }}
                >
                  <div className={styles.userBlock}>
                    <Button type="text" className={styles.userBtn}>
                      {user.username?.slice(0, 2)}
                    </Button>
                    {!collapsed && (
                      <span className={styles.userName}>{user.username}</span>
                    )}
                  </div>
                </Dropdown>
              ) : (
                <div className={styles.userBlock}>
                  <Button
                    type="text"
                    className={styles.userBtn}
                    onClick={limitLoginAction}
                  >
                    {collapsed ? localeText('login') : <LoginOutlined />}
                  </Button>
                  {!collapsed && (
                    <span className={styles.userName}>
                      {localeText('login')}
                    </span>
                  )}
                </div>
              )}
              {/* </div> */}
              <Tooltip placement="right" title={localeText('docs')}>
                <a
                  href="https://docs.deepdataspace.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    className={styles.docsBtn}
                    type="text"
                    icon={<FileSearchOutlined />}
                  />
                </a>
              </Tooltip>
              <LangSelector getLocale={getLocale} setLocale={setLocale} />
            </div>
            <div
              onClick={() => setCollapsed(!collapsed)}
              className={styles.collapseBtn}
            >
              {collapsed ? <RightOutlined /> : <LeftOutlined />}
            </div>
          </Layout.Sider>
        </>
      );
    }
  };

  return isMobile ? (
    <MobileAlert />
  ) : (
    <GlobalLoading active={loading} tip={loadingTip}>
      <Layout>
        {renderSilder()}
        <Layout>
          <Outlet />
        </Layout>
        <LoginModal />
      </Layout>
    </GlobalLoading>
  );
};
