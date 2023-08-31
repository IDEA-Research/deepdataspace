import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Collapse, List, Tabs, Tooltip } from 'antd';
import { OBJECT_ICON } from '../../constants';
import { ReactComponent as DownArrorIcon } from '../../assets/downArror.svg';
import classNames from 'classnames';
import Icon, {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { IAnnotationObject } from '../../type';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from 'dds-utils/locale';
import VirtualList, { ListRef } from 'rc-virtual-list';
import { useWindowResize } from 'dds-hooks';
import { isEqual } from 'lodash';
import './index.less';

export interface IProps {
  objects: IAnnotationObject[];
  labelColors: Record<string, string>;
  activeObjectIndex: number;
  className?: string;
  supportEdit?: boolean;
  activeClassName: string;
  onFocusObject: (index: number) => void;
  onActiveObject: (index: number) => void;
  onChangeObjectHidden: (index: number, hidden: boolean) => void;
  onChangeCategoryHidden: (category: string, hidden: boolean) => void;
  onDeleteObject: (index: number) => void;
  onChangeActiveClassName: (className: string) => void;
}

enum ETab {
  Object = 'object',
  Class = 'class',
}

type TObjectItem = IAnnotationObject & {
  /** Index in the ObjectList Array */
  originIndex: number;
};

// TODO: 优化objectList数据, 缩放或移动鼠标不应该刷新ObjectList
const propsAreEqual = (prev: IProps, next: IProps): boolean => {
  return (
    isEqual(prev.objects, next.objects) &&
    prev.activeObjectIndex === next.activeObjectIndex &&
    prev.supportEdit === next.supportEdit &&
    prev.activeClassName === next.activeClassName &&
    prev.className === next.className &&
    isEqual(prev.labelColors, next.labelColors) &&
    prev.onChangeActiveClassName === next.onChangeActiveClassName &&
    prev.onFocusObject === next.onFocusObject &&
    prev.onDeleteObject === next.onDeleteObject &&
    prev.onChangeObjectHidden === next.onChangeObjectHidden &&
    prev.onChangeCategoryHidden === next.onChangeCategoryHidden
  );
};

export const ObjectList: React.FC<IProps> = memo((props) => {
  const {
    objects,
    labelColors,
    activeObjectIndex,
    className,
    supportEdit,
    activeClassName,
    onFocusObject,
    onActiveObject,
    onChangeObjectHidden,
    onDeleteObject,
    onChangeCategoryHidden,
    onChangeActiveClassName,
  } = props;

  const { localeText } = useLocale();

  const DEFAULT_CLASS_NAME = localeText(
    'DDSAnnotator.annotsList.uncategorized',
  );

  const [curTab, setCurTab] = useState(ETab.Class);
  const onChangeTab = (key: string) => {
    setCurTab(key as ETab);
  };

  /** Attributes for Virtual List */
  const { height } = useWindowResize();
  const collapseHeaderHeight = 45;
  const itemHeight = 35;
  const containerHeight = height - collapseHeaderHeight - 56;
  const virtualListRef = useRef<ListRef>(null);

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
        `.tab-collapse .ant-collapse-item:nth-child(${activeObjectIndex + 1})`,
      );
      activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (curTab === ETab.Class && objectMapByClass[activeClassName]) {
      const index = objectMapByClass[activeClassName].findIndex(
        (item) => item.originIndex === activeObjectIndex,
      );
      if (index > -1) {
        virtualListRef.current?.scrollTo({
          index,
          align: 'auto',
        });
      }
    }
  }, [activeObjectIndex]);

  /** ClassTab: Tiling by category with support for expanding to the instance level */
  const classTab = (
    <Collapse
      accordion
      ghost
      className="tab-collapse"
      activeKey={activeClassName}
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
                header={
                  <div
                    className={classNames('collapse-header', {
                      'collapse-header-selected': activeClassName === label,
                    })}
                    style={{ height: collapseHeaderHeight }}
                    key={label}
                    onClick={() => {
                      onChangeActiveClassName(
                        label === activeClassName ? '' : label,
                      );
                    }}
                  >
                    {activeClassName === label && (
                      <div
                        className="selected-line"
                        style={{
                          backgroundColor: labelColors[label] || '#fff',
                        }}
                      />
                    )}
                    <div className="label-name">{label}</div>
                    <div className="label-actions">
                      <span className="label-count">{subObjects.length}</span>
                      {supportEdit && (
                        <Tooltip
                          title={
                            isHidden
                              ? localeText('DDSAnnotator.annotsList.showCate')
                              : localeText('DDSAnnotator.annotsList.hideCate')
                          }
                        >
                          <Button
                            ghost
                            className="label-btn"
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
                        className="label-btn"
                        icon={<DownArrorIcon className="down-arrow" />}
                        shape={'circle'}
                      />
                    </div>
                  </div>
                }
              >
                {activeClassName === label && (
                  <List>
                    <VirtualList
                      data={subObjects}
                      height={containerHeight}
                      fullHeight={false}
                      itemHeight={itemHeight}
                      itemKey={'originIndex'}
                      ref={virtualListRef}
                    >
                      {(object: TObjectItem, objIndex: number) => (
                        <List.Item
                          key={object.label + objIndex}
                          className="collapse-item"
                          style={{ height: itemHeight }}
                          onMouseOver={() => {
                            onFocusObject(object.originIndex);
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            onActiveObject(object.originIndex);
                          }}
                        >
                          {activeObjectIndex === object.originIndex && (
                            <div
                              className="color-hint"
                              style={{
                                backgroundColor: object.color,
                              }}
                            ></div>
                          )}
                          <Icon
                            className="label-icon"
                            component={OBJECT_ICON[object.type]}
                          />
                          <div className="label">{object.label}</div>
                          <div className="label-actions">
                            <Tooltip
                              title={
                                object.hidden
                                  ? localeText('DDSAnnotator.annotsList.show')
                                  : localeText('DDSAnnotator.annotsList.hide')
                              }
                            >
                              <Button
                                ghost
                                className="label-btn"
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
                                  title={localeText(
                                    'DDSAnnotator.annotsList.delete',
                                  )}
                                >
                                  <Button
                                    ghost
                                    className="label-btn"
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
                        </List.Item>
                      )}
                    </VirtualList>
                  </List>
                )}
              </Collapse.Panel>
            );
          })}
    </Collapse>
  );

  return (
    <div
      className={classNames('dds-annotator-objectlist', className)}
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
            label: localeText('DDSAnnotator.annotsList.categories'),
            children: classTab,
          },
          // {
          //   key: ETab.Object,
          //   label: localeText('DDSAnnotator.annotsList.objects'),
          //   children: objectTab,
          // },
        ]}
        tabBarExtraContent={
          objects.length > 0 && (
            <Tooltip
              title={
                hideAllObjs
                  ? localeText('DDSAnnotator.annotsList.showAll')
                  : localeText('DDSAnnotator.annotsList.hideAll')
              }
            >
              <Button
                ghost
                className="tab-header-actions"
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
}, propsAreEqual);
