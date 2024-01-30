import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';

import './index.less';

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
                className={classNames('dds-annnotator-toptools-row-icon', {
                  'dds-annnotator-toptools-row-icon-disabled': !!disabled,
                })}
                onClick={onClick}
              >
                {icon}
              </div>
            </Tooltip>
          )}
          {splitLine && <div className="dds-annnotator-toptools-row-split" />}
        </React.Fragment>
      ),
    );

  return (
    <div
      className={classNames('dds-annnotator-toptools', className)}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="dds-annnotator-toptools-row">
        {renderTools(leftTools)}
      </div>
      <div className="dds-annnotator-toptools-progress">{children}</div>
      <div className="dds-annnotator-toptools-row">
        {renderTools(rightTools)}
      </div>
    </div>
  );
};

export default TopTools;
