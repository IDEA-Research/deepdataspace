import { Button, Popover } from 'antd';
import Icon, { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import {
  EBasicToolItem,
  EObjectType,
  EActionToolItem,
  EToolType,
  OBJECT_ICON,
  EDITOR_TOOL_ICON,
  MAX_SCALE,
  MIN_SCALE,
  OBJECT_AI_ICON,
  TOOL_MODELS_MAP,
  EnumModelType,
} from '../../constants';
import { ReactComponent as DragToolIcon } from '../../assets/drag.svg';
import { useKeyPress } from 'ahooks';
import {
  EDITOR_SHORTCUTS,
  EShortcuts,
  TShortcutItem,
} from '../../constants/shortcuts';
import { memo, useMemo } from 'react';
import { getIconFromShortcut } from '../ShortcutsInfo';
import { useLocale } from 'dds-utils/locale';
import { ReactComponent as ZoomResize } from '../../assets/zoomResize.svg';
import './index.less';

type TToolItem<T> = {
  key: T;
  name: string;
  shortcut: TShortcutItem;
  icon: JSX.Element;
  aiIcon?: JSX.Element;
  aiModels?: EnumModelType[];
  description?: string;
};

interface IProps {
  selectedTool: EToolType;
  manualMode?: boolean;
  limitToolTypes?: EBasicToolItem[];
  supportRepeat?: boolean;
  isAIAnnotationActive: boolean;
  onChangeSelectedTool: (type: EToolType) => void;
  onActiveAIAnnotation: (active: boolean) => void;
  undo: () => void;
  redo: () => void;
  repeatPrevious?: () => void;
  deleteAll: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onlySupportZoom: boolean;
  hideUndoRedoActions?: boolean;
}

const SliderToolBar: React.FC<IProps> = memo(
  ({
    selectedTool,
    manualMode,
    supportRepeat,
    limitToolTypes,
    isAIAnnotationActive,
    onChangeSelectedTool,
    onActiveAIAnnotation,
    undo,
    redo,
    repeatPrevious,
    deleteAll,
    scale,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onlySupportZoom,
    hideUndoRedoActions,
  }) => {
    const { localeText } = useLocale();

    const dragTools: TToolItem<EBasicToolItem.Drag>[] = useMemo(() => {
      return [
        {
          key: EBasicToolItem.Drag,
          name: localeText('DDSAnnotator.toolbar.drag'),
          shortcut: EDITOR_SHORTCUTS[EShortcuts.DragTool],
          icon: <Icon component={DragToolIcon} />,
          description: localeText('DDSAnnotator.toolbar.drag.desc'),
        },
      ];
    }, []);

    const annoTools: TToolItem<EBasicToolItem>[] = useMemo(() => {
      const typeTools = [
        {
          key: EBasicToolItem.Rectangle,
          name: localeText('DDSAnnotator.toolbar.rectangle'),
          shortcut: EDITOR_SHORTCUTS[EShortcuts.RectangleTool],
          icon: <Icon component={OBJECT_ICON[EObjectType.Rectangle]} />,
          aiIcon: <Icon component={OBJECT_AI_ICON[EObjectType.Rectangle]} />,
          aiModels: TOOL_MODELS_MAP[EBasicToolItem.Rectangle],
          description: localeText('DDSAnnotator.toolbar.rectangle.desc'),
        },
        {
          key: EBasicToolItem.Polygon,
          name: localeText('DDSAnnotator.toolbar.polygon'),
          shortcut: EDITOR_SHORTCUTS[EShortcuts.PolygonTool],
          icon: <Icon component={OBJECT_ICON[EObjectType.Polygon]} />,
          aiIcon: <Icon component={OBJECT_AI_ICON[EObjectType.Polygon]} />,
          description: localeText('DDSAnnotator.toolbar.polygon.desc'),
        },
        {
          key: EBasicToolItem.Skeleton,
          name: localeText('DDSAnnotator.toolbar.skeleton'),
          shortcut: EDITOR_SHORTCUTS[EShortcuts.SkeletonTool],
          icon: <Icon component={OBJECT_ICON[EObjectType.Skeleton]} />,
          aiIcon: <Icon component={OBJECT_AI_ICON[EObjectType.Skeleton]} />,
          description: localeText('DDSAnnotator.toolbar.skeleton.desc'),
        },
        {
          key: EBasicToolItem.Mask,
          name: localeText('DDSAnnotator.toolbar.mask'),
          shortcut: EDITOR_SHORTCUTS[EShortcuts.MaskTool],
          icon: <Icon component={OBJECT_ICON[EObjectType.Mask]} />,
          aiIcon: <Icon component={OBJECT_AI_ICON[EObjectType.Mask]} />,
          description: localeText('DDSAnnotator.toolbar.mask.desc'),
        },
      ];
      if (limitToolTypes) {
        return typeTools.filter((item) => limitToolTypes.includes(item.key));
      }
      return typeTools;
    }, [limitToolTypes]);

    const smartTool: TToolItem<EActionToolItem> = {
      key: EActionToolItem.SmartAnnotation,
      name: localeText('DDSAnnotator.toolbar.aiAnno'),
      shortcut: EDITOR_SHORTCUTS[EShortcuts.SmartAnnotation],
      icon: (
        <Icon component={EDITOR_TOOL_ICON[EActionToolItem.SmartAnnotation]} />
      ),
      description: localeText('DDSAnnotator.toolbar.aiAnno.desc'),
    };

    const actionTools = [
      ...(!hideUndoRedoActions
        ? [
            {
              key: EActionToolItem.Undo,
              name: localeText('DDSAnnotator.toolbar.undo'),
              icon: <Icon component={EDITOR_TOOL_ICON[EActionToolItem.Undo]} />,
              shortcut: EDITOR_SHORTCUTS[EShortcuts.Undo],
              handler: undo,
              description: localeText('DDSAnnotator.toolbar.undo.desc'),
            },
            {
              key: EActionToolItem.Redo,
              name: localeText('DDSAnnotator.toolbar.redo'),
              icon: <Icon component={EDITOR_TOOL_ICON[EActionToolItem.Redo]} />,
              shortcut: EDITOR_SHORTCUTS[EShortcuts.Redo],
              handler: redo,
              description: localeText('DDSAnnotator.toolbar.redo.desc'),
            },
          ]
        : []),
      ...(supportRepeat
        ? [
            {
              key: EActionToolItem.RepeatPrevious,
              name: localeText('DDSAnnotator.toolbar.repeatPrevious'),
              icon: (
                <Icon
                  component={EDITOR_TOOL_ICON[EActionToolItem.RepeatPrevious]}
                />
              ),
              shortcut: EDITOR_SHORTCUTS[EShortcuts.RepeatPrevious],
              handler: repeatPrevious,
              description: localeText(
                'DDSAnnotator.toolbar.repeatPrevious.desc',
              ),
            },
          ]
        : []),
      {
        key: EActionToolItem.DeleteAll,
        name: localeText('DDSAnnotator.toolbar.deleteAll'),
        icon: <Icon component={EDITOR_TOOL_ICON[EActionToolItem.DeleteAll]} />,
        shortcut: EDITOR_SHORTCUTS[EShortcuts.DeleteAll],
        handler: deleteAll,
        description: localeText('DDSAnnotator.toolbar.deleteAll.desc'),
      },
    ];

    const basicToolKeys: string[] = useMemo(() => {
      return [...dragTools, ...annoTools].reduce((keys: string[], tool) => {
        return keys.concat(tool.shortcut.shortcut);
      }, []);
    }, [dragTools, annoTools]);

    /** Active Basic Tool */
    useKeyPress(
      basicToolKeys,
      (event) => {
        const activeTool = [...dragTools, ...annoTools].find((tool) => {
          return tool.shortcut.shortcut.includes(event.key);
        });
        if (activeTool) {
          onChangeSelectedTool(activeTool.key);
        }
      },
      {
        exactMatch: true,
      },
    );

    /** Active AI Annotation */
    useKeyPress(
      EDITOR_SHORTCUTS[EShortcuts.SmartAnnotation].shortcut,
      () => {
        if (selectedTool !== EBasicToolItem.Drag) {
          onActiveAIAnnotation(!isAIAnnotationActive);
        }
      },
      {
        exactMatch: true,
      },
    );

    /** Undo */
    useKeyPress(
      EDITOR_SHORTCUTS[EShortcuts.Undo].shortcut,
      (event: KeyboardEvent) => {
        event.preventDefault();
        undo();
      },
      {
        exactMatch: true,
      },
    );

    /** Redo */
    useKeyPress(
      EDITOR_SHORTCUTS[EShortcuts.Redo].shortcut,
      (event: KeyboardEvent) => {
        event.preventDefault();
        redo();
      },
      {
        exactMatch: true,
      },
    );

    /** Repeat Previous */
    useKeyPress(
      EDITOR_SHORTCUTS[EShortcuts.RepeatPrevious].shortcut,
      (event: KeyboardEvent) => {
        event.preventDefault();
        repeatPrevious?.();
      },
      {
        exactMatch: true,
      },
    );

    /** Delete All */
    useKeyPress(
      EDITOR_SHORTCUTS[EShortcuts.DeleteAll].shortcut,
      (event: KeyboardEvent) => {
        event.preventDefault();
        deleteAll();
      },
      {
        exactMatch: true,
      },
    );

    const disabledZoomIn = scale >= MAX_SCALE;
    const disabledZoomOut = scale <= MIN_SCALE;

    useKeyPress(EDITOR_SHORTCUTS[EShortcuts.ZoomIn].shortcut, () => {
      if (disabledZoomIn) return;
      onZoomIn();
    });

    useKeyPress(EDITOR_SHORTCUTS[EShortcuts.ZoomOut].shortcut, () => {
      if (disabledZoomOut) return;
      onZoomOut();
    });

    useKeyPress(EDITOR_SHORTCUTS[EShortcuts.Reset].shortcut, () => {
      onZoomReset();
    });

    const popoverContent = (
      item: TToolItem<EBasicToolItem | EActionToolItem>,
    ) => {
      const icon = getIconFromShortcut(item.shortcut.shortcut, false);
      return (
        <div className="dds-annotator-slidertoolbar-popover">
          <div>
            <span className="popover-title">{item.name}</span>
            <span className="popover-key">{icon}</span>
          </div>
          <div className="popover-divider"></div>
          <div className="popover-description">{item.description}</div>
        </div>
      );
    };

    return (
      <div
        className="dds-annotator-slidertoolbar"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {!onlySupportZoom ? (
          <div className="dds-annotator-slidertoolbar-content">
            {dragTools.map((item) => (
              <Popover
                placement="right"
                content={popoverContent(item)}
                key={item.key}
              >
                <Button
                  className={classNames('slidertoolbar-btn', {
                    'slidertoolbar-btn-active': selectedTool === item.key,
                  })}
                  icon={item.icon}
                  onClick={() => onChangeSelectedTool(item.key)}
                />
              </Popover>
            ))}
            {annoTools.map((item) => (
              <div
                key={item.key}
                className={classNames({
                  'slidertoolbar-annotool-active-wrap':
                    selectedTool === item.key && !manualMode,
                })}
              >
                <Popover placement="right" content={popoverContent(item)}>
                  <Button
                    className={classNames('slidertoolbar-btn', {
                      'slidertoolbar-btn-active':
                        selectedTool === item.key && !isAIAnnotationActive,
                    })}
                    icon={item.icon}
                    onClick={() => onChangeSelectedTool(item.key)}
                  />
                </Popover>
                {selectedTool === item.key && !manualMode && (
                  <Popover
                    placement="right"
                    content={popoverContent(smartTool)}
                    key={smartTool.key}
                  >
                    <Button
                      className={classNames('slidertoolbar-btn', {
                        'slidertoolbar-btn-active': isAIAnnotationActive,
                      })}
                      icon={item.aiIcon}
                      onClick={() =>
                        onActiveAIAnnotation(!isAIAnnotationActive)
                      }
                    />
                  </Popover>
                )}
              </div>
            ))}
            <div className="slidertoolbar-divider"></div>
            {actionTools.map((item) => (
              <Popover
                placement="right"
                content={popoverContent(item)}
                key={item.key}
              >
                <Button
                  className={classNames('slidertoolbar-btn')}
                  icon={item.icon}
                  onClick={item.handler}
                />
              </Popover>
            ))}
          </div>
        ) : (
          <div />
        )}
        <div className="dds-annotator-slidertoolbar-content">
          <Button
            type="primary"
            className="slidertoolbar-btn"
            onClick={onZoomReset}
            icon={<Icon component={ZoomResize} />}
          />
          <Button
            type="primary"
            className={classNames('slidertoolbar-btn', {
              'slidertoolbar-btn-disabled': disabledZoomOut,
            })}
            icon={<ZoomOutOutlined />}
            onClick={onZoomOut}
          />
          <div className="slidertoolbar-scale-text">
            {Math.floor(scale * 100)}%
          </div>
          <Button
            type="primary"
            className={classNames('slidertoolbar-btn', {
              'slidertoolbar-btn-disabled': disabledZoomIn,
            })}
            icon={<ZoomInOutlined />}
            onClick={onZoomIn}
          />
        </div>
      </div>
    );
  },
);

export default SliderToolBar;
