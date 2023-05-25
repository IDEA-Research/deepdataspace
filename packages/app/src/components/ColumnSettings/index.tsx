import React from 'react';
import { Dropdown, Slider } from 'antd';
import { ReactComponent as SettingsIcon } from '@/assets/svg/settings.svg';
import { ReactComponent as PlusIcon } from '@/assets/svg/plus.svg';
import { ReactComponent as MinusIcon } from '@/assets/svg/minus.svg';
import { IMG_CLOUMN_COUNT_MAX } from '@/constants';
import { useLocale } from '@/locales/helper';
import styles from './index.less';

export interface IProps {
  cloumnCount: number;
  onColumnCountChange: (countState: number | boolean) => void;
}

const ColumnSettings: React.FC<IProps> = (props) => {
  const { localeText } = useLocale();
  const { cloumnCount, onColumnCountChange } = props;

  return (
    <Dropdown
      overlayClassName={styles.dropper}
      getPopupContainer={() => document.getElementById('filterWrap')!}
      dropdownRender={() => (
        <div className={styles.settingsPanel}>
          <div className={styles.itemTitle}>
            {localeText('dataset.detail.columnSetting.title')}
          </div>
          <div className={styles.itemContent}>
            <Slider
              min={1}
              max={IMG_CLOUMN_COUNT_MAX}
              onChange={(value) => onColumnCountChange(value)}
              value={cloumnCount}
              className={styles.slider}
            />
            <div className={styles.numBox}>
              <MinusIcon onClick={() => onColumnCountChange(false)} />
              <div className={styles.num}>{cloumnCount}</div>
              <PlusIcon onClick={() => onColumnCountChange(true)} />
            </div>
          </div>
        </div>
      )}
    >
      <div className={styles.settingsBtn}>
        <SettingsIcon />
      </div>
    </Dropdown>
  );
};

export default ColumnSettings;
