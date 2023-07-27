import styles from './index.less';
import { Button, Popover, Slider } from 'antd';
import Icon, { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { MAX_SCALE, MIN_SCALE } from '@/constants';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from '@/locales/helper';
import { FloatWrapper } from '@/components/FloatWrapper';
import { ReactComponent as ImgSetting } from '@/assets/svg/imgSetting.svg';
import { ReactComponent as DisplayReset } from '@/assets/svg/displayReset.svg';
import { ReactComponent as ZoomResize } from '@/assets/svg/zoomResize.svg';

interface IProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  displayOption: {
    brightness: number;
    contrast: number;
    saturate: number;
  };
  setBrightness: (brightness: number) => void;
  setContrast: (contrast: number) => void;
  setSaturate: (saturate: number) => void;
  resetOptions: () => void;
}

export const ScaleToolBar: React.FC<IProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  displayOption,
  setBrightness,
  setContrast,
  setSaturate,
  resetOptions,
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

  const popoverContent = () => {
    return (
      <div className={styles.popContainer}>
        <div className={styles.popHeader}>
          <div>{localeText('editor.imgDisplayTool.title')}</div>
          <Button
            type="primary"
            className={classNames(styles.btn)}
            icon={<Icon component={DisplayReset} />}
            onClick={resetOptions}
          ></Button>
        </div>
        <div className={styles.option}>
          <label>{localeText('editor.imgDisplayTool.brightness')}</label>
          <Slider
            value={displayOption.brightness}
            onChange={setBrightness}
            min={0}
            max={150}
          />
        </div>
        <div className={styles.option}>
          <label>{localeText('editor.imgDisplayTool.contrast')}</label>
          <Slider
            value={displayOption.contrast}
            onChange={setContrast}
            min={0}
            max={100}
          />
        </div>
        <div className={styles.option}>
          <label>{localeText('editor.imgDisplayTool.saturate')}</label>
          <Slider
            value={displayOption.saturate}
            onChange={setSaturate}
            min={0}
            max={100}
          />
        </div>
      </div>
    );
  };

  const mouseEventHandler = (event: React.MouseEvent) => {
    // enable mouseup propagate only for sliders
    if (event.type === 'mouseup') {
      return;
    } else {
      event.stopPropagation();
    }
  };

  return (
    <FloatWrapper eventHandler={mouseEventHandler}>
      <div className={styles.toolBar}>
        <Button
          type="primary"
          className={classNames(styles.btn, {
            [styles.btnDisabled]: disabledZoomOut,
          })}
          icon={<ZoomOutOutlined />}
          onClick={onZoomOut}
        />
        <div className={styles.scaleText}>{Math.floor(scale * 100)}%</div>
        <Button
          type="primary"
          className={classNames(styles.btn, {
            [styles.btnDisabled]: disabledZoomIn,
          })}
          icon={<ZoomInOutlined />}
          onClick={onZoomIn}
        />
        <Button
          type="primary"
          className={classNames(styles.btn)}
          onClick={onReset}
          icon={<Icon component={ZoomResize} />}
        ></Button>
        <div className={styles.divider}></div>
        <Popover
          placement="top"
          content={popoverContent()}
          trigger="click"
          overlayClassName={styles.popOverWrap}
          color={'#212121'}
        >
          <Button
            type="primary"
            className={classNames(styles.btn)}
            icon={<Icon component={ImgSetting} />}
          ></Button>
        </Popover>
      </div>
    </FloatWrapper>
  );
};
