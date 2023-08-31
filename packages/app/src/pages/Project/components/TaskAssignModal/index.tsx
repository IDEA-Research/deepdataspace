import { ModalForm, ProFormSelect } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { useLocale } from 'dds-utils/locale';
import { ASSIGN_TYPE } from '../../models/detail';

const TaskAssignModal = () => {
  const {
    pageData,
    assignModal,
    onCloseAssignModal,
    userLintRequest,
    assignModalFinish,
  } = useModel('Project.detail');
  const { projectDetail } = pageData;
  const { localeText } = useLocale();

  if (!projectDetail) return null;
  return (
    <ModalForm
      title={
        assignModal.types.includes(ASSIGN_TYPE.reassign)
          ? localeText('proj.assign.modal.reassign')
          : localeText('proj.assign.modal.assign')
      }
      width={640}
      modalProps={{
        onCancel: onCloseAssignModal,
        destroyOnClose: true,
        maskClosable: false,
      }}
      visible={assignModal.show}
      initialValues={assignModal.initialValues}
      onFinish={assignModalFinish}
    >
      {assignModal.types.includes(ASSIGN_TYPE.labelLeader) && (
        <ProFormSelect
          label={localeText('proj.assign.modal.ll.label')}
          placeholder={localeText('proj.assign.modal.ll.placeholder')}
          tooltip={localeText('proj.assign.modal.ll.tooltip')}
          name="labelLeaderId"
          fieldProps={{
            showSearch: true,
            labelInValue: false,
          }}
          debounceTime={300}
          request={userLintRequest}
          rules={[
            {
              required: true,
              message: localeText('proj.assign.modal.ll.msg'),
            },
          ]}
        />
      )}
      {assignModal.types.includes(ASSIGN_TYPE.reviewLeader) && (
        <ProFormSelect
          label={localeText('proj.assign.modal.rl.label')}
          placeholder={localeText('proj.assign.modal.rl.placeholder')}
          tooltip={localeText('proj.assign.modal.rl.tooltip')}
          name="reviewLeaderId"
          fieldProps={{
            showSearch: true,
            labelInValue: false,
          }}
          debounceTime={300}
          request={userLintRequest}
          rules={[
            {
              required: true,
              message: localeText('proj.assign.modal.rl.msg'),
            },
          ]}
        />
      )}
      {assignModal.types.includes(ASSIGN_TYPE.labeler) && (
        <ProFormSelect.SearchSelect
          label={localeText('proj.assign.modal.ler.label')}
          placeholder={localeText('proj.assign.modal.ler.placeholder', {
            times: projectDetail.labelTimes,
          })}
          tooltip={localeText('proj.assign.modal.ler.tootltip')}
          name="labelerIds"
          fieldProps={{
            mode: 'multiple',
            labelInValue: false,
          }}
          debounceTime={300}
          request={userLintRequest}
          rules={[
            {
              required: true,
              message: localeText('proj.assign.modal.ler.msg', {
                times: projectDetail.labelTimes,
              }),
            },
            {
              len: projectDetail.labelTimes,
              transform: (value: string[]) => {
                return value.length ? 's'.repeat(value.length) : '';
              },
              message: localeText('proj.assign.modal.ler.msgTimes', {
                times: projectDetail.labelTimes,
              }),
            },
          ]}
        />
      )}
      {assignModal.types.includes(ASSIGN_TYPE.reviewer) && (
        <ProFormSelect.SearchSelect
          label={localeText('proj.assign.modal.rer.label')}
          placeholder={localeText('proj.assign.modal.rer.placeholder', {
            times: projectDetail.reviewTimes,
          })}
          tooltip={localeText('proj.assign.modal.rer.tootltip')}
          name="reviewerIds"
          fieldProps={{
            mode: 'multiple',
            labelInValue: false,
          }}
          debounceTime={300}
          request={userLintRequest}
          rules={[
            {
              required: true,
              message: localeText('proj.assign.modal.rer.msg', {
                times: projectDetail.reviewTimes,
              }),
            },
            {
              len: projectDetail.reviewTimes,
              transform: (value: string[]) => {
                return value.length ? 's'.repeat(value.length) : '';
              },
              message: localeText('proj.assign.modal.rer.msgTimes', {
                times: projectDetail.reviewTimes,
              }),
            },
          ]}
        />
      )}
      {assignModal.types.includes(ASSIGN_TYPE.reassign) && (
        <ProFormSelect
          label={localeText('proj.assign.modal.reassign.label')}
          placeholder={localeText('proj.assign.modal.reassign.placeholder')}
          name="reassigner"
          fieldProps={{
            showSearch: true,
            labelInValue: false,
          }}
          debounceTime={300}
          request={userLintRequest}
          rules={[
            {
              required: true,
              message: localeText('proj.assign.modal.reassign.msg'),
            },
          ]}
        />
      )}
    </ModalForm>
  );
};

export default TaskAssignModal;
