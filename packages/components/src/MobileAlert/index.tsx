import React from 'react';
import { Result } from 'antd';
import { globalLocaleText } from 'dds-utils/locale';

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
      title={globalLocaleText('MobileAlert.title')}
      subTitle={globalLocaleText('MobileAlert.subTitle')}
    />
  </div>
);

export default MobileAlert;
