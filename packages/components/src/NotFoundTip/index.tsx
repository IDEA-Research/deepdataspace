import React from 'react';
import { history } from '@umijs/max';
import { Button, Result } from 'antd';
import { globalLocaleText } from 'dds-utils/locale';

const NotFoundTip: React.FC = () => (
  <div
    style={{
      position: 'relative',
      height: '100vh',
      width: '100%',
      backgroundColor: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Result
      status="404"
      title="404"
      subTitle={globalLocaleText('NotFoundTip.title')}
      extra={
        <Button type="primary" onClick={() => history.push('/')}>
          {globalLocaleText('NotFoundTip.backHome')}
        </Button>
      }
    />
  </div>
);

export default NotFoundTip;
