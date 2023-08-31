import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Form,
  Input,
  List,
  Modal,
  Upload,
  UploadFile,
  notification,
} from 'antd';
import { MAX_FILE_COUNT, MAX_FILE_SIZE } from '../../constants';
import { useModel } from '@umijs/max';
import { UploadProps } from 'antd/es/upload';
import styles from './index.less';
import { useImmer } from 'use-immer';
import { LabelImageFile } from '@/types/annotator';
import { useCallback, useEffect } from 'react';
import { useLocale } from 'dds-utils/locale';
import { UploadImageList } from '@/components/UploadImageList';
import { cloneDeep } from 'lodash';
import { ArgsProps } from 'antd/es/notification/interface';
import { Category } from '@/types';

interface IProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FormModal: React.FC<IProps> = ({ open, setOpen }: IProps) => {
  const { localeText } = useLocale();
  const [form] = Form.useForm<{
    fileList: UploadFile[];
    categoryStr: string;
    tempCategories: Category[];
  }>();

  const { images, categories, setImages, setCategories } =
    useModel('Annotator.model');

  /** Temporarily store Image in the Form */
  const [tempImages, setTempImages] = useImmer<UploadFile[]>([]);

  /** Temporarily Displayed Category in the Form */
  const [tempCategories, setTempCategories] = useImmer<Category[]>(categories);

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (props: ArgsProps) => {
    api.info({
      ...props,
      placement: 'topRight',
    });
  };

  /**
   * Logics for importing files
   */

  const handleUploadChange: UploadProps['onChange'] = ({ file, fileList }) => {
    // ensure excute once while batch upload files
    if (file.uid !== fileList[fileList.length - 1].uid) return;

    const validFiles = fileList
      .filter((file) => !(file.size && file.size / 1024 / 1024 > MAX_FILE_SIZE))
      .slice(0, MAX_FILE_COUNT)
      .map((file) => {
        const objectUrl = URL.createObjectURL(file.originFileObj as Blob);
        file.url = objectUrl;
        file.thumbUrl = objectUrl;
        return file;
      });
    setTempImages(validFiles);
  };

  const hasAnnotsOnImage = useCallback(
    (index: number) => {
      return images[index] && images[index].objects.length > 0;
    },
    [images],
  );

  const onRemoveTempFile = useCallback(
    (index: number) => {
      if (hasAnnotsOnImage(index)) {
        openNotification({
          message: localeText('annotator.formModal.deleteImage.title'),
          description: localeText('annotator.formModal.deleteImage.desc'),
          duration: 3,
        });
        return;
      }
      const newList = cloneDeep(tempImages);
      newList.splice(index, 1);
      setTempImages(newList);
    },
    [tempImages, hasAnnotsOnImage],
  );

  const updateImages = (fileList: UploadFile[]) => {
    const submitFileIds = fileList.map((file) => file.uid);
    const existingImageIds = images.map((image) => image.id);

    // Delete files that are not present in fileList
    const savedImages = images.filter(
      (image) =>
        submitFileIds.includes(image.id) && existingImageIds.includes(image.id),
    );
    setImages(savedImages);

    // Load new files that are not present in images
    const newFiles = fileList.filter(
      (file) => !existingImageIds.includes(file.uid),
    );

    // updated images
    const imageFiles = newFiles.map((file) => {
      const objectUrl =
        file.url || URL.createObjectURL(file.originFileObj as Blob);
      const item: LabelImageFile = {
        id: file.uid,
        url: objectUrl,
        urlFullRes: objectUrl,
        fileName: file.name,
        objects: [],
      };
      return item;
    });
    setImages((images) => [...images, ...imageFiles]);
  };

  /**
   * Logics for editing categories
   */

  useEffect(() => {
    // Sync the latest categories to form data, considering the categories could be added out of the form
    setTempCategories(categories);
  }, [open]);

  const validateCategories = () => {
    if (tempCategories.length === 0) {
      return Promise.reject(
        localeText('annotator.formModal.categoryRequiredMsg'),
      );
    }
    return Promise.resolve();
  };

  const convertInputToLabels = (text: string): string[] => {
    const labels = text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    return labels;
  };

  const addLabelsToTempCategories = (labels: string[]) => {
    const existing = [...tempCategories].map((item) => item.name);
    const newCategories: Category[] = [];
    labels.forEach((label) => {
      if (existing.includes(label)) return;
      existing.push(label);
      newCategories.push({
        id: label,
        name: label,
      });
    });
    setTempCategories([...tempCategories, ...newCategories]);
  };

