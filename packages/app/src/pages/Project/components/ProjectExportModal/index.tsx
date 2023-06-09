import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useLocale } from '@/locales/helper';
import { Form, message } from 'antd';
import styles from './index.less';

const ProjectExportModal = () => {
  const { localeText } = useLocale();
  const [form] = Form.useForm<{ labelSet: string }>();

  const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, time);
    });
  };

  return (
    <ModalForm<{
      labelSet: string;
    }>
      title={localeText('proj.exportModal.title')}
      width={450}
      trigger={
        <span className={styles.link}>
          {localeText('proj.table.action.export')}
        </span>
      }
      form={form}
      autoFocusFirstInput
      modalProps={{
        destroyOnClose: true,
      }}
      submitTimeout={2000}
      onFinish={async (values) => {
        // Todo: replace with actual export API
        await waitTime(2000);
        console.log(values.labelSet);
        message.success(
          localeText('proj.exportModal.submitSuccess', {
            name: values.labelSet,
          }),
        );
        return true;
      }}
      className={styles.input}
    >
      <ProFormText
        label={localeText('proj.exportModal.labelSet.name')}
        name="labelSet"
        rules={[
          {
            required: true,
            message: localeText('proj.exportModal.labelSet.rule'),
          },
        ]}
      />
    </ModalForm>
  );
};

export default ProjectExportModal;
