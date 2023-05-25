import { useState } from 'react';

export default () => {
  /** Loading */
  const [loading, setLoading] = useState(false);

  return {
    loading,
    setLoading,
  };
};
