import {
  LoginOutlined,
  LogoutOutlined,
  ProjectOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useModel, SelectLang, history } from '@umijs/max';
import { Button, Divider, Dropdown, Space } from 'antd';
import { useLocale } from '@/locales/helper';

const UserMenu: React.FC<{ username: string; onLogout: () => void }> = (
  props,
) => {
  const { localeText } = useLocale();
  const menuItems = [
    {
      label: localeText('logout'),
      key: 'accout-logout',
      icon: <LogoutOutlined />,
      onClick: props.onLogout,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }}>
      <Button>
        <Space>
          <UserOutlined />
          {props.username}
        </Space>
      </Button>
    </Dropdown>
  );
};

const NavHeader: React.FC = () => {
  const { localeText } = useLocale();
  const { user, limitLoginAction, onLogout } = useModel('user');

  const openProjectPage = () => {
    history.push('/project');
  };

  return (
    <Space>
      <Button icon={<ProjectOutlined />} onClick={openProjectPage}>
        {localeText('project')}
      </Button>

      <Divider type="vertical"></Divider>

      {user.isLogin ? (
        <UserMenu username={user.username!} onLogout={onLogout} />
      ) : (
        <Button icon={<LoginOutlined />} onClick={limitLoginAction}>
          {localeText('login')}
        </Button>
      )}

      <SelectLang reload />
    </Space>
  );
};

export default NavHeader;
