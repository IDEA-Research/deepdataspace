import {
  ProFormText,
  ProFormTextArea,
  ProForm,
} from '@ant-design/pro-components';
import { Button, Modal } from 'antd';
import { useModel } from '@umijs/max';
import { useLocale } from '@/locales/helper';
import styles from './index.less';

interface IProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditDatasetModal: React.FC<IProps> = ({ open, setOpen }: IProps) => {
  const { localeText } = useLocale();
  const { handleUpdateDataset } = useModel('DatasetList.model');
  const { datasetInfo } = useModel('dataset.common');

  return (
    <Modal
      width={450}
      open={open}
      onCancel={() => {
        setOpen(false);
      }}
      footer={null}
    >
      <ProForm
        initialValues={datasetInfo}
        onFinish={(v) => {
          handleUpdateDataset(v);
          setOpen(false);
        }}
        submitter={{
          render: (props) => {
            return [
              <Button key="rest" onClick={() => props.form?.resetFields()}>
                {localeText('dataset.edit.modal.reset')}
              </Button>,
              <Button
                type="primary"
                key="submit"
                onClick={() => props.form?.submit?.()}
              >
                {localeText('dataset.edit.modal.submit')}
              </Button>,
            ];
          },
        }}
        formProps={{
          validateMessages: {
            required: localeText('dataset.create.modal.required'),
          },
        }}
      >
        <div className={styles.container}>
          <div className={styles.listTitle}>
            {localeText('dataset.edit.modal.title')}
          </div>
          <ProFormText
            name="name"
            label={localeText('dataset.create.modal.name')}
            width="md"
            tooltip={localeText('dataset.create.modal.name.tooltip')}
            placeholder={localeText('dataset.create.modal.name.placeholder')}
            rules={[
              {
                required: true,
                message: localeText('dataset.create.modal.required'),
              },
            ]}
            fieldProps={{
              maxLength: 64,
            }}
          />
          <ProFormTextArea
            name="description"
            label={localeText('dataset.create.modal.desc')}
            width="lg"
            placeholder={localeText('dataset.create.modal.desc.placeholder')}
            fieldProps={{
              maxLength: 256,
            }}
          />
        </div>
      </ProForm>
    </Modal>
  );
};

export default EditDatasetModal;
