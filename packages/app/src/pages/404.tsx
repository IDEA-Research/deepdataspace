import React from 'react';
import { history } from '@umijs/max';
import { Button, Result } from 'antd';
import { globalLocaleText } from '@/locales/helper';

const NoFoundPage: React.FC = () => (
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
      subTitle={globalLocaleText('notFound.title')}
      extra={
        <Button type="primary" onClick={() => history.push('/')}>
          {globalLocaleText('notFound.backHome')}
        </Button>
      }
    />
  </div>
);

export default NoFoundPage;
