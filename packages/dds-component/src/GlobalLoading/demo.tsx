import { GlobalLoading } from 'dds-component';
import React from 'react';

export default () => {
  return (
    <GlobalLoading active>
      <div
        style={{ backgroundColor: 'red', height: '100px', width: '100px' }}
      />
    </GlobalLoading>
  );
};
