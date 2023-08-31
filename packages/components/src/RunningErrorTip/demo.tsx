import RunningErrorTip from '@/RunningErrorTip';

export default () => {
  return (
    <RunningErrorTip
      error={new Error()}
      componentStack="testing errors"
      resetError={() => console.log('reset error')}
    />
  );
};
