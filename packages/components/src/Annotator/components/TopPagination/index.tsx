import { Button, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { DrawImageData } from '../../type';
import { memo, useState } from 'react';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from '../../constants/shortcuts';
import { useLocale } from 'dds-utils/locale';
import './index.less';

interface IProps {
  list: DrawImageData[];
  current: number;
  total: number;
  customText?: React.ReactElement;
  customDisableNext?: boolean;
  onPrev?: () => Promise<void>;
  onNext?: () => Promise<void>;
}

const propsAreEqual = (prev: IProps, next: IProps): boolean => {
  return (
    prev.current === next.current &&
    prev.total === next.total &&
    prev.customText === next.customText &&
    prev.customDisableNext === next.customDisableNext
  );
};

export const TopPagination: React.FC<IProps> = memo(
  ({
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
      <div className="dds-annotator-toppagination">
        <Tooltip title={localeText('DDSAnnotator.prev')}>
          <Button
            className={classNames('dds-annotator-toppagination-btn', {
              'dds-annotator-toppagination-btn-disabled': disablePrev,
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
          <div className="dds-annotator-toppagination-scale-text">
            {current + 1} / {total}
          </div>
        )}
        <Tooltip title={localeText('DDSAnnotator.next')}>
          <Button
            className={classNames('dds-annotator-toppagination-btn', {
              'dds-annotator-toppagination-btn-disabled': disableNext,
            })}
            type="primary"
            icon={<RightOutlined />}
            loading={loadingNext}
            onClick={clickNext}
          />
        </Tooltip>
      </div>
    );
  },
  propsAreEqual,
);
