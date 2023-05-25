import { Spin } from 'antd';
import { ReactNode } from 'react';

interface IGlobalLoadingProps {
  children: ReactNode;
  active: boolean;
  tip?: string;
}

const GlobalLoading: React.FC<IGlobalLoadingProps> = ({ children, active }) => {
  return (
    <Spin
      size="large"
      spinning={active}
      delay={500}
      style={{
        zIndex: 99999,
        maxHeight: '100%',
        backgroundColor: '#E6F7FF',
        opacity: 0.2,
      }}
    >
      {children}
    </Spin>
  );
};

export default GlobalLoading;
