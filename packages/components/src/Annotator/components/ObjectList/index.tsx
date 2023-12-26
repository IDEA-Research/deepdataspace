import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button, Collapse, List, Tabs, Tooltip } from 'antd';
import { OBJECT_ICON } from '../../constants';
import { ReactComponent as DownArrorIcon } from '../../assets/downArror.svg';
import { ReactComponent as Palette } from '../../assets/palette.svg';
import { ReactComponent as Attribute } from '../../assets/attribute.svg';
import { ReactComponent as Layer } from '../../assets/layer.svg';
import classNames from 'classnames';
import Icon, {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  Category,
  DrawData,
  IAnnotationObject,
  IAnnotsDisplayOptions,
} from '../../type';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from 'dds-utils/locale';
import VirtualList, { ListRef } from 'rc-virtual-list';
import { useWindowResize } from 'dds-hooks';
import { isEqual } from 'lodash';
import './index.less';
import { Updater } from 'use-immer';

export interface IProps {
  objects: IAnnotationObject[];
  framesObjects?: IAnnotationObject[][];
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
  categories: Category[];
  setDrawDataWithHistory: Updater<DrawData>;
  colorByCategory: boolean;
  onChangeAnnotsDisplayOpts: (options: IAnnotsDisplayOptions) => void;
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
    isEqual(prev.framesObjects, next.framesObjects) &&
    prev.activeObjectIndex === next.activeObjectIndex &&
    prev.supportEdit === next.supportEdit &&
    prev.activeClassName === next.activeClassName &&
    prev.className === next.className &&
    prev.onChangeActiveClassName === next.onChangeActiveClassName &&
    prev.onFocusObject === next.onFocusObject &&
    prev.onDeleteObject === next.onDeleteObject &&
    prev.onChangeObjectHidden === next.onChangeObjectHidden &&
    prev.onChangeCategoryHidden === next.onChangeCategoryHidden &&
    prev.setDrawDataWithHistory === next.setDrawDataWithHistory &&
    isEqual(prev.categories, next.categories) &&
    prev.colorByCategory === next.colorByCategory &&
    prev.onChangeAnnotsDisplayOpts === next.onChangeAnnotsDisplayOpts
  );
};

export const ObjectList: React.FC<IProps> = memo((props) => {
  const {
    objects,
    framesObjects,
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
    categories,
    setDrawDataWithHistory,
    colorByCategory,
    onChangeAnnotsDisplayOpts,
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

  const switchColorMode = () => {
    onChangeAnnotsDisplayOpts({
      colorByCategory: !colorByCategory,
    });
  };

  const showEditingAttributes = useCallback(
    (object: IAnnotationObject, label: Category, index: number) => {
      onActiveObject(index);
      setDrawDataWithHistory((s) => {
        s.editingAttribute = {
          index,
          labelId: object.labelId,
          attributes: label.attributes || [],
          values: object.attributes || [],
        };
      });
    },
    [onActiveObject],
  );

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
        const labelName =
          categories.find((c) => c.id === obj.labelId)?.name ||
          DEFAULT_CLASS_NAME;
        if (!acc[labelName]) {
          acc[labelName] = [];
        }
        acc[labelName].push({ ...obj, originIndex: index });
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
          .map((labelName) => {
            const subObjects = objectMapByClass[labelName];
            const isHidden = subObjects.every((item) => item.hidden);
            const firstColor = subObjects[0]?.color;
            return (
              <Collapse.Panel
                key={labelName || DEFAULT_CLASS_NAME}
                showArrow={false}
                header={
                  <div
                    className={classNames('collapse-header', {
                      'collapse-header-selected': activeClassName === labelName,
                    })}
                    style={{ height: collapseHeaderHeight }}
                    key={labelName}
                    onClick={() => {
                      onChangeActiveClassName(
                        labelName === activeClassName ? '' : labelName,
                      );
                    }}
                  >
                    {activeClassName === labelName && (
                      <div
                        className="selected-line"
                        style={{
                          backgroundColor: firstColor || '#fff',
                        }}
                      />
                    )}
                    <div className="label-name">{labelName}</div>
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
                              onChangeCategoryHidden(labelName, !isHidden);
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
                {activeClassName === labelName && (
                  <List>
                    <VirtualList
                      data={subObjects}
                      height={containerHeight}
                      fullHeight={false}
                      itemHeight={itemHeight}
                      itemKey={'originIndex'}
                      ref={virtualListRef}
                    >
                      {(object: TObjectItem, objIndex: number) => {
                        const label = categories.find(
                          (c) => c.id === object.labelId,
                        );
                        const hasAttributes = !!label?.attributes?.length;
                        const requireAttribute = label?.attributes?.find(
                          (attribute, index) =>
                            attribute.required &&
                            [undefined, null, ''].includes(
                              object.attributes?.[index] as any,
                            ),
                        );
                        const frameCount =
                          framesObjects?.[object.originIndex]?.filter(
                            (obj) => obj && !obj.frameEmpty,
                          )?.length || 1;
                        return (
                          <List.Item
                            key={object.labelId + objIndex}
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
                            <div className="label">
                              # {object.originIndex + 1}
                            </div>
                            <div className="label-actions">
                              {framesObjects && (
                                <span className="frame-count">
                                  <Layer /> {frameCount}
                                </span>
                              )}
                              {hasAttributes && (
                                <Tooltip
                                  title={localeText(
                                    'DDSAnnotator.attribute.edit',
                                  )}
                                >
                                  <Button
                                    ghost
                                    className={classNames('attr-btn', {
                                      'attr-btn-warn': requireAttribute,
                                    })}
                                    icon={<Attribute />}
                                    shape={'circle'}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      showEditingAttributes(
                                        object,
                                        label,
                                        object.originIndex,
                                      );
                                    }}
                                  />
                                </Tooltip>
                              )}
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
                        );
                      }}
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
            label: localeText('DDSAnnotator.annotsList.labels'),
            children: classTab,
          },
        ]}
        tabBarExtraContent={
          <div className="tab-header-actions">
            <Tooltip title={localeText('DDSAnnotator.colorMode')}>
              <Button
                type="primary"
                className={classNames('tab-header-actions-color-btn', {
                  'tab-header-actions-color-btn-active': !colorByCategory,
                })}
                icon={<Icon component={Palette} />}
                onClick={switchColorMode}
              ></Button>
            </Tooltip>
            {objects.length > 0 && (
              <Tooltip
                title={
                  hideAllObjs
                    ? localeText('DDSAnnotator.annotsList.showAll')
                    : localeText('DDSAnnotator.annotsList.hideAll')
                }
              >
                <Button
                  ghost
                  icon={
                    hideAllObjs ? <EyeInvisibleOutlined /> : <EyeOutlined />
                  }
                  shape={'circle'}
                  onClick={onAllObjectHidden}
                />
              </Tooltip>
            )}
          </div>
        }
      />
    </div>
  );
}, propsAreEqual);
