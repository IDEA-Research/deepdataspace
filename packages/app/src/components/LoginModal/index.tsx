import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Modal } from 'antd';
import LoginLogo from '@/assets/images/favicon.png';
import { useLocale } from 'dds-utils/locale';
import { useModel } from '@umijs/max';

export const LOGIN_TITLE = 'Deep Data Space';
export const LOGIN_SUB_TITLE = 'Dive Debug Solve';
export const LOGIN_LOGO = LoginLogo;

export const LoginFormItems = () => {
  const { localeText } = useLocale();
  return (
    <>
      <ProFormText
        name="username"
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined className={'prefixIcon'} />,
        }}
        placeholder={localeText('username')}
        rules={[
          {
            required: true,
            message: localeText('usernameTip'),
          },
        ]}
      />
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined className={'prefixIcon'} />,
        }}
        placeholder={localeText('password')}
        rules={[
          {
            required: true,
            message: localeText('passwordTip'),
          },
        ]}
      />
    </>
  );
};

export const LoginModal: React.FC = () => {
  const { onLogin, showLoginModal, setShowLoginModal } = useModel('user');

  return (
    <Modal
      open={showLoginModal}
      onCancel={() => setShowLoginModal(false)}
      mask={true}
      maskClosable={true}
      footer={null}
    >
      <LoginForm
        logo={LOGIN_LOGO}
        title={LOGIN_TITLE}
        subTitle={LOGIN_SUB_TITLE}
        onFinish={onLogin}
      >
        <LoginFormItems />
      </LoginForm>
    </Modal>
  );
};

export default LoginModal;
