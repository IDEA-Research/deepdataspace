import React from 'react';
import { Dropdown, Slider } from 'antd';
import { ReactComponent as SettingsIcon } from './assets/settings.svg';
import { ReactComponent as PlusIcon } from './assets/plus.svg';
import { ReactComponent as MinusIcon } from './assets/minus.svg';
import { useLocale } from 'dds-utils/locale';
import './index.less';

export interface IProps {
  cloumnCount: number;
  maxCloumnCount?: number;
  onColumnCountChange: (countState: number | boolean) => void;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}

const ColumnSettings: React.FC<IProps> = (props) => {
  const { localeText } = useLocale();
  const {
    cloumnCount,
    maxCloumnCount = 8,
    onColumnCountChange,
    getPopupContainer,
  } = props;

  return (
    <Dropdown
      getPopupContainer={getPopupContainer}
      dropdownRender={() => (
        <div className="dds-column-settings-panel">
          <div className="item-title">{localeText('ColumnSettings.title')}</div>
          <div className="item-content">
            <Slider
              min={1}
              max={maxCloumnCount}
              onChange={(value) => onColumnCountChange(value)}
              value={cloumnCount}
              className="slider"
            />
            <div className="num-box">
              <MinusIcon onClick={() => onColumnCountChange(false)} />
              <div className="num">{cloumnCount}</div>
              <PlusIcon onClick={() => onColumnCountChange(true)} />
            </div>
          </div>
        </div>
      )}
    >
      <div className="dds-column-settings-btn">
        <SettingsIcon />
      </div>
    </Dropdown>
  );
};

export default ColumnSettings;
