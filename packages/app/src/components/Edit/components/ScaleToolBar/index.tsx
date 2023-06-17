import styles from './index.less';
import { Button } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { MAX_SCALE, MIN_SCALE } from '@/constants';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from '@/locales/helper';
import { FloatWrapper } from '@/components/FloatWrapper';

interface IProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ScaleToolBar: React.FC<IProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
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

  return (
    <FloatWrapper>
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
        <div className={styles.divider}></div>
        <Button
          type="primary"
          className={classNames(styles.resetBtn)}
          onClick={onReset}
        >
          {localeText('editor.zoomTool.reset')}
        </Button>
      </div>
    </FloatWrapper>
  );
};
