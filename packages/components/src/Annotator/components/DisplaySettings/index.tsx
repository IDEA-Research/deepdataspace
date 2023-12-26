import { Button, Popover, Slider, Tooltip } from 'antd';
import Icon from '@ant-design/icons';
import { useLocale } from 'dds-utils/locale';
import { ReactComponent as SettingIcon } from '../../assets/settings-sliders.svg';
import { ReactComponent as DisplayReset } from '../../assets/displayReset.svg';
import { memo, useMemo } from 'react';
import {
  DEFAULT_IMG_DISPLAY_OPTIONS,
  IAnnotsDisplayOptions,
  IImageDisplayOptions,
} from '../../type';
import './index.less';

interface IProps {
  displayOption: IImageDisplayOptions;
  colorByCategory: boolean;
  onChangeImageDisplayOpts: (options: IImageDisplayOptions) => void;
  onChangeAnnotsDisplayOpts: (options: IAnnotsDisplayOptions) => void;
}

const DisplaySettings: React.FC<IProps> = memo(
  ({ displayOption, onChangeImageDisplayOpts, onChangeAnnotsDisplayOpts }) => {
    const { localeText } = useLocale();

    const popoverContent = useMemo(() => {
      return (
        <div className="dds-annotator-display-pop-container">
          <div className="dds-annotator-display-pop-container-header">
            <div>{localeText('DDSAnnotator.imgDisplayTool.title')}</div>
            <Button
              type="primary"
              className="dds-annotator-display-pop-container-btn"
              icon={<Icon component={DisplayReset} />}
              onClick={() =>
                onChangeImageDisplayOpts(DEFAULT_IMG_DISPLAY_OPTIONS)
              }
            ></Button>
          </div>
          <div className="dds-annotator-display-pop-container-option">
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
          <div className="dds-annotator-display-pop-container-option">
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
          <div className="dds-annotator-display-pop-container-option">
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

    return (
      <Popover
        placement="top"
        content={popoverContent}
        trigger="click"
        overlayClassName="dds-annotator-display-popover"
        color={'#212121'}
      >
        <Tooltip title={localeText('DDSAnnotator.imgDisplayTool.title')}>
          <Icon component={SettingIcon} className="dds-annotator-display" />
        </Tooltip>
      </Popover>
    );
  },
);

export default DisplaySettings;
