import { RunningErrorTip } from 'dds-component';
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
