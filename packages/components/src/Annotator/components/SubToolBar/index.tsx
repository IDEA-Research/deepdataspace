import { Button, Popover, Slider } from 'antd';
import Icon from '@ant-design/icons';
import classNames from 'classnames';
import { ESubToolItem } from '../../constants';
import { FloatWrapper } from '../FloatWrapper';
import { TShortcutItem } from '../../constants/shortcuts';
import { ReactComponent as PenAddIcon } from '../../assets/pen-add.svg';
import { ReactComponent as PenEraseIcon } from '../../assets/pen-erase.svg';
import { ReactComponent as BrushAddIcon } from '../../assets/brush-add.svg';
import { ReactComponent as BrushEraseIcon } from '../../assets/brush-erase.svg';
import { ReactComponent as MagicBoxIcon } from '../../assets/magic-box.svg';
import { ReactComponent as ClickIcon } from '../../assets/magic-click.svg';
import { ReactComponent as EdgeStitchIcon } from '../../assets/edge-stitch.svg';
import { ReactComponent as SegmentEverythingIcon } from '../../assets/segment-everything.svg';
import { ReactComponent as StrokeIcon } from '../../assets/magic-brush.svg';
import { useLocale } from 'dds-utils/locale';
import { memo, useMemo } from 'react';
import { useKeyPress } from 'ahooks';
import './index.less';

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
  isManualAvailable: boolean;
  brushSize: number;
  onChangeSubTool: (type: ESubToolItem) => void;
  onActiveAIAnnotation: (active: boolean) => void;
  onChangeBrushSize: (size: number) => void;
}

export const SubToolBar: React.FC<IProps> = memo(
  ({
    selectedSubTool,
    isAIAnnotationActive,
    isSegEverythingAvailable,
    isManualAvailable,
    brushSize,
    onChangeSubTool,
    onChangeBrushSize,
  }) => {
    const { localeText } = useLocale();

    const basicMaskTools: TToolItem<ESubToolItem>[] = [
      {
        key: ESubToolItem.PenAdd,
        name: localeText('DDSAnnotator.subtoolbar.mask.penAdd'),
        icon: <Icon component={PenAddIcon} />,
        available: isManualAvailable,
      },
      {
        key: ESubToolItem.PenErase,
        name: localeText('DDSAnnotator.subtoolbar.mask.penErase'),
        icon: <Icon component={PenEraseIcon} />,
        available: isManualAvailable,
      },
      {
        key: ESubToolItem.BrushAdd,
        name: localeText('DDSAnnotator.subtoolbar.mask.brushAdd'),
        icon: <Icon component={BrushAddIcon} />,
        available: isManualAvailable,
      },
      {
        key: ESubToolItem.BrushErase,
        name: localeText('DDSAnnotator.subtoolbar.mask.brushErase'),
        icon: <Icon component={BrushEraseIcon} />,
        available: isManualAvailable,
      },
    ];

    const smartMaskTools: TToolItem<ESubToolItem>[] = useMemo(() => {
      return [
        {
          key: ESubToolItem.AutoSegmentByBox,
          name: localeText('DDSAnnotator.subtoolbar.mask.box'),
          icon: <Icon component={MagicBoxIcon} />,
          available: true,
        },
        {
          key: ESubToolItem.AutoSegmentByStroke,
          name: localeText('DDSAnnotator.subtoolbar.mask.stroke'),
          icon: <Icon component={StrokeIcon} />,
          available: true,
        },
        {
          key: ESubToolItem.AutoSegmentByClick,
          name: localeText('DDSAnnotator.subtoolbar.mask.click'),
          icon: <Icon component={ClickIcon} />,
          available: true,
        },
        {
          key: ESubToolItem.AutoEdgeStitching,
          name: localeText('DDSAnnotator.subtoolbar.mask.edgeStitch'),
          icon: <Icon component={EdgeStitchIcon} />,
          available: true,
        },
        {
          key: ESubToolItem.AutoSegmentEverything,
          name: localeText('DDSAnnotator.subtoolbar.mask.sam'),
          icon: <Icon component={SegmentEverythingIcon} />,
          available: isSegEverythingAvailable,
          description: isSegEverythingAvailable
            ? localeText('DDSAnnotator.subtoolbar.mask.sam.desc')
            : localeText('DDSAnnotator.subtoolbar.mask.sam.notAllow'),
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
      const shortcut =
        allSubTools.findIndex((tool) => tool.key === item.key) + 1;
      return (
        <div className="dds-annotator-subtoolbar-popover">
          <div>
            <span className="dds-annotator-subtoolbar-popover-title">
              {item.name}
            </span>
            {shortcut && (
              <span className="dds-annotator-subtoolbar-popover-key">
                {shortcut}
              </span>
            )}
          </div>
          {item.description && (
            <>
              <div className="dds-annotator-subtoolbar-popover-divider"></div>
              <div>{item.description}</div>
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
        <Popover
          placement="bottom"
          content={popoverContent(item)}
          key={item.key}
        >
          <Button
            className={classNames('dds-annotator-subtoolbar-btn', {
              'dds-annotator-subtoolbar-btn-active':
                selectedSubTool === item.key && item.available,
              'dds-annotator-subtoolbar-btn-limited': item.available,
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
        <div className="dds-annotator-subtoolbar">
          {basicMaskTools.map((item) => ToolItemBtn(item))}
          {isAIAnnotationActive && (
            <>
              <div className="dds-annotator-subtoolbar-divider"></div>
              {smartMaskTools.map((item) => ToolItemBtn(item))}
            </>
          )}
          {toolsWithBrushSize.includes(selectedSubTool) && (
            <>
              <div className="dds-annotator-subtoolbar-divider"></div>
              <div className="dds-annotator-subtoolbar-slider">
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
        </div>
      </FloatWrapper>
    );
  },
);
