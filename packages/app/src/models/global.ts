import { useState, useEffect } from 'react';
import { enquireScreen } from 'enquire-js';

let defaultMobile: boolean = false;
enquireScreen((b: boolean) => {
  defaultMobile = b;
});

export default () => {
  /** Loading */
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(defaultMobile);

  useEffect(() => {
    enquireScreen((b: boolean) => {
      setIsMobile(b);
    });
  }, []);

  return {
    loading,
    setLoading,
    isMobile,
  };
};
