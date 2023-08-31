import React, { useState } from 'react';
import { Pagination, InputNumber } from 'antd';
import { useLocale } from 'dds-utils/locale';
import { isNaN } from 'lodash';
import './index.less';

export interface IProps {
  current: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (current: number, size: number) => void;
}

const DynamicPagination: React.FC<IProps> = (props) => {
  const { current, size, total, onPageChange, onPageSizeChange } = props;
  const [customPageSize, setCustomPageSize] = useState(size);
  const { localeText } = useLocale();

  return (
    <div className="dds-dynamic-pagination">
      <Pagination
        current={current}
        pageSize={size}
        total={total}
        showSizeChanger={false}
        showQuickJumper
        onChange={(page) => onPageChange(page)}
      />
      <div className="pagesize-wrap">
        <div className="pagesize-label">
          {localeText('DynamicPagination.label')}
        </div>
        <InputNumber
          min={1}
          value={customPageSize}
          onChange={(e) => {
            setCustomPageSize(Number(e));
          }}
          onBlur={(e) => {
            if (isNaN(Number(e.target.value)) || Number(e.target.value) <= 0) {
              onPageSizeChange(current, 1);
            } else {
              onPageSizeChange(current, Number(e.target.value));
            }
          }}
          onPressEnter={(e) => {
            (e.target as any).blur(e);
          }}
        />
      </div>
    </div>
  );
};

export default DynamicPagination;
