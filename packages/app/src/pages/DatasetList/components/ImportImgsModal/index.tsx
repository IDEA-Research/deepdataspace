import { useState } from 'react';
import { ProFormTextArea } from '@ant-design/pro-components';
import { Empty, Modal } from 'antd';
import { useModel } from '@umijs/max';
import { useLocale } from '@/locales/helper';
import { compact, map, size } from 'lodash';
import Masonry from 'react-masonry-component';
import styles from './index.less';

interface IProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ImportImgsModal: React.FC<IProps> = ({ open, setOpen }: IProps) => {
  const [imgList, setImgList] = useState<string[]>([]);
  const { handleImportImages, checkImageUrls } = useModel('DatasetList.model');
  const { onPageContentLoaded, pageState } = useModel('dataset.common');
  const { localeText } = useLocale();

  return (
    <Modal
      width={600}
      open={open}
      onOk={() => {
        handleImportImages(pageState?.datasetId, imgList);
        setImgList([]);
        setOpen(false);
      }}
      onCancel={() => {
        setOpen(false);
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
          fieldProps={{
            rows: 10,
          }}
          onChange={(e: any) => {
            const _imgs = e.target.value.split('\n');

            checkImageUrls(_imgs).then((results) => {
              setImgList(results);
            });
          }}
          rules={[
            { required: true },
            {
              validator(rule, value, callback) {
                console.log(
                  'v: ',
                  compact(value.split('\n')),
                  size(compact(value.split('\n'))),
                );
                if (size(compact(value.split('\n'))) > 2) {
                  callback(
                    new Error(localeText('dataset.import.modal.imgsLimit')),
                  );
                } else {
                  callback();
                }
              },
            },
          ]}
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
    </Modal>
  );
};

export default ImportImgsModal;
