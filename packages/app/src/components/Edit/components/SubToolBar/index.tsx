import styles from './index.less';
import { Button, Popover } from 'antd';
import Icon from '@ant-design/icons';
import classNames from 'classnames';
import { ESubToolItem } from '@/constants';
import { FloatWrapper } from '@/components/FloatWrapper';
import { TShortcutItem } from '../../constants/shortcuts';
import { ReactComponent as PenAddIcon } from '@/assets/svg/pen-add.svg';
import { ReactComponent as PenEraseIcon } from '@/assets/svg/pen-erase.svg';
import { ReactComponent as BrushAddIcon } from '@/assets/svg/brush-add.svg';
import { ReactComponent as BrushEraseIcon } from '@/assets/svg/brush-erase.svg';
import { getIconFromShortcut } from '../ShortcutsInfo';

type TToolItem<T> = {
  key: T;
  name: string;
  shortcut?: TShortcutItem;
  icon: JSX.Element;
  description?: string;
};

interface IProps {
  selectedSubTool: ESubToolItem;
  isAIAnnotationActive: boolean;
  onChangeSubTool: (type: ESubToolItem) => void;
  onActiveAIAnnotation: (active: boolean) => void;
  // onFinish: () => void;
}

export const SubToolBar: React.FC<IProps> = ({
  selectedSubTool,
  onChangeSubTool,
  // onFinish,
}) => {
  const MaskTools: TToolItem<ESubToolItem>[] = [
    {
      key: ESubToolItem.PenAdd,
      name: 'Pen Add',
      icon: <Icon component={PenAddIcon} />,
      // shortcut: EDITOR_SHORTCUTS[EShortcuts.Undo],
    },
    {
      key: ESubToolItem.PenErase,
      name: 'Pen Erase',
      icon: <Icon component={PenEraseIcon} />,
      // shortcut: EDITOR_SHORTCUTS[EShortcuts.Undo],
    },
    {
      key: ESubToolItem.BrushAdd,
      name: 'Brush Add',
      icon: <Icon component={BrushAddIcon} />,
      // shortcut: EDITOR_SHORTCUTS[EShortcuts.Undo],
    },
    {
      key: ESubToolItem.BrushErase,
      name: 'Brush Erase',
      icon: <Icon component={BrushEraseIcon} />,
      // shortcut: EDITOR_SHORTCUTS[EShortcuts.Undo],
    },
  ];

  const popoverContent = (item: TToolItem<ESubToolItem>) => {
    return (
      <div className={styles['popover-container']}>
        <span className={styles.title}>{item.name}</span>
        {item.shortcut && (
          <span className={styles.key}>
            {getIconFromShortcut(item.shortcut.shortcut)}
          </span>
        )}
      </div>
    );
  };

  return (
    <FloatWrapper>
      <div className={styles.container}>
        {MaskTools.map((item) => (
          <Popover
            placement="bottom"
            content={popoverContent(item)}
            key={item.key}
          >
            <Button
              className={classNames(styles.btn, {
                [styles.btnActive]: selectedSubTool === item.key,
              })}
              icon={item.icon}
              onClick={() => onChangeSubTool(item.key)}
            />
          </Popover>
        ))}
        {[ESubToolItem.BrushAdd, ESubToolItem.BrushErase].includes(
          selectedSubTool,
        ) && <>{/* <Slider min={1} max={30}/> */}</>}
        {/* <div className={styles.divider}></div>
        <Button
          type="primary"
          className={classNames(styles.action)}
          onClick={(event) => {
            event.preventDefault();
            onFinish();
          }}
        >
          {localeText('editor.annotsEditor.finish')}
        </Button> */}
      </div>
    </FloatWrapper>
  );
};
