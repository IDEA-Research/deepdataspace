import { useCallback } from 'react';
import { Updater } from 'use-immer';

import {
  Category,
  DrawData,
  IAnnotationObject,
  IAttributeValue,
} from '../type';

interface IProps {
  setDrawDataWithHistory: Updater<DrawData>;
  categories: Category[];
}

export default function useAttributes({
  setDrawDataWithHistory,
  categories,
}: IProps) {
  const judgeEditingAttribute = useCallback(
    (object: IAnnotationObject, index: number) => {
      const label = categories.find((item) => item.id === object.labelId);
      if (label?.attributes && label.attributes.length > 0) {
        return {
          index,
          labelId: object.labelId,
          attributes: label.attributes,
          values: object.attributes || [],
        };
      }
      return undefined;
    },
    [categories],
  );

  const onConfirmAttibuteEdit = useCallback(
    (values: IAttributeValue[]) => {
      setDrawDataWithHistory((s) => {
        if (s.editingAttribute) {
          if (s.objectList[s.editingAttribute.index]) {
            // object attributes
            s.objectList[s.editingAttribute.index].attributes = values;
          } else {
            // classification attributes
            const i = s.classifications.findIndex(
              (item) => item.labelId === s.editingAttribute?.labelId,
            );
            if (i > -1) {
              s.classifications[i].attributes = values;
            } else {
              s.classifications.push({
                labelId: s.editingAttribute?.labelId,
                labelValue: null,
                attributes: values,
              });
            }
          }
          s.editingAttribute = undefined;
        }
      });
    },
    [setDrawDataWithHistory],
  );

  const onCancelAttibuteEdit = () => {
    setDrawDataWithHistory((s) => {
      s.editingAttribute = undefined;
    });
  };

  return {
    judgeEditingAttribute,
    onConfirmAttibuteEdit,
    onCancelAttibuteEdit,
  };
}
