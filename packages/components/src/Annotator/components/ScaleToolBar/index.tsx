import { Button, Popover, Slider } from 'antd';
import Icon, { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useKeyPress } from 'ahooks';
import { MAX_SCALE, MIN_SCALE } from '../../constants';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from 'dds-utils/locale';
import { FloatWrapper } from '../FloatWrapper';
import { ReactComponent as ImgSetting } from '../../assets/imgSetting.svg';
import { ReactComponent as Palette } from '../../assets/palette.svg';
import { ReactComponent as DisplayReset } from '../../assets/displayReset.svg';
import { ReactComponent as ZoomResize } from '../../assets/zoomResize.svg';
import { memo, useMemo } from 'react';
import {
  DEFAULT_IMG_DISPLAY_OPTIONS,
  IAnnotsDisplayOptions,
  IImageDisplayOptions,
} from '../../type';
import './index.less';

interface IProps {
  scale: number;
  displayOption: IImageDisplayOptions;
  colorByCategory: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onChangeImageDisplayOpts: (options: IImageDisplayOptions) => void;
  onChangeAnnotsDisplayOpts: (options: IAnnotsDisplayOptions) => void;
}

export const ScaleToolBar: React.FC<IProps> = memo(
  ({
    scale,
    displayOption,
    colorByCategory,
    onZoomIn,
    onZoomOut,
    onReset,
    onChangeImageDisplayOpts,
    onChangeAnnotsDisplayOpts,
  }) => {
    const { localeText } = useLocale();

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
      onReset();
    });

    const popoverContent = useMemo(() => {
      return (
        <div className="dds-annotator-scaletoolbar-pop-container">
          <div className="dds-annotator-scaletoolbar-pop-container-header">
            <div>{localeText('DDSAnnotator.imgDisplayTool.title')}</div>
            <Button
              type="primary"
              className="dds-annotator-scaletoolbar-pop-container-btn"
              icon={<Icon component={DisplayReset} />}
              onClick={() =>
                onChangeImageDisplayOpts(DEFAULT_IMG_DISPLAY_OPTIONS)
              }
            ></Button>
          </div>
          <div className="dds-annotator-scaletoolbar-pop-container-option">
            <label>
              {localeText('DDSAnnotator.imgDisplayTool.brightness')}
            </label>
            <Slider
              value={displayOption.brightness}
              onChange={(value) =>
                onChangeImageDisplayOpts({
                  ...displayOption,
                  brightness: value,
                })
              }
              min={0}
              max={200}
            />
          </div>
          <div className="dds-annotator-scaletoolbar-pop-container-option">
            <label>{localeText('DDSAnnotator.imgDisplayTool.contrast')}</label>
            <Slider
              value={displayOption.contrast}
              onChange={(value) =>
                onChangeImageDisplayOpts({
                  ...displayOption,
                  contrast: value,
                })
              }
              min={0}
              max={200}
            />
          </div>
          <div className="dds-annotator-scaletoolbar-pop-container-option">
            <label>{localeText('DDSAnnotator.imgDisplayTool.saturate')}</label>
            <Slider
              value={displayOption.saturate}
              onChange={(value) =>
                onChangeImageDisplayOpts({
                  ...displayOption,
                  saturate: value,
                })
              }
              min={0}
              max={200}
            />
          </div>
        </div>
      );
    }, [
      displayOption.brightness,
      displayOption.contrast,
      displayOption.saturate,
      onChangeImageDisplayOpts,
      onChangeAnnotsDisplayOpts,
    ]);

    const mouseEventHandler = (event: React.MouseEvent) => {
      // enable mouseup propagate only for sliders
      if (event.type === 'mouseup') {
        return;
      } else {
        event.stopPropagation();
      }
    };

    const switchColorMode = () => {
      onChangeAnnotsDisplayOpts({
        colorByCategory: !colorByCategory,
      });
    };

    return (
      <FloatWrapper eventHandler={mouseEventHandler}>
        <div className="dds-annotator-scaletoolbar">
          <Button
            type="primary"
            className={classNames('dds-annotator-scaletoolbar-btn', {
              'dds-annotator-scaletoolbar-btn-disabled': disabledZoomOut,
            })}
            icon={<ZoomOutOutlined />}
            onClick={onZoomOut}
          />
          <div className="dds-annotator-scaletoolbar-scale-text">
            {Math.floor(scale * 100)}%
          </div>
          <Button
            type="primary"
            className={classNames('dds-annotator-scaletoolbar-btn', {
              'dds-annotator-scaletoolbar-btn-disabled': disabledZoomIn,
            })}
            icon={<ZoomInOutlined />}
            onClick={onZoomIn}
          />
          <Button
            type="primary"
            className="dds-annotator-scaletoolbar-btn"
            onClick={onReset}
            icon={<Icon component={ZoomResize} />}
          ></Button>
          <Popover
            placement="top"
            content={popoverContent}
            trigger="click"
            overlayClassName="dds-annotator-scaletoolbar-popover"
            color={'#212121'}
          >
            <Button
              type="primary"
              className="dds-annotator-scaletoolbar-btn"
              icon={<Icon component={ImgSetting} />}
            ></Button>
          </Popover>
          <Popover
            placement="top"
            content={
              <span style={{ color: '#fff' }}>
                {localeText('DDSAnnotator.colorMode')}
              </span>
            }
            trigger="hover"
            color={'#212121'}
          >
            <Button
              type="primary"
              className={classNames('dds-annotator-scaletoolbar-btn', {
                'dds-annotator-scaletoolbar-btn-active': !colorByCategory,
              })}
              icon={<Icon component={Palette} />}
              onClick={switchColorMode}
            ></Button>
          </Popover>
        </div>
      </FloatWrapper>
    );
  },
);
