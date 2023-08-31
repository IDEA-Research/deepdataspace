import { getUrlQueryVal } from 'dds-utils/url';
import { LoginFormPage } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { history } from '@umijs/max';
import {
  LOGIN_TITLE,
  LOGIN_SUB_TITLE,
  LOGIN_LOGO,
  LoginFormItems,
} from '@/components/LoginModal';
import styles from './index.less';

const LoginPage: React.FC = () => {
  const { user, onLogin } = useModel('user');

  if (user.isLogin) {
    const redirPath = getUrlQueryVal('redirect');
    if (redirPath) {
      history.replace(redirPath);
    } else {
      history.replace('/');
    }
    return null;
  }

  return (
    <div className={styles.page}>
      <LoginFormPage
        logo={LOGIN_LOGO}
        title={LOGIN_TITLE}
        subTitle={LOGIN_SUB_TITLE}
        onFinish={onLogin}
      >
        <LoginFormItems />
      </LoginFormPage>
    </div>
  );
};

export default LoginPage;
