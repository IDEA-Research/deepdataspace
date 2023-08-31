import React from 'react';
import { useModel } from '@umijs/max';
import { Button, Tooltip, Checkbox } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { ReactComponent as FlagIcon } from '@/assets/svg/flag.svg';
import {
  IMG_FLAG,
  IMG_FLAG_COLOR,
  IMG_FLAG_OPTIONS,
  IMG_FLAG_RESULTS,
} from '@/constants';
import { LocaleText } from 'dds-utils/locale';
import styles from './index.less';
import DropdownSelector from '@/components/DropdownSelector';

const FlagToolsBar: React.FC = () => {
  const { flagTools, flagStatus, pageSize } = useModel(
    'dataset.common',
    (model) => ({
      pageSize: model.pageState.pageSize,
      flagStatus: model.pageState.flagTools?.flagStatus,
      flagTools: model.pageState.flagTools && model.pageData.flagTools,
    }),
  );
  const {
    onChangeFlagStatus,
    changeSelectAll,
    antiSelect,
    saveFlag,
    updateOrder,
  } = useModel('dataset.flag');

  if (!flagTools) return null;

  return (
    <div className={styles.toolsBar}>
      <div className={styles.selector}>
        <Checkbox
          indeterminate={flagTools.count > 0 && flagTools.count !== pageSize}
          checked={flagTools?.count === pageSize}
          onChange={changeSelectAll}
        >
          {flagTools.count === 0 ? (
            <LocaleText id="lab.toolsBar.selectAll" />
          ) : (
            <LocaleText
              id="lab.toolsBar.selectSome"
              values={{ num: flagTools.count }}
            />
          )}
        </Checkbox>
        <Button onClick={() => antiSelect()} className={styles.antiBtn}>
          <LocaleText id="lab.toolsBar.selectInvert" />
        </Button>
        {/* flag status filter */}
        <DropdownSelector
          data={IMG_FLAG_OPTIONS}
          value={flagStatus}
          filterOptionName={(option) => option.name}
          filterOptionValue={(option) => option.value}
          onChange={(value) => onChangeFlagStatus(value as IMG_FLAG)}
          ghost={false}
          type="default"
          className={styles.antiBtn}
        >
          <LocaleText id="lab.toolsBar.filter" /> :{' '}
          {IMG_FLAG_OPTIONS.find((item) => item.value === flagStatus)?.name}
        </DropdownSelector>

        <div className={styles.flagTip}>
          <LocaleText id="lab.toolsBar.saveAs" />：
        </div>
        {IMG_FLAG_RESULTS.map((item) => (
          <Tooltip key={item.value} placement="bottom" title={item.tip}>
            <Button
              ghost
              onClick={() => saveFlag(item.value)}
              className={styles.flagBtn}
              style={{
                borderColor: IMG_FLAG_COLOR[item.value],
                opacity: flagTools.count <= 0 ? 0.5 : 1,
              }}
              icon={<FlagIcon fill={IMG_FLAG_COLOR[item.value]} />}
            />
          </Tooltip>
        ))}
      </div>
      <div className={styles.rightContent}>
        <Button onClick={updateOrder}>
          <SyncOutlined />
          <LocaleText id="lab.toolsBar.updateOrder" />
        </Button>
      </div>
    </div>
  );
};

export default FlagToolsBar;
