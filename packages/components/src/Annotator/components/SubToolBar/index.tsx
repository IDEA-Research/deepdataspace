import { useKeyPress } from 'ahooks';
import { Button, Popover, Slider } from 'antd';
import classNames from 'classnames';
import { memo, useMemo } from 'react';

import { ESubToolItem } from '../../constants';
import { FloatWrapper } from '../FloatWrapper';

import { TSubtoolOptions, TToolItem } from '@/Annotator/hooks/useSubtools';

import './index.less';

interface IProps {
  toolOptions: TSubtoolOptions;
  selectedSubTool: ESubToolItem;
  isAIAnnotationActive: boolean;
  brushSize: number;
  onChangeSubTool: (type: ESubToolItem) => void;
  onActiveAIAnnotation: (active: boolean) => void;
  onChangeBrushSize: (size: number) => void;
}

const SubToolBar: React.FC<IProps> = memo(
  ({
    toolOptions,
    selectedSubTool,
    isAIAnnotationActive,
    brushSize,
    onChangeSubTool,
    onChangeBrushSize,
  }) => {
    const allSubTools = useMemo(() => {
      return [...toolOptions.basicTools, ...toolOptions.smartTools];
    }, [toolOptions.basicTools, toolOptions.smartTools]);

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
            toolOptions.smartTools.find((item) => tool.key === item.key) &&
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
      const tool = allSubTools.find((item) => item.key === selectedSubTool);
      if (
        event.type === 'mouseup' &&
        (tool?.withSize || tool?.withCustomElement)
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
          {toolOptions.basicTools.map((item) => ToolItemBtn(item))}
          {isAIAnnotationActive && (
            <>
              {toolOptions.basicTools.length > 0 &&
                toolOptions.smartTools.length > 0 && (
                  <div className="dds-annotator-subtoolbar-divider"></div>
                )}
              {toolOptions.smartTools.map((item) => ToolItemBtn(item))}
            </>
          )}
          {toolOptions.customElement && (
            <>
              <div className="dds-annotator-subtoolbar-divider"></div>
              {toolOptions.customElement}
            </>
          )}
          {!!allSubTools.find((item) => item.key === selectedSubTool)
            ?.withSize && (
            <>
              <div className="dds-annotator-subtoolbar-divider"></div>
              <div className="dds-annotator-subtoolbar-title">
                {'Brush Size'}
              </div>
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

export default SubToolBar;
