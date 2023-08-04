import { RunningErrorTip } from 'dds-components';
import React from 'react';

export default () => {
  return (
    <RunningErrorTip
      error={new Error()}
      componentStack="testing errors"
      resetError={() => console.log('reset error')}
    />
  );
};
