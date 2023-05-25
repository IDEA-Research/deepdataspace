import React from 'react';
import { Spin } from 'antd';
import './index.less';

interface IGlobalLoadingProps {
  children: React.ReactNode;
  active: boolean;
  tip?: string;
}

const GlobalLoading: React.FC<IGlobalLoadingProps> = ({ children, active }) => {
  return (
    <Spin
      size="large"
      spinning={active}
      delay={500}
      className="dds-global-loading"
    >
      {children}
    </Spin>
  );
};

export default GlobalLoading;
