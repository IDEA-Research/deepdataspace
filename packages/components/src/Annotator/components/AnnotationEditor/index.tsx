import { CloseOutlined } from '@ant-design/icons';
import { Button, Card, Select } from 'antd';
import classNames from 'classnames';
import { FloatWrapper } from '../FloatWrapper';
import { memo, useEffect, useMemo, useState } from 'react';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from 'dds-utils/locale';
import CategoryCreator from '../CategoryCreator';
import { Category, IAnnotationObject } from '../../type';
import PointItem from '../PointItem/PointItem';
import { EElementType, EObjectType, KEYPOINTS_VISIBLE_TYPE } from '../../constants';
import './index.less';

interface IProps {
  hideTitle: boolean;
  allowAddCategory: boolean;
  latestLabel: string;
  categories: Category[];
  currEditObject: IAnnotationObject | undefined;
  currObjectIndex: number;
  focusObjectIndex: number;
  focusEleType: EElementType;
  focusEleIndex: number;
  onCreateCategory: (name: string) => void;
  onCloseAnnotationEditor: () => void;
  onFinishCurrCreate: (label: string) => void;
  onDeleteCurrObject: () => void;
  onChangePointVisible: (index: number, visible: KEYPOINTS_VISIBLE_TYPE) => void;
}

export const AnnotationEditor: React.FC<IProps> = memo(
  ({
    hideTitle,
    allowAddCategory,
    latestLabel,
    categories,
    currEditObject,
    currObjectIndex,
    focusEleIndex,
    focusObjectIndex,
    focusEleType,
    onCreateCategory,
    onFinishCurrCreate,
    onDeleteCurrObject,
    onCloseAnnotationEditor,
    onChangePointVisible
  }) => {
    const { localeText } = useLocale();

    const defaultObjectLabel = currEditObject?.label || latestLabel;
    const [objLabel, setObjLabel] = useState(defaultObjectLabel);

    useEffect(() => {
      setObjLabel(currEditObject?.label || latestLabel);
    }, [currEditObject]);

    useKeyPress(
      EDITOR_SHORTCUTS[EShortcuts.SaveCurrObject].shortcut,
      (event: KeyboardEvent) => {
        if (currEditObject) {
          event.preventDefault();
          onFinishCurrCreate(objLabel);
        }
      },
      {
        exactMatch: true,
      },
    );

    const showKeypointsList = useMemo(() => {
      return currEditObject?.type === EObjectType.Skeleton;
    }, [currEditObject]);

    return (
      <FloatWrapper>
        <Card
          id="annotation-editor"
          className={classNames('dds-annotator-anno-editor', {
            'dds-annotator-anno-editor-visible': currEditObject,
          })}
          title={
            hideTitle ? null : (
              <div className="title">
                {localeText('DDSAnnotator.annotsEditor.title')}
                <Button
                  ghost
                  className="btn"
                  icon={<CloseOutlined />}
                  shape="circle"
                  size="small"
                  onClick={onCloseAnnotationEditor}
                ></Button>
              </div>
            )
          }
        >
          <div className="content">
            <div className="item">
              <Select
                showSearch
                className="selector"
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
                      <CategoryCreator onAdd={onCreateCategory} />
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
            {
              showKeypointsList &&
              <div className="item">
                <div className="list">
                  {
                    currEditObject && currEditObject.keypoints &&
                    currEditObject.keypoints.points.map((ele, eleIndex) => (
                      <PointItem
                        key={eleIndex}
                        point={ele}
                        index={eleIndex}
                        active={
                          focusObjectIndex === currObjectIndex &&
                          focusEleType === EElementType.Circle &&
                          focusEleIndex === eleIndex
                        }
                        onVisibleChange={(visible) => { onChangePointVisible(eleIndex, visible); }}
                      />
                    ))
                  }
                </div>
              </div>
            }
            <div className="item">
              <div className="actions">
                <Button
                  danger
                  onClick={(event) => {
                    event.preventDefault();
                    onDeleteCurrObject();
                  }}
                >
                  {localeText('DDSAnnotator.annotsEditor.delete')}
                </Button>
                <Button
                  type="primary"
                  onClick={(event) => {
                    event.preventDefault();
                    onFinishCurrCreate(objLabel);
                  }}
                >
                  {localeText('DDSAnnotator.annotsEditor.finish')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </FloatWrapper>
    );
  },
);
