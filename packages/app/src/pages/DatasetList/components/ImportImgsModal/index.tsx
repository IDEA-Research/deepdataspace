import { useState } from 'react';
import { ProFormTextArea, ModalForm } from '@ant-design/pro-components';
import { Button, Empty } from 'antd';
import { useModel } from '@umijs/max';
import { useLocale } from '@/locales/helper';
import { map } from 'lodash';
import Masonry from 'react-masonry-component';
import styles from './index.less';

const ImportImgsModal = () => {
  const [imgList, setImgList] = useState<string[]>([]);
  const { handleImportImages, checkImageUrls } = useModel('DatasetList.model');
  const { onPageContentLoaded, pageState } = useModel('dataset.common');
  const { localeText } = useLocale();

  return (
    <ModalForm
      width={600}
      modalProps={{
        destroyOnClose: true,
      }}
      trigger={<Button>{localeText('dataset.import.edit.modal.title')}</Button>}
      onFinish={() => {
        handleImportImages(pageState?.datasetId, imgList);
        setImgList([]);
        return true;
      }}
      submitter={{
        render: (props) => {
          return [
            <Button key="rest" onClick={() => props.form?.resetFields()}>
              {localeText('dataset.import.modal.reset')}
            </Button>,
            <Button
              type="primary"
              key="submit"
              onClick={() => props.form?.submit?.()}
            >
              {localeText('dataset.import.modal.submit')}
            </Button>,
          ];
        },
      }}
    >
      <div className={styles.container}>
        <div className={styles.listTitle}>
          {localeText('dataset.import.edit.modal.title')}
        </div>
        <ProFormTextArea
          name="imageUrl"
          label={localeText('dataset.import.modal.label')}
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
      </div>
    </ModalForm>
  );
};

export default ImportImgsModal;
