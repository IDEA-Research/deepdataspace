import React, { memo } from 'react';
import classNames from 'classnames';
import { Button, Checkbox, Form, Input, Radio, Tooltip } from 'antd';
import { EActionType, IAttribute, IAttributeValue } from '../../type';
import { isEqual } from 'lodash';
import './index.less';
import { ReactComponent as Attribute } from '../../assets/attribute.svg';
import { useLocale } from 'dds-utils/locale';

export interface IProps {
  isDarkTheme?: boolean;
  disabled?: boolean;
  data: (IAttribute & {
    hasAttributes?: boolean;
    requireAttribute?: boolean;
  })[];
  values: IAttributeValue[];
  onChangeValue: (index: number, value: IAttributeValue) => void;
  onFocusInput?: (
    index: number,
    event: React.FocusEvent<HTMLInputElement, Element>,
  ) => void;
  onClickAttributes?: (index: number) => void;
}

const propsAreEqual = (prev: IProps, next: IProps): boolean => {
  return (
    prev.isDarkTheme === next.isDarkTheme &&
    prev.disabled === next.disabled &&
    isEqual(prev.data, next.data) &&
    isEqual(prev.values, next.values) &&
    prev.onChangeValue === next.onChangeValue &&
    prev.onFocusInput === next.onFocusInput &&
    prev.onClickAttributes === next.onClickAttributes
  );
};

const AttributesForm: React.FC<IProps> = memo((props) => {
  const { localeText } = useLocale();
  const {
    isDarkTheme,
    disabled,
    data,
    values,
    onChangeValue,
    onFocusInput,
    onClickAttributes,
  } = props;

  return (
    <Form
      layout="vertical"
      className={classNames('dds-annotator-attributes-form', {
        'dds-annotator-attributes-form-dark': isDarkTheme,
      })}
    >
      {data.map((item, index) => (
        <Form.Item
          key={item.field}
          required={item.required}
          label={
            item.hasAttributes ? (
              <div className="dds-annotator-attributes-form-item-title">
                {item.field}
                <Tooltip title={localeText('DDSAnnotator.attribute.edit')}>
                  <Button
                    ghost
                    className="dds-annotator-attributes-form-item-title-btn"
                    icon={
                      <Attribute
                        className={
                          item.requireAttribute ? 'attribute-warn' : ''
                        }
                      />
                    }
                    shape={'circle'}
                    onClick={(event) => {
                      event.stopPropagation();
                      onClickAttributes?.(index);
                    }}
                  />
                </Tooltip>
              </div>
            ) : (
              item.field
            )
          }
        >
          {item.type === EActionType.Radio && (
            <Radio.Group
              value={values[index]}
              options={item.options?.map(({ label }, index) => ({
                label,
                value: index,
              }))}
              onChange={(event) =>
                onChangeValue(index, event.target.value as number)
              }
              disabled={disabled}
            />
          )}
          {item.type === EActionType.Checkbox && (
            <Checkbox.Group
              value={values[index] as number[]}
              options={item.options?.map(({ label }, index) => ({
                label,
                value: index,
              }))}
              onChange={(values) => onChangeValue(index, values as number[])}
              disabled={disabled}
            />
          )}
          {item.type === EActionType.Text && (
            <Input
              placeholder={localeText('DDSAnnotator.attribute.input')}
              value={values[index] as string}
              onChange={(event) => onChangeValue(index, event.target.value)}
              onFocus={(event) => onFocusInput?.(index, event)}
              onKeyUp={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              disabled={disabled}
            />
          )}
        </Form.Item>
      ))}
    </Form>
  );
}, propsAreEqual);

export default AttributesForm;
