import styles from './index.less';
import { Button, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { EditImageData } from '../../type';
import { useState } from 'react';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from '@/locales/helper';
interface IProps {
  list: EditImageData[];
  current: number;
  total: number;
  customText?: React.ReactElement;
  customDisableNext?: boolean;
  onPrev?: () => Promise<void>;
  onNext?: () => Promise<void>;
}

export const TopPagination: React.FC<IProps> = ({
  current,
  total,
  customText,
  customDisableNext,
  onPrev = () => Promise.resolve(),
  onNext = () => Promise.resolve(),
}) => {
  const { localeText } = useLocale();

  const [loadingPred, setLoadingPred] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);

  const clickPrev = async () => {
    setLoadingPred(true);
    await onPrev();
    setLoadingPred(false);
  };

  const clickNext = async () => {
    setLoadingNext(true);
    await onNext();
    setLoadingNext(false);
  };

  const disablePrev = current <= 0;
  const disableNext = customDisableNext ?? current >= total - 1;

  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.PreviousImage].shortcut,
    () => {
      if (disablePrev) return;
      clickPrev();
    },
    {
      exactMatch: true,
    },
  );

  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.NextImage].shortcut,
    () => {
      if (disableNext) return;
      clickNext();
    },
    {
      exactMatch: true,
    },
  );

  return (
    <div className={styles.toolBar}>
      <Tooltip title={localeText('editor.prev')}>
        <Button
          className={classNames(styles.btn, {
            [styles.btnDisabled]: disablePrev,
          })}
          type="primary"
          icon={<LeftOutlined />}
          loading={loadingPred}
          onClick={clickPrev}
        />
      </Tooltip>
      {customText ? (
        customText
      ) : (
        <div className={styles.scaleText}>
          {current + 1} / {total}
        </div>
      )}
      <Tooltip title={localeText('editor.next')}>
        <Button
          className={classNames(styles.btn, {
            [styles.btnDisabled]: disableNext,
          })}
          type="primary"
          icon={<RightOutlined />}
          loading={loadingNext}
          onClick={clickNext}
        />
      </Tooltip>
    </div>
  );
};
