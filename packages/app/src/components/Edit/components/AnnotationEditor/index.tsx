import { CloseOutlined } from '@ant-design/icons';
import { Button, Card, Select } from 'antd';
import classNames from 'classnames';
import { DrawData, IAnnotationObject } from '../..';
import styles from './index.less';
import { FloatWrapper } from '@/components/FloatWrapper';
import { useEffect, useState } from 'react';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from '@/locales/helper';
import CategoryCreator from '../CategoryCreator';
import { DATA } from '@/services/type';

interface IProps {
  hideTitle: boolean;
  allowAddCategory: boolean;
  drawData: DrawData;
  categories: DATA.Category[];
  currEditObject: IAnnotationObject | undefined;
  onCreateCategory: (name: string) => void;
  onCloseAnnotationEditor: () => void;
  onFinishCurrCreate: (label: string) => void;
  onDeleteCurrObject: () => void;
}

const AnnotationEditor: React.FC<IProps> = ({
  hideTitle,
  allowAddCategory,
  drawData,
  categories,
  currEditObject,
  onCreateCategory,
  onFinishCurrCreate,
  onDeleteCurrObject,
  onCloseAnnotationEditor,
}) => {
  const { localeText } = useLocale();

  const defaultObjectLabel = currEditObject?.label || drawData.latestLabel;
  const [objLabel, setObjLabel] = useState(defaultObjectLabel);

  useEffect(() => {
    setObjLabel(currEditObject?.label || drawData.latestLabel);
  }, [currEditObject]);

  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.SaveCurrObject].shortcut,
    (event: KeyboardEvent) => {
      event.preventDefault();
      onFinishCurrCreate(objLabel);
    },
    {
      exactMatch: true,
    },
  );

  return (
    <FloatWrapper>
      <Card
        id="annotation-editor"
        className={classNames(styles.container, {
          [styles.containedVisible]: currEditObject,
        })}
        title={
          hideTitle ? null : (
            <div className={styles.title}>
              {localeText('editor.annotsEditor.title')}
              <Button
                ghost
                className={styles.btn}
                icon={<CloseOutlined />}
                shape="circle"
                size="small"
                onClick={onCloseAnnotationEditor}
              ></Button>
            </div>
          )
        }
      >
        <div className={styles.content}>
          <div className={styles.item}>
            <Select
              showSearch
              className={styles.selector}
              placeholder="Select a label"
              size="middle"
              value={objLabel || undefined}
              onChange={(label) => {
                setObjLabel(label);
              }}
              popupClassName="objects-select-popup"
              onClick={(event) => event.stopPropagation()}
              onKeyUp={(event) => event.stopPropagation()}
              onInputKeyDown={(event) => {
                if (event.code !== 'Enter') {
                  event.stopPropagation();
                }
              }}
              // @ts-ignore
              getPopupContainer={() =>
                document.getElementById('annotation-editor')
              }
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {allowAddCategory && (
                    <CategoryCreator
                      onAdd={(value) => onCreateCategory(value)}
                    />
                  )}
                </>
              )}
            >
              {categories?.map((category) => (
                <Select.Option key={category.id} value={category.name}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className={styles.item}>
            <div className={styles.actions}>
              <Button
                danger
                onClick={(event) => {
                  event.preventDefault();
                  onDeleteCurrObject();
                }}
              >
                {localeText('editor.annotsEditor.delete')}
              </Button>
              <Button
                type="primary"
                onClick={(event) => {
                  event.preventDefault();
                  onFinishCurrCreate(objLabel);
                }}
              >
                {localeText('editor.annotsEditor.finish')}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </FloatWrapper>
  );
};

export default AnnotationEditor;