  const addTempCategories = () => {
    const text = form.getFieldValue('categoryStr');
    const labels = convertInputToLabels(text);
    addLabelsToTempCategories(labels);
    form.setFieldValue('categoryStr', '');
    form.validateFields();
  };

  const deleteTempCategories = (name: string) => {
    setTempCategories(tempCategories.filter((item) => item.name !== name));
  };

  const hasRelatedAnnots = (categoryName: string) => {
    return !!images.find((image) =>
      image.objects.find((obj) => obj.categoryName === categoryName),
    );
  };

  return (
    <Modal
      open={open}
      centered
      width={700}
      title={localeText('annotator.formModal.title')}
      onCancel={() => {
        form.validateFields().then(() => {
          setOpen(false);
        });
      }}
      onOk={() => {
        form
          .validateFields()
          .then(() => {
            updateImages(tempImages);
            setCategories(tempCategories);
            setOpen(false);
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      {contextHolder}
      <Alert
        message={localeText('annotator.notice')}
        type="info"
        showIcon
        style={{ margin: '20px 0' }}
      />
      <Form layout="vertical" form={form} requiredMark={false}>
        <Form.Item
          label={<h4>{localeText('annotator.formModal.importImages')}</h4>}
          name="fileList"
          required
          extra={
            <>
              {tempImages.length > 0 && (
                <UploadImageList
                  files={tempImages}
                  colume={4}
                  containerWidth={652}
                  containerHeight={270}
                  onRemoveFile={onRemoveTempFile}
                />
              )}
              <p>
                {localeText('annotator.formModal.imageTips', {
                  count: MAX_FILE_COUNT,
                  size: MAX_FILE_SIZE,
                })}
              </p>
            </>
          }
        >
          <Upload
            className={styles.upload}
            multiple={true}
            showUploadList={false}
            beforeUpload={() => false}
            accept={'image/png, image/jpeg, image/jpg'}
            fileList={tempImages}
            maxCount={MAX_FILE_COUNT}
            openFileDialogOnClick={tempImages.length < MAX_FILE_COUNT}
            onChange={handleUploadChange}
          >
            <Button
              className={styles.uploadBtn}
              type="primary"
              icon={<UploadOutlined />}
              style={{ marginBlockEnd: '10px' }}
              disabled={tempImages.length >= MAX_FILE_COUNT}
            >
              {localeText('dataset.import.modal.upload')}
            </Button>
          </Upload>
        </Form.Item>
        <Form.Item
          label={<h4>{localeText('annotator.formModal.categories')}</h4>}
        >
          <div className={styles.categories}>
            <div className={styles['categories-add']}>
              <Form.Item name="categoryStr" initialValue={''}>
                <Input.TextArea
                  className={styles['categories-add-textarea']}
                  rows={6}
                  placeholder={localeText(
                    'annotator.formModal.categoryPlaceholder',
                  )}
                  onKeyDown={(e) => e.stopPropagation()}
                  allowClear
                  value={form.getFieldValue('categoryStr')}
                />
              </Form.Item>
              <Button
                className={styles['categories-add-btn']}
                onClick={addTempCategories}
              >
                {localeText('annotator.formModal.addCategory')}
              </Button>
            </div>
            <div className={styles['categories-current']}>
              <Form.Item
                name="tempCategories"
                rules={[{ validator: validateCategories }]}
              >
                <List
                  className={styles['categories-current-list']}
                  bordered
                  size="small"
                  dataSource={tempCategories}
                  renderItem={(item) => (
                    <List.Item
                      className={styles['categories-current-list-item']}
                      style={{ padding: '2px 16px' }}
                      key={item.id}
                      actions={[
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          key="delete"
                          onClick={() => {
                            if (hasRelatedAnnots(item.name)) {
                              openNotification({
                                message: localeText(
                                  'annotator.formModal.deleteCategory.title',
                                ),
                                description: localeText(
                                  'annotator.formModal.deleteCategory.desc',
                                ),
                                duration: 3,
                              });
                            } else {
                              deleteTempCategories(item.name);
                            }
                          }}
                        />,
                      ]}
                    >
                      {item.name}
                    </List.Item>
                  )}
                />
              </Form.Item>
              <p className={styles['categories-current-text']}>{`${localeText(
                'annotator.formModal.categoriesCount',
              )}: ${tempCategories.length}`}</p>
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
