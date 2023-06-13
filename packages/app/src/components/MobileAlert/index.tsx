import React from 'react';
import { Result } from 'antd';
import { globalLocaleText } from '@/locales/helper';

const MobileAlert: React.FC = () => (
  <div
    style={{
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
      title={globalLocaleText('mobileAlert.title')}
      subTitle={globalLocaleText('mobileAlert.subTitle')}
    />
  </div>
);

export default MobileAlert;
