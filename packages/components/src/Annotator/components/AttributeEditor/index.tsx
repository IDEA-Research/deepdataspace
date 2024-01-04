import { Button, Card, message } from 'antd';
import { useImmer } from 'use-immer';
import { FloatWrapper } from '../FloatWrapper';
import { memo, useEffect } from 'react';
import { useLocale } from 'dds-utils/locale';
import { IAttributeValue, IEditingAttribute } from '../../type';
import './index.less';
import AttributesForm from '../AttributesForm';
import { CloseOutlined } from '@ant-design/icons';

interface IProps {
  data: IEditingAttribute;
  supportEdit?: boolean;
  onConfirmAttibuteEdit: (values: IAttributeValue[]) => void;
  onCancelAttibuteEdit: () => void;
}

const AttributeEditor: React.FC<IProps> = memo(
  ({ data, supportEdit, onConfirmAttibuteEdit, onCancelAttibuteEdit }) => {
    const { localeText } = useLocale();
    const [values, setValues] = useImmer<IAttributeValue[]>([]);

    useEffect(() => {
      setValues(data?.values || []);
    }, [data.values]);

    const onChangeValue = (index: number, value: IAttributeValue) => {
      setValues((s) => {
        s[index] = value;
      });
    };

    const onConfirm = () => {
      if (
        data.attributes.find(
          (item, index) =>
            item.required &&
            (values[index] === undefined || values[index] === null),
        )
      ) {
        message.error(localeText('DDSAnnotator.attribute.required'));
        return;
      }
      const results: IAttributeValue[] = [];
      data.attributes.forEach((_item, index) => {
        results.push(values[index] === undefined ? null : values[index]);
      });
      onConfirmAttibuteEdit(results);
    };

    return (
      <FloatWrapper>
        <Card
          id="annotation-editor"
          className="dds-annotator-attribute-editor"
          title={
            <div className="dds-annotator-attribute-editor-title">
              <div>{localeText('DDSAnnotator.attribute.add')}</div>
              <Button
                ghost
                className="dds-annotator-attribute-editor-title-btn"
                icon={<CloseOutlined />}
                shape="circle"
                size="small"
                onClick={onCancelAttibuteEdit}
              ></Button>
            </div>
          }
        >
          <div className="dds-annotator-attribute-editor-content">
            <AttributesForm
              disabled={!supportEdit}
              data={data.attributes}
              values={values}
              onChangeValue={onChangeValue}
            />
            {supportEdit && (
              <div className={'dds-annotator-attribute-editor-actions'}>
                <Button
                  type="primary"
                  onClick={(event) => {
                    event.preventDefault();
                    onConfirm();
                  }}
                >
                  {localeText('DDSAnnotator.confirm')}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </FloatWrapper>
    );
  },
);

export default AttributeEditor;
