import React from 'react';
import styles from './index.less';
import classNames from 'classnames';
import { Tooltip } from 'antd';

export interface ITopToolItem {
  icon?: React.ReactNode;
  title?: string;
  customElement?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  splitLine?: boolean;
}

export interface IProps {
  className?: string;
  children?: React.ReactNode;
  leftTools?: ITopToolItem[];
  rightTools?: ITopToolItem[];
}

const TopTools: React.FC<IProps> = (props) => {
  const { className = '', children, leftTools = [], rightTools = [] } = props;

  const renderTools = (tools: ITopToolItem[]) =>
    tools.map(
      ({ title, icon, onClick, disabled, splitLine, customElement }, index) => (
        <React.Fragment key={index}>
          {customElement ? (
            customElement
          ) : (
            <Tooltip title={title}>
              <div
                className={classNames(styles.icon, {
                  [styles.iconDisable]: !!disabled,
                })}
                onClick={onClick}
              >
                {icon}
              </div>
            </Tooltip>
          )}
          {splitLine && <div className={styles.lineSplit} />}
        </React.Fragment>
      ),
    );

  return (
    <div className={classNames(styles.topTools, className)}>
      <div className={styles.rowWrap}>{renderTools(leftTools)}</div>
      <div className={styles.progress}>{children}</div>
      <div className={styles.rowWrap}>{renderTools(rightTools)}</div>
    </div>
  );
};

export default TopTools;
