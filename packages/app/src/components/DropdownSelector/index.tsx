import React from 'react';
import { Button, Space, Checkbox, Dropdown, Radio } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { globalLocaleText } from '@/locales/helper';
import styles from './index.less';

export type ValueType = string | string[] | number | number[];

export interface IProps<T, P> {
  data?: T[];
  value?: P;
  multiple?: boolean;
  filterOptionValue?: (option: any) => P;
  filterOptionName?: (option: any) => string | number;
  onChange?: (value: P) => void;
  type?: 'link' | 'default' | 'text' | 'ghost' | 'primary' | 'dashed';
  ghost?: boolean;
  className?: string;
  children?: React.ReactNode;
  customOverlay?: React.ReactNode;
}

const DropdownSelector: <Option = any, Value extends ValueType = ValueType>(
  props: IProps<Option, Value>,
) => React.ReactElement = (props) => {
  const {
    data,
    multiple,
    type = 'primary',
    ghost = true,
    value,
    filterOptionValue,
    filterOptionName,
    onChange,
    className,
    children,
    customOverlay,
  } = props;

  const TargetElement = multiple ? Checkbox : Radio;
  const onChangeValue = (e: any) => {
    if (!onChange) return;
    if (multiple) {
      onChange(e);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <Dropdown
      overlayClassName={styles.dropdownSelector}
      trigger={['click']}
      dropdownRender={() => (
        <div className={styles.dropdownWrap}>
          {customOverlay ? (
            customOverlay
          ) : (
            // @ts-ignore
            <TargetElement.Group
              className={styles.dropdownBox}
              onChange={onChangeValue}
              value={value}
            >
              <Space direction="vertical">
                {data?.map((item, index) => {
                  const value = filterOptionValue
                    ? filterOptionValue(item)
                    : (item as string | number);
                  const name = filterOptionName
                    ? filterOptionName(item)
                    : (item as string | number);
                  return (
                    <TargetElement key={index} value={value}>
                      {globalLocaleText(name)}
                    </TargetElement>
                  );
                })}
              </Space>
            </TargetElement.Group>
          )}
        </div>
      )}
    >
      <Button className={className} type={type} ghost={ghost}>
        {children}
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default DropdownSelector;
