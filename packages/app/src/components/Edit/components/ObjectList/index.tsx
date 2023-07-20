import React, { useEffect, useMemo, useState } from 'react';
import { Button, Collapse, Tabs, Tooltip } from 'antd';
import {
  EElementType,
  EObjectType,
  KEYPOINTS_VISIBLE_TYPE,
  OBJECT_ICON,
} from '@/constants';
import { ReactComponent as DownArrorIcon } from '@/assets/svg/downArror.svg';
import styles from './index.less';
import classNames from 'classnames';
import Icon, {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { IAnnotationObject } from '../../type';
import PointItem from '../Items/PointItem';
import RectItem from '../Items/RectItem';
import PolygonItem from '../Items/PolygonItem';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from '@/locales/helper';

export interface IProps {
  objects: IAnnotationObject[];
  labelColors: Record<string, string>;
  focusObjectIndex: number;
  activeObjectIndex: number;
  focusEleIndex: number;
  focusEleType: EElementType;
  isMovingElement: boolean;
  className?: string;
  supportEdit?: boolean;
  activeClassName: string;
  onFocusObject: (index: number) => void;
  onActiveObject: (index: number) => void;
  onFocusElement: (index: number) => void;
  onChangeFocusEleType: (type: EElementType) => void;
  onChangeObjectHidden: (index: number, hidden: boolean) => void;
  onChangeCategoryHidden: (category: string, hidden: boolean) => void;
  onDeleteObject: (index: number) => void;
  onChangeEleVisible: (eleType: EElementType, visible: boolean) => void;
  onCancelMovingStatus: () => void;
  onChangeActiveClassName: (className: string) => void;
  onChangePointVisible: (visible: KEYPOINTS_VISIBLE_TYPE) => void;
}

enum ETab {
  Object = 'object',
  Class = 'class',
}

type TObjectItem = IAnnotationObject & {
  /** Index in the ObjectList Array */
  originIndex: number;
};

const ObjectList: React.FC<IProps> = (props) => {
  const {
    objects,
    labelColors,
    focusObjectIndex,
    activeObjectIndex,
    focusEleIndex,
    focusEleType,
    isMovingElement,
    className,
    supportEdit,
    activeClassName,
    onFocusObject,
    onActiveObject,
    onFocusElement,
    onChangeFocusEleType,
    onChangeObjectHidden,
    onDeleteObject,
    onChangeEleVisible,
    onChangeCategoryHidden,
    onCancelMovingStatus,
    onChangeActiveClassName,
    onChangePointVisible,
  } = props;

  const { localeText } = useLocale();

  const DEFAULT_CLASS_NAME = localeText('editor.annotsList.uncategorized');

  const [curTab, setCurTab] = useState(ETab.Class);
  const onChangeTab = (key: string) => {
    setCurTab(key as ETab);
  };

  const hideAllObjs = useMemo(() => {
    return !objects.some((item) => !item.hidden);
  }, [objects]);

  const onAllObjectHidden = () => {
    objects.forEach((_, index) => {
      onChangeObjectHidden(index, !hideAllObjs);
    });
  };

  /** Hide All Objects */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.HideAll].shortcut,
    (event) => {
      event.preventDefault();
      onAllObjectHidden();
    },
    {
      exactMatch: true,
    },
  );

  /** Header of the instance in ObjectsTab */
  const objectItemHeader: React.FC<{
    object: IAnnotationObject;
    objIndex: number;
  }> = ({ object, objIndex }) => (
    <div
      className={classNames(styles.collapseHeader, {
        [styles.collapseHeaderSelected]: activeObjectIndex === objIndex,
      })}
      onMouseOver={() => {
        onFocusObject(objIndex);
      }}
    >
      {activeObjectIndex === objIndex && (
        <div
          className={styles.selectedLine}
          style={{
            backgroundColor: labelColors[object.label] || '#fff',
          }}
        />
      )}
      <Icon className={styles.icon} component={OBJECT_ICON[object.type]} />
      {object.label}
      <div className={styles.actions}>
        <Tooltip
          title={
            object.hidden
              ? localeText('editor.annotsList.show')
              : localeText('editor.annotsList.hide')
          }
        >
          <Button
            ghost
            className={styles.btn}
            icon={!object.hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            shape={'circle'}
            onClick={(event) => {
              event.stopPropagation();
              onChangeObjectHidden(objIndex, !object.hidden);
            }}
          />
        </Tooltip>
        {supportEdit && (
          <>
            <Tooltip title={localeText('editor.annotsList.delete')}>
              <Button
                ghost
                className={styles.btn}
                icon={<DeleteOutlined />}
                shape={'circle'}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteObject(objIndex);
                }}
              />
            </Tooltip>
          </>
        )}
        {[EObjectType.Custom, EObjectType.Skeleton].includes(object.type) && (
          <Button
            ghost
            className={styles.btn}
            icon={<DownArrorIcon className={`${styles.arrow}`} />}
            shape={'circle'}
          />
        )}
      </div>
    </div>
  );

  /** Map of instances grouped by category */
  const objectMapByClass: Record<string, TObjectItem[]> = useMemo(() => {
    return objects.reduce(
      (
        acc: Record<string, TObjectItem[]>,
        obj: IAnnotationObject,
        index: number,
      ) => {
        const label = obj.label || DEFAULT_CLASS_NAME;
        if (!acc[label]) {
          acc[label] = [];
        }
        acc[label].push({ ...obj, originIndex: index });
        return acc;
      },
      {},
    );
  }, [objects]);

  /** Automatically scroll the currently active instance into view */
  useEffect(() => {
    if (activeObjectIndex < 0) return;
    const activeTab = document.querySelector('.ant-tabs-tabpane-active');
    if (curTab === ETab.Object) {
      const activeElement = activeTab?.querySelector(
        `.${styles.collapse} .ant-collapse-item:nth-child(${
          activeObjectIndex + 1
        })`,
      );
      activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (curTab === ETab.Class && objectMapByClass[activeClassName]) {
      const index = objectMapByClass[activeClassName].findIndex(
        (item) => item.originIndex === activeObjectIndex,
      );
      const collapse = activeTab?.querySelector('.ant-collapse-item-active');
      const activeElement = collapse?.querySelector('.ant-collapse-content-box')
        ?.children[index];
      activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeObjectIndex]);

  /** ObjectTab: Support for expanding to the element level & editing the property */
  const objectTab = (
    <Collapse
      accordion
      ghost
      className={styles.collapse}
      activeKey={activeObjectIndex}
      onChange={(key) => {
        const activeKey = key === undefined ? -1 : Number(key);
        onActiveObject(activeKey);
      }}
    >
      {objects.length > 0 &&
        objects.map((object, objIndex) => (
          <Collapse.Panel
            key={objIndex}
            showArrow={false}
            collapsible={'header'}
            header={objectItemHeader({ object, objIndex })}
          >
            <div>
              {[EObjectType.Custom, EObjectType.Skeleton].includes(
                object.type,
              ) &&
                object.rect && (
                  <RectItem
                    rect={object.rect}
                    active={
                      focusObjectIndex === objIndex &&
                      focusEleType === EElementType.Rect
                    }
                    onMouseOut={() => {
                      onChangeFocusEleType(EElementType.Rect);
                      onFocusElement(-1);
                    }}
                    onMouseEnter={() => {
                      if (isMovingElement) {
                        onCancelMovingStatus();
                      }
                    }}
                    onMouseOver={() => {
                      onFocusObject(objIndex);
                      onChangeFocusEleType(EElementType.Rect);
                      onFocusElement(0);
                    }}
                    onVisibleChange={(visible) => {
                      onChangeEleVisible(EElementType.Rect, visible);
                    }}
                  />
                )}
              {[EObjectType.Custom, EObjectType.Skeleton].includes(
                object.type,
              ) &&
                object.polygon && (
                  <PolygonItem
                    element={object.polygon}
                    active={
                      focusObjectIndex === objIndex &&
                      focusEleType === EElementType.Polygon
                    }
                    onMouseOut={() => {
                      onChangeFocusEleType(EElementType.Rect);
                      onFocusElement(-1);
                    }}
                    onMouseEnter={() => {
                      if (isMovingElement) {
                        onCancelMovingStatus();
                      }
                    }}
                    onMouseOver={() => {
                      onFocusObject(objIndex);
                      onChangeFocusEleType(EElementType.Polygon);
                      onFocusElement(1);
                    }}
                    onVisibleChange={(visible) => {
                      onChangeEleVisible(EElementType.Polygon, visible);
                    }}
                  />
                )}
              {object.keypoints &&
                object.keypoints.points.length &&
                object.keypoints.points.map((ele, eleIndex) => (
                  <PointItem
                    key={eleIndex}
                    point={ele}
                    index={eleIndex}
                    active={
                      focusObjectIndex === objIndex &&
                      focusEleType === EElementType.Circle &&
                      focusEleIndex === eleIndex
                    }
                    onMouseEnter={() => {
                      if (isMovingElement) {
                        onCancelMovingStatus();
                      }
                    }}
                    onMouseOut={() => {
                      onChangeFocusEleType(EElementType.Rect);
                      onFocusElement(-1);
                    }}
                    onMouseOver={() => {
                      onFocusObject(objIndex);
                      onChangeFocusEleType(EElementType.Circle);
                      onFocusElement(eleIndex);
                    }}
                    onVisibleChange={onChangePointVisible}
                  />
                ))}
            </div>
          </Collapse.Panel>
        ))}
    </Collapse>
  );

  /** ClassTab: Tiling by category with support for expanding to the instance level */
  const classTab = (
    <Collapse
      accordion
      ghost
      className={styles.collapse}
      activeKey={activeClassName}
      onChange={(key) => {
        onChangeActiveClassName(key as string);
      }}
    >
      {objects.length > 0 &&
        Object.keys(objectMapByClass)
          .sort()
          .map((label) => {
            const subObjects = objectMapByClass[label];
            const isHidden = subObjects.every((item) => item.hidden);
            return (
              <Collapse.Panel
                key={label || DEFAULT_CLASS_NAME}
                showArrow={false}
                collapsible={'header'}
                header={
                  <div
                    className={classNames(styles.collapseHeader, {
                      [styles.collapseHeaderSelected]:
                        activeClassName === label,
                    })}
                    key={label}
                  >
                    {activeClassName === label && (
                      <div
                        className={styles.selectedLine}
                        style={{
                          backgroundColor: labelColors[label] || '#fff',
                        }}
                      />
                    )}
                    <div className={styles.labelName}>{label}</div>
                    <div className={styles.actions}>
                      <span className={styles.labelCount}>
                        {subObjects.length}
                      </span>
                      {supportEdit && (
                        <Tooltip
                          title={
                            isHidden
                              ? localeText('editor.annotsList.showCate')
                              : localeText('editor.annotsList.hideCate')
                          }
                        >
                          <Button
                            ghost
                            className={classNames(styles.btn)}
                            icon={
                              isHidden ? (
                                <EyeInvisibleOutlined />
                              ) : (
                                <EyeOutlined />
                              )
                            }
                            shape={'circle'}
                            onClick={(event) => {
                              event.stopPropagation();
                              onChangeCategoryHidden(label, !isHidden);
                            }}
                          />
                        </Tooltip>
                      )}
                      <Button
                        ghost
                        className={styles.btn}
                        icon={<DownArrorIcon className={`${styles.arrow}`} />}
                        shape={'circle'}
                      />
                    </div>
                  </div>
                }
              >
                {subObjects.map((object, objIndex) => (
                  <div
                    className={classNames(styles.collapseItem)}
                    onMouseOver={() => {
                      onFocusObject(object.originIndex);
                    }}
                    key={object.label + objIndex}
                    onClick={(event) => {
                      event.stopPropagation();
                      onActiveObject(object.originIndex);
                    }}
                  >
                    {activeObjectIndex === object.originIndex && (
                      <div
                        className={styles.colorHint}
                        style={{
                          backgroundColor: labelColors[label] || '#fff',
                        }}
                      ></div>
                    )}
                    <Icon
                      className={styles.icon}
                      component={OBJECT_ICON[object.type]}
                    />
                    <div>{object.label}</div>
                    <div className={styles.actions}>
                      <Tooltip
                        title={
                          object.hidden
                            ? localeText('editor.annotsList.show')
                            : localeText('editor.annotsList.hide')
                        }
                      >
                        <Button
                          ghost
                          className={styles.btn}
                          icon={
                            object.hidden ? (
                              <EyeInvisibleOutlined />
                            ) : (
                              <EyeOutlined />
                            )
                          }
                          shape={'circle'}
                          onClick={(event) => {
                            event.stopPropagation();
                            onChangeObjectHidden(
                              object.originIndex,
                              !object.hidden,
                            );
                          }}
                        />
                      </Tooltip>
                      {supportEdit && (
                        <>
                          <Tooltip
                            title={localeText('editor.annotsList.delete')}
                          >
                            <Button
                              ghost
                              className={styles.btn}
                              icon={<DeleteOutlined />}
                              shape={'circle'}
                              onClick={(event) => {
                                event.stopPropagation();
                                onDeleteObject(object.originIndex);
                              }}
                            />
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </Collapse.Panel>
            );
          })}
    </Collapse>
  );

  return (
    <div
      className={classNames(styles.rightOperations, className)}
      id="rightOperations"
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <Tabs
        activeKey={curTab}
        onChange={onChangeTab}
        items={[
          {
            key: ETab.Class,
            label: localeText('editor.annotsList.categories'),
            children: classTab,
          },
          {
            key: ETab.Object,
            label: localeText('editor.annotsList.objects'),
            children: objectTab,
          },
        ]}
        tabBarExtraContent={
          objects.length > 0 && (
            <Tooltip
              title={
                hideAllObjs
                  ? localeText('editor.annotsList.showAll')
                  : localeText('editor.annotsList.hideAll')
              }
            >
              <Button
                ghost
                className={styles.tabHeaderActions}
                icon={hideAllObjs ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                shape={'circle'}
                onClick={onAllObjectHidden}
              />
            </Tooltip>
          )
        }
      />
    </div>
  );
};

export default ObjectList;
