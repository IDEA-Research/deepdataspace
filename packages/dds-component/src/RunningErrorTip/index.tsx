import { Button, Modal, Result } from 'antd';
import React from 'react';

interface IProps {
  error: Error;
  componentStack: string;
  resetError: () => void;
}

const RunningErrorTip: React.FC<IProps> = ({
  error,
  componentStack,
  resetError,
}) => {
  const showErrorDetail = () => {
    Modal.error({
      title: error.toString(),
      content: (
        <div style={{ height: '60vh', overflowY: 'scroll' }}>
          <p>{componentStack}</p>
        </div>
      ),
      onOk() {},
      maskClosable: true,
      width: '80vw',
    });
  };

  return (
    <div
      style={{
        position: 'relative',
        height: 'calc(100vh - 64px)',
        width: '100%',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Result
        status="500"
        title="Running Error"
        subTitle="Sorry, something went wrong."
        extra={[
          <Button key="bt1" type="primary" onClick={resetError}>
            Click here to reset
          </Button>,
          <Button key="bt2" onClick={showErrorDetail}>
            Error Detail
          </Button>,
        ]}
      />
    </div>
  );
};

export default RunningErrorTip;
