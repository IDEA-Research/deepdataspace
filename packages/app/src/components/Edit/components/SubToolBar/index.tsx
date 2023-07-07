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
import { ReactComponent as MagicBrushIcon } from '@/assets/svg/star-stick.svg';
import { ReactComponent as MagicIcon } from '@/assets/svg/auto-awesome.svg';
import { ReactComponent as StrokeIcon } from '@/assets/svg/signature.svg';
import { useLocale } from '@/locales/helper';
import { useMemo } from 'react';
import { useKeyPress } from 'ahooks';

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
}

export const SubToolBar: React.FC<IProps> = ({
  selectedSubTool,
  isAIAnnotationActive,
  onChangeSubTool,
  onChangeBrushSize,
  brushSize,
}) => {
  const { localeText } = useLocale();

  const basicMaskTools: TToolItem<ESubToolItem>[] = [
    {
      key: ESubToolItem.PenAdd,
      name: localeText('editor.subtoolbar.mask.penAdd'),
      icon: <Icon component={PenAddIcon} />,
    },
    {
      key: ESubToolItem.PenErase,
      name: localeText('editor.subtoolbar.mask.penErase'),
      icon: <Icon component={PenEraseIcon} />,
    },
    {
      key: ESubToolItem.BrushAdd,
      name: localeText('editor.subtoolbar.mask.brushAdd'),
      icon: <Icon component={BrushAddIcon} />,
    },
    {
      key: ESubToolItem.BrushErase,
      name: localeText('editor.subtoolbar.mask.brushErase'),
      icon: <Icon component={BrushEraseIcon} />,
    },
  ];

  const smartMaskTools: TToolItem<ESubToolItem>[] = [
    {
      key: ESubToolItem.AutoSegmentByBox,
      name: localeText('editor.subtoolbar.mask.box'),
      icon: <Icon component={DashBoxIcon} />,
    },
    {
      key: ESubToolItem.AutoSegmentByClick,
      name: localeText('editor.subtoolbar.mask.click'),
      icon: <Icon component={ClickIcon} />,
    },
    {
      key: ESubToolItem.AutoSegmentByStroke,
      name: localeText('editor.subtoolbar.mask.stroke'),
      icon: <Icon component={StrokeIcon} />,
    },
    {
      key: ESubToolItem.AutoSegmentAnything,
      name: localeText('editor.subtoolbar.mask.sam'),
      icon: <Icon component={MagicIcon} />,
    },
    {
      key: ESubToolItem.AutoEdgeStitching,
      name: localeText('editor.subtoolbar.mask.edgeStitch'),
      icon: <Icon component={MagicBrushIcon} />,
    },
  ];

  const toolsWithBrushSize = [
    ESubToolItem.BrushAdd,
    ESubToolItem.BrushErase,
    ESubToolItem.AutoSegmentByStroke,
    ESubToolItem.AutoEdgeStitching,
  ];

  const allSubTools = useMemo(() => {
    return [...basicMaskTools, ...smartMaskTools];
  }, [basicMaskTools, smartMaskTools]);

  const shortcuts = useMemo(() => {
    const keys: string[] = [];
    for (let i = 1; i <= allSubTools.length; i++) {
      keys.push(i.toString());
    }
    return keys;
  }, [allSubTools]);

  useKeyPress(
    shortcuts,
    (event) => {
      const tool = allSubTools.find((_, index) => {
        return (index + 1).toString() === event.key;
      });
      if (tool) {
        if (
          smartMaskTools.find((item) => tool.key === item.key) &&
          !isAIAnnotationActive
        )
          return;
        onChangeSubTool(tool.key);
      }
    },
    {
      exactMatch: true,
    },
  );

  const mouseEventHandler = (event: React.MouseEvent) => {
    // enable mouseup propagate only for brush
    if (
      toolsWithBrushSize.includes(selectedSubTool) &&
      event.type === 'mouseup'
    ) {
      return;
    } else {
      event.stopPropagation();
    }
  };

  const popoverContent = (item: TToolItem<ESubToolItem>) => {
    const shortcut = allSubTools.findIndex((tool) => tool.key === item.key) + 1;
    return (
      <div className={styles['popover-container']}>
        <span className={styles.title}>{item.name}</span>
        {shortcut && <span className={styles.key}>{shortcut}</span>}
      </div>
    );
  };

  return (
    <FloatWrapper eventHandler={mouseEventHandler}>
      <div className={styles.container}>
        {basicMaskTools.map((item) => (
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
            {smartMaskTools.map((item) => (
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
        {toolsWithBrushSize.includes(selectedSubTool) && (
          <>
            <div className={styles.divider}></div>
            <div className={styles.slider}>
              <Slider
                defaultValue={20}
                min={1}
                max={100}
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
