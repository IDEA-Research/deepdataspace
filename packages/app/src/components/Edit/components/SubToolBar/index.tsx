import styles from './index.less';
import { Button, Popover, Slider } from 'antd';
import Icon from '@ant-design/icons';
import classNames from 'classnames';
import { ESubToolItem } from '@/constants';
import { FloatWrapper } from '@/components/FloatWrapper';
import { TShortcutItem } from '../../constants/shortcuts';
import { ReactComponent as PenAddIcon } from '@/assets/svg/pen-add.svg';
import { ReactComponent as PenEraseIcon } from '@/assets/svg/pen-erase.svg';
import { ReactComponent as BrushAddIcon } from '@/assets/svg/brush-add.svg';
import { ReactComponent as BrushEraseIcon } from '@/assets/svg/brush-erase.svg';
import { ReactComponent as DashBoxIcon } from '@/assets/svg/dash-box.svg';
import { ReactComponent as ClickIcon } from '@/assets/svg/click.svg';
import { ReactComponent as StarStickIcon } from '@/assets/svg/star-stick.svg';
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
  brushSize: number;
  onChangeSubTool: (type: ESubToolItem) => void;
  onActiveAIAnnotation: (active: boolean) => void;
  onChangeBrushSize: (size: number) => void;
  // onFinish: () => void;
}

export const SubToolBar: React.FC<IProps> = ({
  selectedSubTool,
  isAIAnnotationActive,
  onChangeSubTool,
  onChangeBrushSize,
  brushSize,
  // onFinish,
}) => {
  const BasicMaskTools: TToolItem<ESubToolItem>[] = [
    {
      key: ESubToolItem.PenAdd,
      name: 'Pen Add',
      icon: <Icon component={PenAddIcon} />,
    },
    {
      key: ESubToolItem.PenErase,
      name: 'Pen Erase',
      icon: <Icon component={PenEraseIcon} />,
    },
    {
      key: ESubToolItem.BrushAdd,
      name: 'Brush Add',
      icon: <Icon component={BrushAddIcon} />,
    },
    {
      key: ESubToolItem.BrushErase,
      name: 'Brush Erase',
      icon: <Icon component={BrushEraseIcon} />,
    },
  ];

  const SmartMaskTools: TToolItem<ESubToolItem>[] = [
    {
      key: ESubToolItem.AutoSegmentByBox,
      name: 'Segment By Box',
      icon: <Icon component={DashBoxIcon} />,
    },
    {
      key: ESubToolItem.AutoSegmentByClick,
      name: 'Segment By Click',
      icon: <Icon component={ClickIcon} />,
    },
    {
      key: ESubToolItem.AutoSegmentAnything,
      name: 'Segment Anything',
      icon: <Icon component={StarStickIcon} />,
    },
    {
      key: ESubToolItem.AutoEdgeStitching,
      name: 'Edge Stitching Brush',
      icon: <Icon component={PenAddIcon} />,
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

  const mouseEventHandler = (event: React.MouseEvent) => {
    // enable mouseup propagate only for brush
    if (
      [ESubToolItem.BrushAdd, ESubToolItem.BrushErase].includes(
        selectedSubTool,
      ) &&
      event.type === 'mouseup'
    ) {
      return;
    } else {
      event.stopPropagation();
    }
  };

  return (
    <FloatWrapper eventHandler={mouseEventHandler}>
      <div className={styles.container}>
        {BasicMaskTools.map((item) => (
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
        {isAIAnnotationActive && (
          <>
            <div className={styles.divider}></div>
            {SmartMaskTools.map((item) => (
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
          </>
        )}
        {[ESubToolItem.BrushAdd, ESubToolItem.BrushErase].includes(
          selectedSubTool,
        ) && (
          <>
            <div className={styles.divider}></div>
            <div className={styles.slider}>
              <Slider
                defaultValue={20}
                min={1}
                max={200}
                value={brushSize}
                onChange={(value) => onChangeBrushSize(value)}
              />
            </div>
          </>
        )}
        {/* <Button
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
