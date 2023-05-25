import { DATA } from '@/services/type';
import { DeleteOutlined, PlusSquareOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Upload,
  UploadFile,
} from 'antd';
import { MAX_FILE_COUNT, MAX_FILE_SIZE } from '../../constants';
import { useModel } from '@umijs/max';
import { RcFile } from 'antd/es/upload';
import styles from './index.less';
import { useImmer } from 'use-immer';
import { LabelImageFile } from '@/types/annotator';
import { useEffect, useState } from 'react';
import { useLocale } from '@/locales/helper';

interface IProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FormModal: React.FC<IProps> = ({ open, setOpen }: IProps) => {
  const { localeText } = useLocale();
  const [form] = Form.useForm<{
    fileList: UploadFile[];
    categoryStr: string;
    tempCategories: DATA.Category[];
  }>();

  const { images, categories, setImages, setCategories } =
    useModel('Annotator.model');

  /** Temporarily store Image in the Form */
  const [tempImages, setTempImages] = useImmer<UploadFile[]>([]);

  /** Temporarily Displayed Category in the Form */
  const [tempCategories, setTempCategories] =
    useImmer<DATA.Category[]>(categories);

  useEffect(() => {
    // Add existing images to form data
    form.setFieldValue(
      'fileList',
      tempImages.map((item) => ({
        uid: item.uid,
        name: item.name,
        status: 'done',
        url: item.thumbUrl || item.url,
      })),
    );
  }, [tempImages]);

  useEffect(() => {
    // Sync the latest categories to form data, considering the categories could be added out of the form
    setTempCategories(categories);
  }, [open]);

  const validateImages = (_: any, fileList: RcFile[]) => {
    if (!fileList || fileList.length === 0) {
      return Promise.reject(localeText('annotator.formModal.fileRequiredMsg'));
    }

    if (fileList.length > MAX_FILE_COUNT) {
      return Promise.reject(
        localeText('annotator.formModal.fileCountLimitMsg', {
          count: MAX_FILE_COUNT,
        }),
      );
    }

    const hasExceededSize = fileList.some(
      (file) => file.size / 1024 / 1024 > MAX_FILE_SIZE,
    );
    if (hasExceededSize) {
      return Promise.reject(
        localeText('annotator.formModal.fileSizeLimitMsg', {
          size: MAX_FILE_SIZE,
        }),
      );
    }

    return Promise.resolve();
  };

  const onImagePreview = async (file: UploadFile) => {
    let src = file.thumbUrl || (file.url as string);
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as RcFile);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  const loadBase64Images = (files: UploadFile[]) => {
    const promises = files.map((file) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as RcFile);
        reader.onload = () => {
          const base64 = reader.result as string;
          const image = new Image();
          image.src = base64;
          image.onload = () => {
            const item: LabelImageFile = {
              id: file.uid,
              url: base64,
              urlFullRes: base64,
              fileName: file.name,
              width: image.width,
              height: image.height,
              objects: [],
            };
            setImages((images) => [...images, item]);
            resolve();
          };
          image.onerror = (error) => {
            reject(error);
          };
        };
        reader.onerror = (error) => {
          reject(error);
        };
      });
    });
    Promise.all(promises)
      .then(() => {})
      .catch((err) => {
        console.log(err);
      });
  };

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
    loadBase64Images(newFiles);
  };

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
    const newCategories: DATA.Category[] = [];
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

  const [confirmDelOpen, setConfirmDelOpen] = useState(-1);
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
          .then((values) => {
            // update tempImages & images & categories
            const { fileList } = values;
            setTempImages(fileList);
            updateImages(fileList);
            setCategories(tempCategories);

            // close modal
            setOpen(false);
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form layout="vertical" form={form} requiredMark={false}>
        <Form.Item
          style={{ margin: '30px 0' }}
          label={<h4>{localeText('annotator.formModal.importImages')}</h4>}
          name="fileList"
          valuePropName="fileList"
          getValueFromEvent={(e) => e && e.fileList}
          required
          rules={[{ validator: validateImages }]}
          extra={
            <p>
              {localeText('annotator.formModal.imageTips', {
                count: MAX_FILE_COUNT,
                size: MAX_FILE_SIZE,
              })}
            </p>
          }
        >
          <Upload
            showUploadList={true}
            beforeUpload={() => false}
            multiple
            listType="picture-card"
            onPreview={onImagePreview}
            accept={'image/png, image/jpeg, image/jpg'}
          >
            <Button icon={<PlusSquareOutlined />}></Button>
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
                  renderItem={(item, index) => (
                    <List.Item
                      className={styles['categories-current-list-item']}
                      style={{ padding: '2px 16px' }}
                      key={item.id}
                      actions={[
                        <Popconfirm
                          key={index}
                          overlayStyle={{ width: '300px' }}
                          title={localeText(
                            'annotator.formModal.deleteCategory.title',
                          )}
                          description={localeText(
                            'annotator.formModal.deleteCategory.desc',
                          )}
                          open={confirmDelOpen === index}
                          onConfirm={() => {
                            setConfirmDelOpen(-1);
                          }}
                          showCancel={false}
                        >
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            key="delete"
                            onClick={() => {
                              if (hasRelatedAnnots(item.name)) {
                                setConfirmDelOpen(index);
                              } else {
                                deleteTempCategories(item.name);
                                setConfirmDelOpen(-1);
                              }
                            }}
                          />
                        </Popconfirm>,
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
