import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Tabs, Tooltip } from 'antd';
import classNames from 'classnames';
import { useLocale } from 'dds-utils/locale';
import { isEqual } from 'lodash';
import React, { memo, useMemo, useState } from 'react';
import { Updater } from 'use-immer';

import {
  Category,
  DrawData,
  IAttributeValue,
  IEditingAttribute,
} from '../../type';
import AttributesForm from '../AttributesForm';

import './index.less';

export interface IProps {
  className?: string;
  supportEdit?: boolean;
  classificationOptions: Category[];
  values: {
    labelId: string;
    labelValue: IAttributeValue;
    attributes?: IAttributeValue[];
  }[];
  setDrawDataWithHistory: Updater<DrawData>;
}

const propsAreEqual = (prev: IProps, next: IProps): boolean => {
  return (
    prev.className === next.className &&
    prev.supportEdit === next.supportEdit &&
    isEqual(prev.classificationOptions, next.classificationOptions) &&
    isEqual(prev.values, next.values) &&
    prev.setDrawDataWithHistory === next.setDrawDataWithHistory
  );
};

const ClassificationPanel: React.FC<IProps> = memo((props) => {
  const { localeText } = useLocale();
  const {
    className,
    classificationOptions,
    values,
    setDrawDataWithHistory,
    supportEdit,
  } = props;
  const [hideContent, setHideContent] = useState(false);

  const judgeChangeEditingAttribute = (
    index: number,
    editingAttribute?: IEditingAttribute,
    limitEmpty?: boolean,
  ) => {
    const classificationLabel = classificationOptions[index];
    const attributesValues = values?.find(
      ({ labelId }) => labelId === classificationLabel?.id,
    )?.attributes;
    if (
      classificationLabel?.attributes &&
      classificationLabel.attributes.length > 0 &&
      editingAttribute?.labelId !== classificationLabel.id &&
      (!limitEmpty || !attributesValues?.length)
    ) {
      return {
        index: -1,
        labelId: classificationLabel.id,
        attributes: classificationLabel?.attributes,
        values: attributesValues,
      };
    }
    return null;
  };

  const showEditingArribute = (index: number) => {
    // setTimeout to solve immer merge error problem
    setTimeout(() => {
      setDrawDataWithHistory((s) => {
        const editingAttribute = judgeChangeEditingAttribute(
          index,
          s.editingAttribute,
        );
        if (editingAttribute) {
          s.editingAttribute = editingAttribute;
        }
      });
    });
  };

  const onChangeValue = (index: number, value: IAttributeValue) => {
    setDrawDataWithHistory((s) => {
      const classificationLabel = classificationOptions[index];
      const i = s.classifications.findIndex(
        (item) => item.labelId === classificationLabel.id,
      );
      if (i > -1) {
        s.classifications[i].labelValue = value;
      } else {
        s.classifications.push({
          labelId: classificationOptions[index].id,
          labelValue: value,
        });
      }
      if (s.editingAttribute?.labelId !== classificationLabel?.id) {
        s.editingAttribute =
          judgeChangeEditingAttribute(index, s.editingAttribute, true) ||
          undefined;
      }
    });
  };

  const classifications = useMemo(
    () =>
      classificationOptions.map((item) => ({
        field: item.labelName!,
        type: item.valueType!,
        required: true,
        options: item.valueOptions!,
        hasAttributes: !!item.attributes?.length,
        requireAttribute: !!item.attributes?.find(
          (attribute, idx) =>
            attribute?.required &&
            [undefined, null, ''].includes(
              values.find(({ labelId }) => labelId === item.id)?.attributes?.[
                idx
              ] as any,
            ),
        ),
      })),
    [classificationOptions, values],
  );

  const classificationValues = useMemo(() => {
    const results: IAttributeValue[] = [];
    classificationOptions.forEach((item) => {
      const value = values.find(
        ({ labelId }) => labelId === item.id,
      )?.labelValue;
      results.push(value === undefined ? null : value);
    });
    return results;
  }, [classificationOptions, values]);

  const classTab = (
    <AttributesForm
      isDarkTheme
      disabled={!supportEdit}
      data={classifications}
      values={classificationValues}
      onChangeValue={onChangeValue}
      onFocusInput={showEditingArribute}
      onClickAttributes={showEditingArribute}
    />
  );

  return (
    <div
      className={classNames('dds-annotator-classification', className)}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <Tabs
        activeKey={'classification'}
        items={[
          {
            key: 'classification',
            label: localeText('DDSAnnotator.annotsList.classification'),
            children: hideContent ? null : classTab,
          },
        ]}
        tabBarExtraContent={
          <Tooltip
            title={
              hideContent
                ? localeText('DDSAnnotator.annotsList.showAll')
                : localeText('DDSAnnotator.annotsList.hideAll')
            }
          >
            <Button
              ghost
              className="tab-header-actions"
              icon={hideContent ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              shape={'circle'}
              onClick={() => setHideContent(!hideContent)}
            />
          </Tooltip>
        }
      />
    </div>
  );
}, propsAreEqual);

export default ClassificationPanel;
