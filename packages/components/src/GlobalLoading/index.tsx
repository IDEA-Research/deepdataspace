import { Spin } from 'antd';
import React from 'react';
interface IGlobalLoadingProps {
  children: React.ReactNode;
  active: boolean;
  tip?: string;
}

const GlobalLoading: React.FC<IGlobalLoadingProps> = ({
  children,
  active,
  tip,
}) => {
  return (
    <Spin
      size="large"
      spinning={active}
      delay={500}
      style={{
        maxHeight: 'none',
        opacity: 0.3,
      }}
      tip={tip}
    >
      {children}
    </Spin>
  );
};

export default GlobalLoading;
