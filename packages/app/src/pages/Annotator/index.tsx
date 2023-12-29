import React from 'react';
import QuickLabel from 'dds-components/QuickLabel';
import { useModel } from '@umijs/max';

const Page: React.FC = () => {
  const props = useModel('Annotator.model');
  return <QuickLabel {...props} />;
};

export default Page;
