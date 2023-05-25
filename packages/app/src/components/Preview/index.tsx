import React, { useCallback, useState, useRef } from 'react';
import { MIN_SCALE, MAX_SCALE } from '@/constants';
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { ReactComponent as DoubleRightIcon } from '@/assets/svg/doubleRight.svg';
import { ReactComponent as DownloadIcon } from '@/assets/svg/download.svg';
import { DATA } from '@/services/type';
import useScalableContainer from '@/hooks/useScalableContainer';
import usePreviewSwitcher from '@/hooks/usePreviewSwitcher';
import styles from './index.less';
import TopTools from '@/components/TopTools';
import classNames from 'classnames';
import { reportEvent } from '@/logs';
import { AnnotationImageHandle } from '@/components/AnnotationImage';
import { AnnotationImageRender } from '@/models/dataset/type';

export interface PreviewProps {
  visible: boolean;
  list: DATA.DataSetImg[];
  current: number;
  onCurrentChange: (current: number) => void;
  onClose: () => void;
  renderAnnotationImage: AnnotationImageRender;
}

const Preview: React.FC<PreviewProps> = (props) => {
  const {
    visible,
    list,
    current,
    onCurrentChange,
    onClose,
    renderAnnotationImage,
  } = props;

  const annotationImageRef = useRef<AnnotationImageHandle>(null);

  const {
    onZoomIn,
    onZoomOut,
    onRotateRight,
    onRotateLeft,
    setNaturalSize,
    ScalableContainer,
    clientSize,
    scale,
  } = useScalableContainer({
    visible,
    allowMove: true,
    minPadding: { top: 97, left: 292 },
    onClickMaskBg: onClose,
    isRequiring: false,
  });

  const onLoadImg = (e: React.UIEvent<HTMLImageElement, UIEvent>) => {
    const img = e.target as HTMLImageElement;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const { onSwitchLeft, onSwitchRight } = usePreviewSwitcher({
    visible,
    current,
    total: list.length,
    onCurrentChange,
  });

  const [showInfo, setShowInfo] = useState(true);
  const changeShowInfo = useCallback(() => {
    setShowInfo((s) => {
      reportEvent(
        s
          ? 'dataset_item_preview_info_hidden'
          : 'dataset_item_preview_info_show',
      );
      return !s;
    });
  }, []);

  /** Snapshot image */
  const onDownload: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (annotationImageRef.current) {
      annotationImageRef.current.exportCanvas();
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.preview}>
      <TopTools
        className={styles.topTools}
        leftTools={[
          {
            icon: <ZoomInOutlined />,
            onClick: onZoomIn,
            disabled: scale >= MAX_SCALE,
          },
          {
            icon: <ZoomOutOutlined />,
            onClick: onZoomOut,
            disabled: scale <= MIN_SCALE,
          },
          {
            icon: <RotateRightOutlined />,
            onClick: onRotateRight,
          },
          {
            icon: <RotateLeftOutlined />,
            onClick: onRotateLeft,
          },
          {
            icon: <DownloadIcon />,
            onClick: onDownload,
          },
        ]}
        rightTools={[
          {
            icon: <CloseOutlined />,
            onClick: onClose,
          },
        ]}
      >
        {`${current + 1} / ${list.length}`}
      </TopTools>
      {ScalableContainer({
        className: styles.previewWrapper,
        children: renderAnnotationImage({
          data: list[current],
          currentSize: clientSize,
          isPreview: true,
          ref: annotationImageRef,
          onLoad: onLoadImg,
        }),
      })}
      {
        <div
          className={classNames(styles.switch, styles.switchLeft, {
            [styles.switchDisable]: current === 0,
          })}
          onClick={onSwitchLeft}
        >
          <LeftOutlined />
        </div>
      }
      {
        <div
          className={classNames(styles.switch, styles.switchRight, {
            [styles.switchDisable]: current === list.length - 1,
          })}
          onClick={onSwitchRight}
        >
          <RightOutlined />
        </div>
      }
      {showInfo && list[current]?.metadata && (
        <div className={styles.infoWrap}>
          <div className={styles.infoBox}>
            {list[current]?.metadata &&
              Object.keys(list[current].metadata).map((key) => (
                <div key={key} className={styles.item}>
                  {key}
                  <br />
                  {typeof list[current].metadata[key] === 'object'
                    ? JSON.stringify(list[current].metadata[key])
                    : list[current].metadata[key]}
                </div>
              ))}
          </div>
          <div className={styles.bottomMask} />
          <div className={styles.hideInfoBtn} onClick={changeShowInfo}>
            <DoubleRightIcon />
          </div>
        </div>
      )}
      {!showInfo && (
        <div className={styles.showInfoBtn} onClick={changeShowInfo}>
          <DoubleRightIcon />
        </div>
      )}
    </div>
  );
};

export default Preview;
