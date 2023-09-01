import GlobalLoading from '@/GlobalLoading';

export default () => {
  return (
    <GlobalLoading active>
      <div
        style={{ backgroundColor: 'red', height: '100px', width: '100px' }}
      />
    </GlobalLoading>
  );
};
