import {
  ProFormText,
  ProFormTextArea,
  ProFormRadio,
  ModalForm,
} from '@ant-design/pro-components';
import { Button } from 'antd';
import { useModel } from '@umijs/max';
import { useLocale } from '@/locales/helper';
import styles from './index.less';

const EditDatasetModal = () => {
  const { localeText } = useLocale();
  const { handleUpdateDataset } = useModel('DatasetList.model');
  const { datasetInfo } = useModel('dataset.common');

  return (
    <ModalForm
      initialValues={datasetInfo}
      width={450}
      modalProps={{
        destroyOnClose: true,
      }}
      trigger={<Button>{localeText('dataset.edit.modal.title')}</Button>}
      onFinish={(v) => {
        handleUpdateDataset(v);
        return true;
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
          maxLength={64}
        />
        <ProFormTextArea
          name="description"
          label={localeText('dataset.create.modal.desc')}
          width="lg"
          placeholder={localeText('dataset.create.modal.desc.placeholder')}
          maxLength={256}
        />
        <ProFormRadio.Group
          label={localeText('dataset.create.modal.auth')}
          name="isPublic"
          options={[
            {
              label: localeText('dataset.create.modal.auth.public'),
              value: 'true',
            },
            {
              label: localeText('dataset.create.modal.auth.private'),
              value: 'false',
            },
          ]}
        />
      </div>
    </ModalForm>
  );
};

export default EditDatasetModal;
