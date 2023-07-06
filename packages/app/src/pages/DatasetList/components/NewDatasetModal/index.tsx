import React, { useState } from 'react';
import {
  ProFormText,
  ProFormTextArea,
  StepsForm,
  ProFormRadio,
} from '@ant-design/pro-components';
import { Button, Modal, Empty } from 'antd';
import { useModel } from '@umijs/max';
import { useLocale } from '@/locales/helper';
import { map } from 'lodash';
import Masonry from 'react-masonry-component';
import styles from './index.less';

interface IProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NewDatasetModal: React.FC<IProps> = ({ open, setOpen }: IProps) => {
  const [imgList, setImgList] = useState<string[]>([]);
  const { handleCreateDataset, handleImportImages, checkImageUrls } =
    useModel('DatasetList.model');
  const { onPageContentLoaded } = useModel('dataset.common');
  const { datasetId } = useModel('datasets');
  const { localeText } = useLocale();

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      mask={true}
      maskClosable={true}
      footer={null}
      width={750}
    >
      <div className={styles.container}>
        <div className={styles.listTitle}>
          {localeText('dataset.create.modal.title')}
        </div>
        <StepsForm
          onFinish={() => {
            handleImportImages(datasetId, imgList);
            setOpen(false);
          }}
          formProps={{
            validateMessages: {
              required: localeText('dataset.create.modal.required'),
            },
          }}
          submitter={{
            render: (props) => {
              if (props.step === 0) {
                return (
                  <Button type="primary" onClick={() => props.onSubmit?.()}>
                    {localeText('dataset.create.modal.step.one')}
                  </Button>
                );
              }

              return [
                <Button key="gotoTwo" onClick={() => props.onPre?.()}>
                  {localeText('dataset.create.modal.step.prev')}
                </Button>,
                <Button
                  type="primary"
                  key="goToTree"
                  onClick={() => props.onSubmit?.()}
                >
                  {localeText('dataset.create.modal.step.finish')}
                </Button>,
              ];
            },
          }}
        >
          <StepsForm.StepForm
            name="step1"
            title={localeText('dataset.create.modal.title')}
            onFinish={(v) => {
              handleCreateDataset(v);
              return true;
            }}
          >
            <ProFormText
              name="name"
              label={localeText('dataset.create.modal.name')}
              width="md"
              tooltip={localeText('dataset.create.modal.name.tooltip')}
              placeholder={localeText('dataset.create.modal.name.placeholder')}
              rules={[{ required: true }]}
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
              initialValue="true"
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
          </StepsForm.StepForm>
          <StepsForm.StepForm
            name="step2"
            title={localeText('dataset.import.modal.title')}
          >
            <ProFormTextArea
              name="imageUrl"
              label={localeText('dataset.import.modal.label')}
              width="lg"
              placeholder={localeText('dataset.import.modal.placeholder')}
              onBlur={(e: any) => {
                const _imgs = [...imgList, ...e.target.value.split('\n')];

                checkImageUrls(_imgs).then((results) => {
                  setImgList(results);
                });
              }}
            />
            <div className={styles.imgContainer}>
              {imgList.length ? (
                // @ts-ignore
                <Masonry
                  options={{
                    gutter: 16,
                    horizontalOrder: true,
                    transitionDuration: 0,
                  }}
                  onImagesLoaded={() => onPageContentLoaded()}
                >
                  {map(imgList, (item, index) => {
                    return (
                      <div key={index} className={styles.imgWrap}>
                        <img src={item} />
                      </div>
                    );
                  })}
                </Masonry>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={localeText('dataset.import.modal.emptyImgs')}
                />
              )}
            </div>
          </StepsForm.StepForm>
        </StepsForm>
      </div>
    </Modal>
  );
};

export default NewDatasetModal;
