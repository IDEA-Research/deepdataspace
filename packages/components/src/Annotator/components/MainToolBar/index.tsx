import { Button, Popover } from 'antd';
import Icon from '@ant-design/icons';
import classNames from 'classnames';
import {
  EBasicToolItem,
  EObjectType,
  EActionToolItem,
  EToolType,
  OBJECT_ICON,
  EDITOR_TOOL_ICON,
} from '../../constants';
import { FloatWrapper } from '../FloatWrapper';
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
import './index.less';

type TToolItem<T> = {
  key: T;
  name: string;
  shortcut: TShortcutItem;
  icon: JSX.Element;
  description?: string;
};

interface IProps {
  selectedTool: EToolType;
  isAIAnnotationActive: boolean;
  onChangeSelectedTool: (type: EToolType) => void;
  onActiveAIAnnotation: (active: boolean) => void;
  undo: () => void;
  redo: () => void;
  repeatPrevious: () => void;
  deleteAll: () => void;
}

export const MainToolBar: React.FC<IProps> = memo(
  ({
    selectedTool,
    isAIAnnotationActive,
    onChangeSelectedTool,
    onActiveAIAnnotation,
    undo,
    redo,
    repeatPrevious,
    deleteAll,
  }) => {
    const { localeText } = useLocale();

    const basicTools: TToolItem<EBasicToolItem>[] = [
      {
        key: EBasicToolItem.Drag,
        name: localeText('DDSAnnotator.toolbar.drag'),
        shortcut: EDITOR_SHORTCUTS[EShortcuts.DragTool],
        icon: <Icon component={DragToolIcon} />,
        description: localeText('DDSAnnotator.toolbar.drag.desc'),
      },
      {
        key: EBasicToolItem.Rectangle,
        name: localeText('DDSAnnotator.toolbar.rectangle'),
        shortcut: EDITOR_SHORTCUTS[EShortcuts.RectangleTool],
        icon: <Icon component={OBJECT_ICON[EObjectType.Rectangle]} />,
        description: localeText('DDSAnnotator.toolbar.rectangle.desc'),
      },
      {
        key: EBasicToolItem.Polygon,
        name: localeText('DDSAnnotator.toolbar.polygon'),
        shortcut: EDITOR_SHORTCUTS[EShortcuts.PolygonTool],
        icon: <Icon component={OBJECT_ICON[EObjectType.Polygon]} />,
        description: localeText('DDSAnnotator.toolbar.polygon.desc'),
      },
      {
        key: EBasicToolItem.Skeleton,
        name: localeText('DDSAnnotator.toolbar.skeleton'),
        shortcut: EDITOR_SHORTCUTS[EShortcuts.SkeletonTool],
        icon: <Icon component={OBJECT_ICON[EObjectType.Skeleton]} />,
        description: localeText('DDSAnnotator.toolbar.skeleton.desc'),
      },
      {
        key: EBasicToolItem.Mask,
        name: localeText('DDSAnnotator.toolbar.mask'),
        shortcut: EDITOR_SHORTCUTS[EShortcuts.MaskTool],
        icon: <Icon component={OBJECT_ICON[EObjectType.Mask]} />,
        description: localeText('DDSAnnotator.toolbar.mask.desc'),
      },
    ];

    const smartTools: TToolItem<EActionToolItem>[] = [
      {
        key: EActionToolItem.SmartAnnotation,
        name: localeText('DDSAnnotator.toolbar.aiAnno'),
        shortcut: EDITOR_SHORTCUTS[EShortcuts.SmartAnnotation],
        icon: (
          <Icon component={EDITOR_TOOL_ICON[EActionToolItem.SmartAnnotation]} />
        ),
        description: localeText('DDSAnnotator.toolbar.aiAnno.desc'),
      },
    ];

    const actionTools = [
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
      {
        key: EActionToolItem.RepeatPrevious,
        name: localeText('DDSAnnotator.toolbar.repeatPrevious'),
        icon: (
          <Icon component={EDITOR_TOOL_ICON[EActionToolItem.RepeatPrevious]} />
        ),
        shortcut: EDITOR_SHORTCUTS[EShortcuts.RepeatPrevious],
        handler: repeatPrevious,
        description: localeText('DDSAnnotator.toolbar.repeatPrevious.desc'),
      },
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
      return basicTools.reduce((keys: string[], tool) => {
        return keys.concat(tool.shortcut.shortcut);
      }, []);
    }, [basicTools]);

    const smartToolKeys: string[] = useMemo(() => {
      return smartTools.reduce((keys: string[], tool) => {
        return keys.concat(tool.shortcut.shortcut);
      }, []);
    }, [actionTools]);

    /** Active Basic Tool */
    useKeyPress(
      basicToolKeys,
      (event) => {
        const activeTool = basicTools.find((tool) => {
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
      smartToolKeys,
      (event) => {
        const smartTool = smartTools.find((tool) => {
          return tool.shortcut.shortcut.includes(event.key);
        });
        if (smartTool) {
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
        repeatPrevious();
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

    const popoverContent = (
      item: TToolItem<EBasicToolItem | EActionToolItem>,
    ) => {
      const icon = getIconFromShortcut(item.shortcut.shortcut, false);
      return (
        <div className="dds-annotator-maintoolbar-popover">
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
      <FloatWrapper>
        <div className="dds-annotator-maintoolbar">
          {basicTools.map((item) => (
            <Popover
              placement="right"
              content={popoverContent(item)}
              key={item.key}
            >
              <Button
                className={classNames('maintoolbar-btn', {
                  'maintoolbar-btn-active': selectedTool === item.key,
                })}
                icon={item.icon}
                onClick={() => onChangeSelectedTool(item.key)}
              />
            </Popover>
          ))}
          <div className="maintoolbar-divider"></div>
          {smartTools.map((item) => (
            <Popover
              placement="right"
              content={popoverContent(item)}
              key={item.key}
            >
              <Button
                className={classNames('maintoolbar-btn', {
                  'maintoolbar-btn-active': isAIAnnotationActive,
                })}
                icon={item.icon}
                onClick={() => onActiveAIAnnotation(!isAIAnnotationActive)}
              />
            </Popover>
          ))}
          <div className="maintoolbar-divider"></div>
          {actionTools.map((item) => (
            <Popover
              placement="right"
              content={popoverContent(item)}
              key={item.key}
            >
              <Button
                className={classNames('maintoolbar-btn')}
                icon={item.icon}
                onClick={item.handler}
              />
            </Popover>
          ))}
        </div>
      </FloatWrapper>
    );
  },
);
