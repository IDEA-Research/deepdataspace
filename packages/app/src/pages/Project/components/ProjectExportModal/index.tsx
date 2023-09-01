import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { useLocale } from 'dds-utils/locale';
import { Form } from 'antd';
import styles from './index.less';

interface IModalProps {
  projectId: string;
}

const ProjectExportModal: React.FC<IModalProps> = (props) => {
  const { projectId } = props;
  const { onExportLabelProject } = useModel('Project.list');
  const [form] = Form.useForm<{ labelName: string }>();
  const { localeText } = useLocale();

  return (
    <ModalForm<{
      labelName: string;
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
      onFinish={async (values) => await onExportLabelProject(projectId, values)}
      className={styles.input}
    >
      <ProFormText
        label={localeText('proj.exportModal.labelName.name')}
        name="labelName"
        rules={[
          {
            required: true,
            message: localeText('proj.exportModal.labelName.rule'),
          },
        ]}
        extra={localeText('proj.exportModal.labelName.tips')}
      />
    </ModalForm>
  );
};

export default ProjectExportModal;
