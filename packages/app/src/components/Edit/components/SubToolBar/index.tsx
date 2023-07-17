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
  available: boolean;
};

interface IProps {
  selectedSubTool: ESubToolItem;
  isAIAnnotationActive: boolean;
  isSegEverythingAvailable: boolean;
  brushSize: number;
  onChangeSubTool: (type: ESubToolItem) => void;
  onActiveAIAnnotation: (active: boolean) => void;
  onChangeBrushSize: (size: number) => void;
}

export const SubToolBar: React.FC<IProps> = ({
  selectedSubTool,
  isAIAnnotationActive,
  isSegEverythingAvailable,
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
      available: true,
    },
    {
      key: ESubToolItem.PenErase,
      name: localeText('editor.subtoolbar.mask.penErase'),
      icon: <Icon component={PenEraseIcon} />,
      available: true,
    },
    {
      key: ESubToolItem.BrushAdd,
      name: localeText('editor.subtoolbar.mask.brushAdd'),
      icon: <Icon component={BrushAddIcon} />,
      available: true,
    },
    {
      key: ESubToolItem.BrushErase,
      name: localeText('editor.subtoolbar.mask.brushErase'),
      icon: <Icon component={BrushEraseIcon} />,
      available: true,
    },
  ];

  const smartMaskTools: TToolItem<ESubToolItem>[] = useMemo(() => {
    return [
      {
        key: ESubToolItem.AutoSegmentByBox,
        name: localeText('editor.subtoolbar.mask.box'),
        icon: <Icon component={DashBoxIcon} />,
        available: true,
      },
      {
        key: ESubToolItem.AutoSegmentByStroke,
        name: localeText('editor.subtoolbar.mask.stroke'),
        icon: <Icon component={StrokeIcon} />,
        available: true,
      },
      {
        key: ESubToolItem.AutoSegmentByClick,
        name: localeText('editor.subtoolbar.mask.click'),
        icon: <Icon component={ClickIcon} />,
        available: true,
      },
      {
        key: ESubToolItem.AutoEdgeStitching,
        name: localeText('editor.subtoolbar.mask.edgeStitch'),
        icon: <Icon component={MagicBrushIcon} />,
        available: true,
      },
      {
        key: ESubToolItem.AutoSegmentEverything,
        name: localeText('editor.subtoolbar.mask.sam'),
        icon: <Icon component={MagicIcon} />,
        available: isSegEverythingAvailable,
        description: isSegEverythingAvailable
          ? localeText('editor.subtoolbar.mask.sam.desc')
          : localeText('editor.subtoolbar.mask.sam.notAllow'),
      },
    ];
  }, [isSegEverythingAvailable]);

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
      if (tool && tool.available) {
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
        <div>
          <span className={styles.title}>{item.name}</span>
          {shortcut && <span className={styles.key}>{shortcut}</span>}
        </div>
        {item.description && (
          <>
            <div className={styles.divider}></div>
            <div className={styles.description}>{item.description}</div>
          </>
        )}
      </div>
    );
  };

  const onBtnClick = (type: ESubToolItem) => {
    const tool = allSubTools.find((item) => item.key === type);
    if (tool && tool.available) {
      onChangeSubTool(type);
    }
  };

  const ToolItemBtn = (item: TToolItem<ESubToolItem>) => {
    return (
      <Popover placement="bottom" content={popoverContent(item)} key={item.key}>
        <Button
          className={classNames(styles.btn, {
            [styles.btnActive]: selectedSubTool === item.key && item.available,
            [styles.btnLimited]: item.available,
          })}
          style={{ cursor: item.available ? 'pointer' : 'not-allowed' }}
          icon={item.icon}
          onClick={() => onBtnClick(item.key)}
        />
      </Popover>
    );
  };

  return (
    <FloatWrapper eventHandler={mouseEventHandler}>
      <div className={styles.container}>
        {basicMaskTools.map((item) => ToolItemBtn(item))}
        {isAIAnnotationActive && (
          <>
            <div className={styles.divider}></div>
            {smartMaskTools.map((item) => ToolItemBtn(item))}
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
