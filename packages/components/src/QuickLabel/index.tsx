import React, { useEffect } from 'react';
import { history } from '@umijs/max';
import {
  AnnotateEditor,
  BaseObject,
  EditorMode,
} from 'dds-components/Annotator';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useKeyPress } from 'ahooks';
import { ImageList } from './components/ImageList';
import QuickstartModal from './components/QuickstartModal';
import ImageFilter from './components/ImageFilter';
import { QuickLabelModel } from './hooks/useQuickLabelModel';
import { globalLocaleText } from 'dds-utils/locale';
import './index.less';

const QuickLabel: React.FC<QuickLabelModel> = (props) => {
  const {
    images,
    filterImages,
    current,
    categories,
    qsModalVisible,
    uploadFiles,
    uploadPreAnnot,
    filterCategoryName,
    setImages,
    setCurrent,
    setCategories,
    setQsModalVisible,
    setUploadFiles,
    limitRemoveFile,
    onCancelUploadFiles,
    onConfirmUploadFiles,
    exportAnnotations,
    onChangePreAnnotFile,
    onRemovePreAnnotFile,
    onSelectFilterCategory,
    onClearFilterCategory,
  } = props;

  useEffect(() => {
    if (images.length <= 0) {
      setQsModalVisible(true);
    }
  }, []);

  useKeyPress(
    'uparrow',
    () => {
      setCurrent(Math.max(0, current - 1));
    },
    { exactMatch: true },
  );

  useKeyPress(
    'downarrow',
    () => {
      setCurrent(Math.min(current + 1, images.length - 1));
    },
    { exactMatch: true },
  );

  const onAutoSave = (annos: BaseObject[], naturalSize: ISize) => {
    if (!filterImages[current]) return;
    const originalIndex = filterImages[current].originalIndex;
    setImages((images) => {
      if (images[originalIndex]) {
        images[originalIndex].objects = annos;
        images[originalIndex].width = naturalSize.width;
        images[originalIndex].height = naturalSize.height;
      }
    });
  };

  return (
    <div className="dds-quicklabel">
      <div
        className="dds-quicklabel-list"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onMouseUp={(event) => {
          event.stopPropagation();
        }}
      >
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => {
            setQsModalVisible(true);
          }}
        >
          {globalLocaleText('quicklabel.setting')}
        </Button>
        <ImageList
          images={filterImages}
          selected={current}
          onImageSelected={(index) => {
            setCurrent(index);
          }}
        />
      </div>
      <div className="dds-quicklabel-workspace">
        <AnnotateEditor
          isOldMode
          isSeperate={true}
          visible={true}
          mode={EditorMode.Edit}
          categories={categories}
          setCategories={setCategories}
          list={filterImages}
          current={current}
          titleElements={[
            <ImageFilter
              key={'image-filters'}
              categories={categories}
              filterCategoryName={filterCategoryName}
              onSelectFilter={onSelectFilterCategory}
              onClearFilter={onClearFilterCategory}
            />,
          ]}
          actionElements={[
            <Button type="primary" key={'export'} onClick={exportAnnotations}>
              {globalLocaleText('quicklabel.export')}
            </Button>,
          ]}
          onAutoSave={onAutoSave}
          onCancel={() => history.push('/')}
        />
      </div>
      <QuickstartModal
        open={qsModalVisible}
        isInit={images.length === 0}
        fileList={uploadFiles}
        setFileList={setUploadFiles}
        limitRemoveFile={limitRemoveFile}
        okText={globalLocaleText('quicklabel.formModal.confirm')}
        onClickCancel={onCancelUploadFiles}
        onClickOk={onConfirmUploadFiles}
        limitClose={images.length <= 0}
        uploadPreAnnot={uploadPreAnnot}
        onChangePreAnnotFile={onChangePreAnnotFile}
        onRemovePreAnnotFile={onRemovePreAnnotFile}
      />
    </div>
  );
};

export default QuickLabel;
