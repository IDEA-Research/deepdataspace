import { useCallback, useState } from 'react';
import { ProForm, ProFormTextArea } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Empty,
  Tabs,
  Upload,
  UploadFile,
  UploadProps,
  message,
} from 'antd';
import { useLocale } from 'dds-utils/locale';
import { InboxOutlined } from '@ant-design/icons';
import { cloneDeep, xor } from 'lodash';
import { UploadImageList } from '../UploadImageList';
import styles from './index.less';

const { Dragger } = Upload;

const MAX_COUNT = 200;
const MAX_SIZE = 20;

interface IProps {
  imgList: UploadFile[];
  setImgList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
}

const ImportImgsForm: React.FC<IProps> = ({ imgList, setImgList }: IProps) => {
  const { localeText } = useLocale();
  const [btnLoading, setBtnLoading] = useState(false);
  const [form] = ProForm.useForm<{
    urlStr: string;
  }>();

  const handleUploadChange: UploadProps['onChange'] = ({ file, fileList }) => {
    // ensure excute once while batch upload files
    if (file.uid !== fileList[fileList.length - 1].uid) return;

    const validFiles = fileList
      .filter((file) => !(file.size && file.size / 1024 / 1024 > MAX_SIZE))
      .map((file) => {
        if (file.originFileObj) {
          // overwrite url to improve memory
          const objectUrl = URL.createObjectURL(file.originFileObj as Blob);
          file.url = objectUrl;
          file.thumbUrl = objectUrl;
        }
        return file;
      });
    setImgList(validFiles);
  };

  const onRemoveFile = useCallback(
    (index: number) => {
      const newList = cloneDeep(imgList);
      newList.splice(index, 1);
      setImgList(newList);
    },
    [imgList],
  );

  const checkImageUrls = async (imgs: string[]) => {
    let results: string[] = [];

    const promises = imgs.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          resolve(url);
          results.push(url);
        };
        img.onerror = () => {
          reject();
        };
      });
    });

    return Promise.allSettled(promises).then(() => {
      return results;
    });
  };

  const addUrl = () => {
    if (btnLoading) return;

    const imgs = form
      .getFieldValue('urlStr')
      .replace(/ +/g, '')
      .split('\n')
      .filter((url: string) => !!url);
    setBtnLoading(true);
    checkImageUrls(imgs).then((results) => {
      if (results.length + imgList.length > MAX_COUNT) {
        message.error(localeText('dataset.import.modal.tip.maxImgCount'));
        setBtnLoading(false);
        return;
      }
      const newFiles: UploadFile[] = results.map((url, index) => {
        const name =
          url.replace(/\?.*$/, '').split('/').pop() ||
          `custom_${imgList.length + index}`;
        return {
          uid: `${index}_${name}`,
          name,
          url,
          status: 'success',
          thumbUrl: url,
          type: 'image/jpeg',
        };
      });
      setImgList([...imgList, ...newFiles]);
      setBtnLoading(false);

      // add tips
      if (results.length < imgs.length) {
        const rest = xor(imgs, results);
        form.setFieldValue('urlStr', rest.join('\n'));
        message.success(
          localeText('dataset.import.modal.tip.partLoad', {
            count: newFiles.length,
          }),
        );
      } else if (results.length > 0) {
        form.setFieldValue('urlStr', '');
        message.success(
          localeText('dataset.import.modal.tip.successLoad', {
            count: newFiles.length,
          }),
        );
      }
    });
  };

  return (
    <ProForm
      layout="vertical"
      form={form}
      className={styles.container}
      submitter={false}
    >
      <Alert
        message={localeText('annotator.formModal.imageTips', {
          count: MAX_COUNT,
          size: MAX_SIZE,
        })}
        type="info"
        showIcon
        style={{ margin: '20px 0 10px' }}
      />
      <Tabs
        items={[
          {
            key: 'Upload',
            label: localeText('dataset.import.modal.upload'),
            children: (
              <>
                <Dragger
                  style={{ marginBottom: '16px' }}
                  className={styles.uploadList}
                  multiple
                  showUploadList={false}
                  beforeUpload={() => false}
                  accept={'image/png, image/jpeg, image/jpg'}
                  fileList={imgList}
                  maxCount={MAX_COUNT}
                  openFileDialogOnClick={imgList.length < MAX_COUNT}
                  onChange={handleUploadChange}
                  listType="picture"
                  onPreview={() => {}}
                >
                  <p
                    className="ant-upload-drag-icon"
                    style={{ marginTop: '6px' }}
                  >
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    {localeText('dataset.import.modal.upload.text')}
                  </p>
                  <p
                    className="ant-upload-hint"
                    style={{ marginBottom: '8.86px' }}
                  >
                    {localeText('dataset.import.modal.upload.hint')}
                  </p>
                </Dragger>
                <div className={styles.uploadWrapper}>
                  <div className={styles.countTip}>
                    {localeText('dataset.import.modal.addedImgCount', {
                      count: imgList.length,
                    })}
                  </div>
                </div>
              </>
            ),
          },
          {
            key: 'Add',
            label: localeText('dataset.import.modal.addUrl'),
            children: (
              <>
                <ProFormTextArea
                  name="urlStr"
                  initialValue=""
                  className={styles.textareaItem}
                  placeholder={localeText('dataset.import.modal.placeholder')}
                  allowClear
                  fieldProps={{
                    rows: 7,
                  }}
                />
                <div className={styles.uploadWrapper}>
                  <Button
                    onClick={addUrl}
                    loading={btnLoading}
                    disabled={imgList.length >= MAX_COUNT}
                  >
                    {localeText('dataset.import.modal.addUrl.btn')}
                  </Button>
                  <div className={styles.countTip}>
                    {localeText('dataset.import.modal.addedImgCount', {
                      count: imgList.length,
                    })}
                  </div>
                </div>
              </>
            ),
          },
        ]}
      ></Tabs>
      {imgList.length > 0 ? (
        <div style={{ height: 270 }}>
          <UploadImageList
            files={imgList}
            colume={4}
            containerWidth={627}
            containerHeight={270}
            onRemoveFile={onRemoveFile}
          />
        </div>
      ) : (
        <div style={{ height: 238 }}>
          <Empty
            className={styles.emptyTip}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={localeText('dataset.import.modal.emptyImgs')}
          />
        </div>
      )}
    </ProForm>
  );
};

export default ImportImgsForm;
