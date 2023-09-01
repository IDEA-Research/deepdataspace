import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import styles from './index.less';
import { AnnotateEditor, EditorMode } from 'dds-components/Annotator';
import { ImageList } from './components/ImageList';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { FormModal } from './components/FormModal';
import { useLocale } from 'dds-utils/locale';
import { useKeyPress } from 'ahooks';
import { BaseObject } from '@/types';

const Page: React.FC = () => {
  const {
    images,
    setImages,
    current,
    setCurrent,
    categories,
    setCategories,
    exportAnnotations,
  } = useModel('Annotator.model');

  const { localeText } = useLocale();
  const [openModal, setModalOpen] = useState(true);

  useEffect(() => {
    // const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    //   event.preventDefault();
    //   event.returnValue =
    //     'The current changes will not be saved. Please export before leaving.';
    // };
    // window.addEventListener('beforeunload', handleBeforeUnload);
    // return () => {
    //   window.removeEventListener('beforeunload', handleBeforeUnload);
    // };
  }, []);

  // local test
  useEffect(
    () => {
      // if(images.length > 0 && categories.length > 0) {
      //   localStorage.setItem('images', JSON.stringify(images));
      //   localStorage.setItem('categories', JSON.stringify(categories));
      //   console.log('>>> save localStorage');
      // }
      const images = localStorage.getItem('images');
      const categories = localStorage.getItem('categories');
      if (images && categories) {
        setImages(JSON.parse(images));
        setCategories(JSON.parse(categories));
        setModalOpen(false);
      }
    },
    // [images, categories]
    [],
  );

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

  return (
    <div className={styles.container}>
      <div
        className={styles.left}
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
            setModalOpen(true);
          }}
        >
          {localeText('annotator.setting')}
        </Button>
        <ImageList
          images={images}
          selected={current}
          onImageSelected={(index) => {
            setCurrent(index);
          }}
        />
      </div>
      <div className={styles.right}>
        <AnnotateEditor
          isSeperate={true}
          visible={true}
          mode={EditorMode.Edit}
          categories={categories}
          setCategories={setCategories}
          list={images}
          current={current}
          actionElements={[
            <Button type="primary" key={'export'} onClick={exportAnnotations}>
              {localeText('annotator.export')}
            </Button>,
          ]}
          onAutoSave={(annos: BaseObject[], naturalSize: ISize) => {
            setImages((images) => {
              if (images[current]) {
                images[current].objects = annos;
                images[current].width = naturalSize.width;
                images[current].height = naturalSize.height;
              }
            });
          }}
        />
      </div>
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <FormModal open={openModal} setOpen={setModalOpen} />
      </div>
    </div>
  );
};

export default Page;
