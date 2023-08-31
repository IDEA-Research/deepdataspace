import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { useLocale } from 'dds-utils/locale';
import { Button } from 'antd';

const ProjectInfoModal = () => {
  const { projectDetail } = useModel('Project.detail', (model) => ({
    projectDetail: model.pageData.projectDetail,
  }));

  const initialValues = projectDetail
    ? {
        name: projectDetail.name,
        description: projectDetail.description,
        managers: projectDetail.managers.map((item) => item.name),
      }
    : {};
  const { localeText } = useLocale();

  return (
    <ModalForm
      title={localeText('proj.infoModal.title')}
      submitter={false}
      trigger={<Button>View Project Basics</Button>}
      initialValues={initialValues}
      disabled
    >
      <ProFormText label={localeText('proj.infoModal.name')} name="name" />
      <ProFormTextArea
        label={localeText('proj.infoModal.desc')}
        name="description"
      />
      <ProFormSelect
        label={localeText('proj.infoModal.label')}
        name="managers"
        fieldProps={{
          mode: 'multiple',
        }}
      />
    </ModalForm>
  );
};

export default ProjectInfoModal;
