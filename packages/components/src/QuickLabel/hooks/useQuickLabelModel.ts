import { useCallback, useMemo, useState } from 'react';
import { Updater, useImmer } from 'use-immer';
import { genFileNameByTimestamp, saveObejctToJsonFile } from 'dds-utils/file';
import {
  convertToCocoDateset,
  convertCocoDatasetToAnnotStates,
  validateCocoData,
} from '../utils/adapter';
import { COCO, QsAnnotatorFile } from '../type';
import { Category } from 'dds-components/Annotator';
import { history } from '@umijs/max';
import {
  message,
  notification,
  UploadFile as AntdUploadFile,
  UploadProps,
} from 'antd';
import { globalLocaleText } from 'dds-utils/locale';
import { UploadFile } from 'dds-components/Upload';
import { UploadChangeParam } from 'antd/es/upload';

const INIT_PRE_ANNOT = {
  info: {},
  images: [],
  annotations: [],
  categories: [],
};

export interface QuickLabelModel {
  qsModalVisible: boolean;
  setQsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  uploadFiles: UploadFile[];
  setUploadFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  images: QsAnnotatorFile[];
  setImages: Updater<QsAnnotatorFile[]>;
  filterImages: QsAnnotatorFile[];
  onClickQuickstart: () => void;
  onCancelUploadFiles: () => void;
  onConfirmUploadFiles: () => void;
  limitRemoveFile: (index: number) => boolean;
  current: number;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  categories: Category[];
  setCategories: Updater<Category[]>;
  filterCategoryName: string | null;
  setFilterCategoryName: Updater<string | null>;
  exportAnnotations: () => Promise<void>;
  uploadPreAnnot: AntdUploadFile[];
  onChangePreAnnotFile: (info: UploadChangeParam<AntdUploadFile<any>>) => void;
  onRemovePreAnnotFile: (file: AntdUploadFile) => void;
  onSelectFilterCategory: (name: string) => void;
  onClearFilterCategory: () => void;
}

export default (): QuickLabelModel => {
  const [images, setImages] = useImmer<QsAnnotatorFile[]>([]);
  const [current, setCurrent] = useState(-1);

  const [info, setInfo] = useState<COCO.Info>({
    year: new Date().getFullYear(),
    version: '1.0',
    description: 'Annotations in COCO format, labeled by DeepDataSpace',
    contributor: '',
    date_created: new Date().toISOString(),
  });

  const [categories, setCategories] = useImmer<Category[]>([
    {
      id: 'default',
      name: 'default',
    },
  ]);

  const [filterCategoryName, setFilterCategoryName] = useImmer<string | null>(
    null,
  );

  const filterImages = useMemo(() => {
    if (!filterCategoryName) return images;
    return images.filter((image) =>
      image.objects.find(
        (object) => object.categoryName === filterCategoryName,
      ),
    );
  }, [images, filterCategoryName]);

  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [qsModalVisible, setQsModalVisible] = useState(false);

  const [uploadPreAnnot, setUploadPreAnnot] = useState<AntdUploadFile[]>([]);

  const [preAnnots, setPreAnnots] = useImmer<COCO.Dataset>(INIT_PRE_ANNOT);

  const syncUploadFilesToImage = () => {
    const confirmedImages: QsAnnotatorFile[] = uploadFiles.map(
      (item, index) => {
        const image = images.find((image) => image.id === item.id);
        return {
          objects: [],
          urlFullRes: item.url,
          ...item,
          ...image,
          originalIndex: index,
        };
      },
    );

    const {
      info: updatedInfo,
      categories: updatedCategories,
      images: updatedImages,
    } = convertCocoDatasetToAnnotStates(preAnnots, {
      info,
      categories,
      images: confirmedImages,
    });

    setInfo(updatedInfo);
    setCategories(updatedCategories);
    setImages(updatedImages);
  };

  const onClickQuickstart = () => {
    syncUploadFilesToImage();
    setQsModalVisible(false);
    setCurrent(current > -1 ? current : 0);
    history.push('/quickstart');
  };

  const onCancelUploadFiles = () => {
    if (images.length <= 0) {
      return;
    }
    setUploadFiles(images);
    setQsModalVisible(false);
  };

  const onConfirmUploadFiles = () => {
    syncUploadFilesToImage();
    setQsModalVisible(false);
    setCurrent(-1);
  };

  const hasAnnotsOnImage = useCallback(
    (index: number) => {
      const image = images.find((item) => item.id === uploadFiles[index].id);
      return image && image.objects.length > 0;
    },
    [images, uploadFiles],
  );

  const limitRemoveFile = useCallback(
    (index: number) => {
      if (hasAnnotsOnImage(index)) {
        notification.error({
          message: globalLocaleText('quicklabel.formModal.deleteImage.title'),
          description: globalLocaleText(
            'quicklabel.formModal.deleteImage.desc',
          ),
          duration: 3,
        });
        return true;
      }
      return false;
    },
    [hasAnnotsOnImage],
  );

  /** Export with COCO formats*/
  const exportAnnotations = async () => {
    const dataset = await convertToCocoDateset({ info, images, categories });
    const fileName = genFileNameByTimestamp(Date.now(), 'Annotations');
    saveObejctToJsonFile(dataset, fileName);
  };

  const onChangePreAnnotFile: UploadProps['onChange'] = ({
    file,
    fileList,
  }) => {
    if (fileList.length === 0 || !fileList[0].originFileObj) return;

    const fileReader = new FileReader();
    fileReader.readAsText(fileList[0].originFileObj);

    fileReader.onload = function (event) {
      const parsedData = JSON.parse(event.target?.result as string);
      const result = validateCocoData(parsedData);
      if (result.success) {
        setUploadPreAnnot([file]);
        setPreAnnots(parsedData);
      } else {
        message.error(result.message);
      }
    };
  };

  const onRemovePreAnnotFile = (file: AntdUploadFile) => {
    const index = uploadPreAnnot.findIndex((item) => item.uid === file.uid);
    uploadPreAnnot.splice(index, 1);
    setUploadPreAnnot([...uploadPreAnnot]);
    setPreAnnots(INIT_PRE_ANNOT);
  };

  const onSelectFilterCategory = (name: string) => {
    setFilterCategoryName(name);
    setCurrent(-1);
  };

  const onClearFilterCategory = () => {
    setFilterCategoryName(null);
    setCurrent(-1);
  };

  return {
    qsModalVisible,
    setQsModalVisible,
    uploadFiles,
    setUploadFiles,

    images,
    setImages,
    filterImages,
    onClickQuickstart,
    onCancelUploadFiles,
    onConfirmUploadFiles,
    limitRemoveFile,

    current,
    setCurrent,
    categories,
    setCategories,
    filterCategoryName,
    setFilterCategoryName,
    exportAnnotations,

    uploadPreAnnot,
    onChangePreAnnotFile,
    onRemovePreAnnotFile,
    onSelectFilterCategory,
    onClearFilterCategory,
  };
};
