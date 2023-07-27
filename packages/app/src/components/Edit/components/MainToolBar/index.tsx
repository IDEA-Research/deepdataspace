import styles from './index.less';
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
} from '@/constants';
import { FloatWrapper } from '@/components/FloatWrapper';
import { ReactComponent as DragToolIcon } from '@/assets/svg/drag.svg';
import { useKeyPress } from 'ahooks';
import {
  EDITOR_SHORTCUTS,
  EShortcuts,
  TShortcutItem,
} from '../../constants/shortcuts';
import { useMemo } from 'react';
import { getIconFromShortcut } from '../ShortcutsInfo';
import { useLocale } from '@/locales/helper';

type TToolItem<T> = {
  key: T;
  name: string;
  shortcut: TShortcutItem;
  icon: JSX.Element;
  description?: string;
};

interface IProps {
  isSeperate: boolean;
  selectedTool: EToolType;
  isAIAnnotationActive: boolean;
  onChangeSelectedTool: (type: EToolType) => void;
  onActiveAIAnnotation: (active: boolean) => void;
  undo: () => void;
  redo: () => void;
  deleteAll: () => void;
}

export const MainToolBar: React.FC<IProps> = ({
  isSeperate,
  selectedTool,
  isAIAnnotationActive,
  onChangeSelectedTool,
  onActiveAIAnnotation,
  undo,
  redo,
  deleteAll,
}) => {
  const { localeText } = useLocale();

  const basicTools: TToolItem<EBasicToolItem>[] = [
    {
      key: EBasicToolItem.Drag,
      name: localeText('editor.toolbar.drag'),
      shortcut: EDITOR_SHORTCUTS[EShortcuts.DragTool],
      icon: <Icon component={DragToolIcon} />,
      description: localeText('editor.toolbar.drag.desc'),
    },
    {
      key: EBasicToolItem.Rectangle,
      name: localeText('editor.toolbar.rectangle'),
      shortcut: EDITOR_SHORTCUTS[EShortcuts.RectangleTool],
      icon: <Icon component={OBJECT_ICON[EObjectType.Rectangle]} />,
      description: localeText('editor.toolbar.rectangle.desc'),
    },
    {
      key: EBasicToolItem.Polygon,
      name: localeText('editor.toolbar.polygon'),
      shortcut: EDITOR_SHORTCUTS[EShortcuts.PolygonTool],
      icon: <Icon component={OBJECT_ICON[EObjectType.Polygon]} />,
      description: localeText('editor.toolbar.polygon.desc'),
    },
    {
      key: EBasicToolItem.Skeleton,
      name: localeText('editor.toolbar.skeleton'),
      shortcut: EDITOR_SHORTCUTS[EShortcuts.SkeletonTool],
      icon: <Icon component={OBJECT_ICON[EObjectType.Skeleton]} />,
      description: localeText('editor.toolbar.skeleton.desc'),
    },
    ...(!isSeperate
      ? [
          {
            key: EBasicToolItem.Mask,
            name: localeText('editor.toolbar.mask'),
            shortcut: EDITOR_SHORTCUTS[EShortcuts.MaskTool],
            icon: <Icon component={OBJECT_ICON[EObjectType.Mask]} />,
            description: localeText('editor.toolbar.mask.desc'),
          },
        ]
      : []),
  ];

  const smartTools: TToolItem<EActionToolItem>[] = [
    {
      key: EActionToolItem.SmartAnnotation,
      name: localeText('editor.toolbar.aiAnno'),
      shortcut: EDITOR_SHORTCUTS[EShortcuts.SmartAnnotation],
      icon: (
        <Icon component={EDITOR_TOOL_ICON[EActionToolItem.SmartAnnotation]} />
      ),
      description: localeText('editor.toolbar.aiAnno.desc'),
    },
  ];

  const actionTools = [
    {
      key: EActionToolItem.Undo,
      name: localeText('editor.toolbar.undo'),
      icon: <Icon component={EDITOR_TOOL_ICON[EActionToolItem.Undo]} />,
      shortcut: EDITOR_SHORTCUTS[EShortcuts.Undo],
      handler: undo,
      description: localeText('editor.toolbar.undo.desc'),
    },
    {
      key: EActionToolItem.Redo,
      name: localeText('editor.toolbar.redo'),
      icon: <Icon component={EDITOR_TOOL_ICON[EActionToolItem.Redo]} />,
      shortcut: EDITOR_SHORTCUTS[EShortcuts.Redo],
      handler: redo,
      description: localeText('editor.toolbar.redo.desc'),
    },
    {
      key: EActionToolItem.DeleteAll,
      name: localeText('editor.toolbar.deleteAll'),
      icon: <Icon component={EDITOR_TOOL_ICON[EActionToolItem.DeleteAll]} />,
      shortcut: EDITOR_SHORTCUTS[EShortcuts.DeleteAll],
      handler: deleteAll,
      description: localeText('editor.toolbar.deleteAll.desc'),
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
    const icon = getIconFromShortcut(item.shortcut.shortcut);
    return (
      <div className={styles['popover-container']}>
        <div>
          <span className={styles.title}>{item.name}</span>
          <span className={styles.key}>{icon}</span>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.description}>{item.description}</div>
      </div>
    );
  };

  return (
    <FloatWrapper>
      <div className={styles.container}>
        {basicTools.map((item) => (
          <Popover
            placement="right"
            content={popoverContent(item)}
            key={item.key}
          >
            <Button
              className={classNames(styles.btn, {
                [styles.btnActive]: selectedTool === item.key,
              })}
              icon={item.icon}
              onClick={() => onChangeSelectedTool(item.key)}
            />
          </Popover>
        ))}
        <div className={styles.divider}></div>
        {smartTools.map((item) => (
          <Popover
            placement="right"
            content={popoverContent(item)}
            key={item.key}
          >
            <Button
              className={classNames(styles.btn, {
                [styles.btnActive]: isAIAnnotationActive,
              })}
              icon={item.icon}
              onClick={() => onActiveAIAnnotation(!isAIAnnotationActive)}
            />
          </Popover>
        ))}
        <div className={styles.divider}></div>
        {actionTools.map((item) => (
          <Popover
            placement="right"
            content={popoverContent(item)}
            key={item.key}
          >
            <Button
              className={classNames(styles.btn)}
              icon={item.icon}
              onClick={item.handler}
            />
          </Popover>
        ))}
      </div>
    </FloatWrapper>
  );
};
