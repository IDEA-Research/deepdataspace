import { useState, useEffect } from 'react';
import { enquireScreen } from 'enquire-js';
import { useEventListener } from 'ahooks';

let defaultMobile: boolean = false;
enquireScreen((b: boolean) => {
  defaultMobile = b;
});

export default () => {
  /** Loading */
  const [loading, setLoading] = useState(false);
  const [loadingTip, setLoadingTip] = useState('');
  const [isMobile, setIsMobile] = useState(defaultMobile);
  const [fixSliderWidth, setFixSliderWidth] = useState(0);
  const [layoutInnerWidth, setLayoutInnerWidth] = useState(window.innerWidth);

  useEffect(() => {
    enquireScreen((b: boolean) => {
      setIsMobile(b);
    });
  }, []);

  useEffect(() => {
    setLayoutInnerWidth(window.innerWidth - fixSliderWidth);
  }, [fixSliderWidth]);

  useEventListener(
    'resize',
    () => {
      const _width = window.innerWidth - fixSliderWidth;
      setLayoutInnerWidth(_width);
    },
    { target: window },
  );

  return {
    loading,
    setLoading,
    loadingTip,
    setLoadingTip,
    isMobile,
    fixSliderWidth,
    setFixSliderWidth,
    layoutInnerWidth,
  };
};
