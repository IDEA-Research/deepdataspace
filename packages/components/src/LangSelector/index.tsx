import { Button, Tooltip } from 'antd';
import { TooltipPlacement } from 'antd/es/tooltip';
import React, { useMemo } from 'react';
import './index.less';

export enum LocaleLang {
  en = 'en-US',
  zh = 'zh-CN',
}

interface IProps {
  getLocale: () => LocaleLang;
  setLocale: (targetLocale: LocaleLang) => void;
  tooltipPlacement?: TooltipPlacement;
  theme?: 'light' | 'dark';
  className?: string;
}

const LangSelector: React.FC<IProps> = ({
  getLocale,
  setLocale,
  tooltipPlacement = 'right',
  theme = 'light',
  className,
}) => {
  const curLocale: LocaleLang = getLocale();
  const changelocaleLang = () => {
    const targetLocale =
      curLocale === LocaleLang.zh ? LocaleLang.en : LocaleLang.zh;
    setLocale(targetLocale);
  };

  const [enClassName, zhClassName] = useMemo(() => {
    if (curLocale === LocaleLang.zh) {
      return [`change-lang change-lang-${theme}`, `cur-lang cur-lang-${theme}`];
    } else {
      return [`cur-lang cur-lang-${theme}`, `change-lang change-lang-${theme}`];
    }
  }, [theme, curLocale]);
  return (
    <Tooltip
      placement={tooltipPlacement}
      title={curLocale === LocaleLang.zh ? '中文 / English' : 'English / 中文'}
    >
      <Button
        type="text"
        className={`dds-lang-selector ${className}`}
        onClick={changelocaleLang}
      >
        <div>
          <span className={zhClassName}>中</span>
          <span className={enClassName}>En</span>
        </div>
      </Button>
    </Tooltip>
  );
};

export default LangSelector;
