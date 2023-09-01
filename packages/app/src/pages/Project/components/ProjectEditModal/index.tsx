import { fetchDatasetLint, fetchUserLint } from '@/services/project';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProFormCheckbox,
  ProFormRadio,
  StepsForm,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Alert, Modal } from 'antd';
import { useRef } from 'react';
import { useLocale } from 'dds-utils/locale';
import { SET_WORKFLOW_NOW } from '../../models/list';
import { EProjectStatus } from '../../constants';
import { EProjectAction } from '../../models/auth';

const ProjectEditModal = () => {
  const { user } = useModel('user');
  const {
    projectModal,
    closeProjectModal,
    onProjectModalCurrentChange,
    projectModalNext,
    projectModalFinish,
  } = useModel('Project.list');
  const { checkPermission } = useModel('Project.auth');
  const { localeText } = useLocale();

  const formMapRef = useRef<
    React.MutableRefObject<ProFormInstance<any> | undefined>[]
  >([]);
  const { targetProject } = projectModal;

  const hadInitProject =
    targetProject && targetProject.status !== EProjectStatus.Waiting;
  const isEditingBasics = Boolean(targetProject);
  const basicDisable =
    targetProject &&
    !checkPermission(targetProject.userRoles, EProjectAction.ProjectEdit);
  const settingsDisable = hadInitProject || projectModal.disableInitProject;

  /**
   * just should show workflow form
   * （new project || not init）&& not pm => do not show workflow
   */
  const onFinishBasicsForm = (values: any) => {
    if (!targetProject || !hadInitProject) {
      const basicsFormRef = formMapRef.current?.[0];
      const settingsFormRef = formMapRef.current?.[1];
      const managerIds = basicsFormRef?.current?.getFieldValue([
        'basics',
        'managerIds',
      ]);
      const isPm = managerIds?.includes(user.userId!);
      if (!isPm) {
        settingsFormRef?.current?.setFieldValue(['workflowInitNow'], []);
      }
    }
    return projectModalNext(values);
  };

  return (
    <Modal
      title={
        targetProject
          ? localeText('proj.editModal.editProj')
          : localeText('proj.editModal.newProj')
      }
      width={750}
      open={projectModal.show}
      onCancel={closeProjectModal}
      destroyOnClose
      footer={null}
      maskClosable={false}
    >
      <StepsForm
        formMapRef={formMapRef}
        current={projectModal.current}
        onCurrentChange={onProjectModalCurrentChange}
        onFinish={projectModalFinish}
        formProps={{
          initialValues: projectModal.initialValues,
        }}
      >
        <StepsForm.StepForm
          name="basics"
          title={localeText('proj.editModal.stepForm.title')}
          stepProps={{
            description: localeText('proj.editModal.stepForm.desc'),
          }}
          onFinish={onFinishBasicsForm}
          disabled={basicDisable}
        >
          <ProFormText
            label={localeText('proj.editModal.stepForm.name.label')}
            placeholder={localeText('proj.editModal.stepForm.name.placeholder')}
            name={['basics', 'name']}
            rules={[
              {
                required: true,
                message: localeText('proj.editModal.stepForm.name.rule'),
              },
            ]}
            disabled={isEditingBasics}
          />
          <ProFormTextArea
            label={localeText('proj.editModal.stepForm.desc.label')}
            placeholder={localeText('proj.editModal.stepForm.desc.placeholder')}
            name={['basics', 'description']}
          />
          <ProFormSelect.SearchSelect
            label={localeText('proj.editModal.stepForm.dataset.label')}
            placeholder={localeText(
              'proj.editModal.stepForm.dataset.placeholder',
            )}
            name={['basics', 'datasetIds']}
            fieldProps={{
              mode: 'multiple',
              labelInValue: false,
            }}
            debounceTime={300}
            request={async ({ keyWords = '' }) => {
              let datasets = targetProject?.datasets || [];
              const results = (
                await fetchDatasetLint({
                  name: keyWords,
                  purpose: 'label_project',
                })
              ).datasetList.map((item) => ({
                label: item.name,
                value: item.id,
                disabled: !item.valid,
              }));
              datasets.forEach((item) => {
                if (!results.find((d) => d.value === item.id)) {
                  results.push({
                    label: item.name,
                    value: item.id,
                    disabled: false,
                  });
                }
              });
              return results;
            }}
            rules={[
              {
                required: true,
                message: localeText('proj.editModal.stepForm.dataset.rule'),
                type: 'array',
              },
            ]}
            disabled={isEditingBasics}
          />
          <ProFormText
            label={localeText('proj.editModal.stepForm.preLabel.label')}
            placeholder={localeText(
              'proj.editModal.stepForm.preLabel.placeholder',
            )}
            name={['basics', 'preLabel']}
            disabled={isEditingBasics}
          />
          <ProFormTextArea
            label={localeText('proj.editModal.stepForm.category.label')}
            placeholder={localeText(
              'proj.editModal.stepForm.category.placeholder',
            )}
            name={['basics', 'categories']}
            rules={[
              {
                required: true,
                message: localeText('proj.editModal.stepForm.category.rule'),
              },
            ]}
            disabled={isEditingBasics}
          />
          <ProFormSelect.SearchSelect
            label={localeText('proj.editModal.stepForm.PM.label')}
            placeholder={localeText('proj.editModal.stepForm.PM.placeholder')}
            extra={localeText('proj.editModal.stepForm.PM.extra')}
            name={['basics', 'managerIds']}
            fieldProps={{
              mode: 'multiple',
              labelInValue: false,
            }}
            debounceTime={300}
            request={async ({ keyWords = '' }) => {
              let managers = targetProject?.managers || [];
              if (keyWords) {
                managers = (
                  await fetchUserLint({ email: keyWords })
                ).userList.map((item) => ({
                  name: item.email,
                  id: item.id,
                }));
              }
              return managers.map((item) => ({
                label: item.name,
                value: item.id,
              }));
            }}
            rules={[
              {
                required: true,
                message: localeText('proj.editModal.stepForm.PM.rule'),
                type: 'array',
              },
            ]}
          />
        </StepsForm.StepForm>
        <StepsForm.StepForm
          name={'taskSetting'}
          title={localeText('proj.editModal.stepForm.task.title')}
          stepProps={{
            description: localeText('proj.editModal.stepForm.task.desc'),
          }}
          disabled={settingsDisable}
        >
          {projectModal.disableInitProject && (
            <Alert
              style={{ marginBottom: 20 }}
              message={localeText('proj.editModal.stepForm.task.msg')}
              type="warning"
            />
          )}
          <ProFormCheckbox.Group
            name="workflowInitNow"
            options={[localeText(SET_WORKFLOW_NOW)]}
          />
          <ProFormDependency name={['workflowInitNow']}>
            {({ workflowInitNow }) =>
              workflowInitNow && workflowInitNow.length ? (
                <>
                  <ProFormRadio.Group
                    name="hadBatchSize"
                    label={localeText('proj.editModal.stepForm.radio.label')}
                    options={[
                      {
                        label: localeText(
                          'proj.editModal.stepForm.radio.dataset',
                        ),
                        value: false,
                      },
                      {
                        label: localeText('proj.editModal.stepForm.radio.size'),
                        value: true,
                      },
                    ]}
                  />
                  <ProFormDependency name={['hadBatchSize']}>
                    {({ hadBatchSize }) =>
                      hadBatchSize ? (
                        <ProFormDigit
                          label={localeText(
                            'proj.editModal.stepForm.batchSize.label',
                          )}
                          name={['settings', 'batchSize']}
                          min={1}
                          width="sm"
                          placeholder={localeText(
                            'proj.editModal.stepForm.batchSize.placeholder',
                          )}
                          tooltip={localeText(
                            'proj.editModal.stepForm.batchSize.tooltip',
                          )}
                          rules={[
                            {
                              required: true,
                              message: localeText(
                                'proj.editModal.stepForm.batchSize.msg',
                              ),
                            },
                          ]}
                        />
                      ) : null
                    }
                  </ProFormDependency>
                  <ProFormRadio.Group
                    name="hadReviewer"
                    label={localeText('proj.editModal.stepForm.rview.label')}
                    options={[
                      {
                        label: localeText('proj.editModal.stepForm.rview.no'),
                        value: false,
                      },
                      {
                        label: localeText('proj.editModal.stepForm.rview.one'),
                        value: true,
                      },
                    ]}
                  />
                  {/* <ProFormDependency name={['hadReviewer']}>
                    {({ hadReviewer }) =>
                      hadReviewer ? (
                        <ProFormGroup>
                          <ProFormSlider
                            label="Minimum accepted rate of Review"
                            name={['settings', 'reviewPercent']}
                            tooltip="Minimum accepted rate for reviewer to commit tasks"
                            // width="md"
                            min={0}
                            max={100}
                            step={1}
                            required={true}
                            marks={{
                              0: '0%',
                              100: '100%',
                            }}
                            initialValue={100}
                            fieldProps={{
                              tooltip: {
                                formatter: (value) => (
                                  <div>{`${value || 0}%`}</div>
                                ),
                              },
                            }}
                            disabled={settingsDisable}
                          ></ProFormSlider>
                          <ProFormDigit
                            width={100}
                            label=" "
                            name={['settings', 'reviewPercent']}
                            min={1}
                            max={100}
                            fieldProps={{ addonAfter: '%' }}
                          />
                        </ProFormGroup>
                      ) : null
                    }
                  </ProFormDependency> */}
                </>
              ) : (
                <div style={{ width: '100%', height: '200px' }} />
              )
            }
          </ProFormDependency>
        </StepsForm.StepForm>
      </StepsForm>
    </Modal>
  );
};

export default ProjectEditModal;
