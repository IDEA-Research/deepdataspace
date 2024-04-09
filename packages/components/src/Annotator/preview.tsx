import {
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { useKeyPress } from 'ahooks';
import { message } from 'antd';
import classNames from 'classnames';
import { cloneDeep, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useImmer } from 'use-immer';

import { ReactComponent as DoubleRightIcon } from './assets/doubleRight.svg';
import { ReactComponent as DownloadIcon } from './assets/download.svg';
import { ImageView } from './components/ImageView';
import PopoverMenu from './components/PopoverMenu';
import TopTools from './components/TopTools';
import { DisplayOption, EElementType, MAX_SCALE, MIN_SCALE } from './constants';
import { EDITOR_SHORTCUTS, EShortcuts } from './constants/shortcuts';
import useCanvasContainer from './hooks/useCanvasContainer';
import useCanvasRender from './hooks/useCanvasRender';
import useColor from './hooks/useColor';
import useDataEffect from './hooks/useDataEffect';
import useHistory from './hooks/useHistory';
import useMouseCursor from './hooks/useMouseCursor';
import useMouseEvents from './hooks/useMouseEvents';
import useObjects from './hooks/useObjects';
import useTranslate from './hooks/useTranslate';
import { useToolInstances } from './tools/base';
import {
  BaseObject,
  Category,
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  AnnoItem,
  DrawObject,
  EditState,
  EditorMode,
} from './type';

import './index.less';
import HighlightText from './components/HighlightText';
import { useLocale } from 'dds-utils/locale';


export interface PreviewProps {
  isOldMode?: boolean; // is old dataset design mode
  visible: boolean;
  categories: Category[];
  list: AnnoItem[];
  current: number;
  objectsFilter?: (imageData: any) => BaseObject[];
  onCancel?: () => void;
  onPrev?: () => Promise<void>;
  onNext?: () => Promise<void>;
  displayOptionsResult: { [key in DisplayOption]?: boolean };
}

const Preview: React.FC<PreviewProps> = (props) => {
  const {
    isOldMode,
    visible,
    categories,
    list,
    current,
    onPrev,
    onNext,
    onCancel,
    objectsFilter,
    displayOptionsResult,
  } = props;

  const { localeText } = useLocale();

  const [annotations, setAnnotations] = useImmer<DrawObject[]>([]);

  const [editState, setEditState] = useImmer<EditState>(
    cloneDeep(DEFAULT_EDIT_STATE),
  );

  const [drawData, setDrawData] = useImmer<DrawData>(
    cloneDeep(DEFAULT_DRAW_DATA),
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const {
    scale,
    naturalSize,
    clientSize,
    containerMouse,
    contentMouse,
    imagePos,
    onLoadImg,
    onZoomIn,
    onZoomOut,
    CanvasContainer,
  } = useCanvasContainer({
    visible,
    drawData,
    allowMove: editState.allowMove,
    isRequiring: editState.isRequiring,
    minPadding: {
      top: 150,
      left: 300,
    },
    cursorSize: drawData.brushSize,
    onClickMaskBg: onCancel,
  });

  const { getAnnotColor } = useColor({
    categories,
    editState,
  });

  const { updateMouseCursor } = useMouseCursor({
    topCanvas: activeCanvasRef.current,
    editState,
    drawData,
  });

  const { translateToObject } = useTranslate({
    isOldMode,
    clientSize,
    naturalSize,
    categories,
    getAnnotColor,
  });

  const { clearHistory, updateHistory, setDrawDataWithHistory } = useHistory({
    clientSize,
    naturalSize,
    setDrawData,
  });

  const { addObject, initObjectList, updateObject } = useObjects({
    mode: EditorMode.View,
    categories,
    drawData,
    setDrawData,
    setDrawDataWithHistory,
    setEditState,
    translateToObject,
    updateHistory,
  });

  const { objectHooksMap } = useToolInstances({
    imgRef,
    editState,
    clientSize,
    naturalSize,
    contentMouse,
    imagePos,
    containerMouse,
    canvasRef,
    activeCanvasRef,
    setEditState,
    drawData,
    setDrawData,
    setDrawDataWithHistory,
    updateHistory,
    updateObject,
    addObject,
    updateMouseCursor,
    displayOptionsResult,
    getAnnotColor,
    categories,
  });

  const { updateRender } = useCanvasRender({
    visible,
    drawData,
    editState,
    clientSize,
    imagePos,
    containerMouse,
    canvasRef,
    activeCanvasRef,
    imgRef,
    objectHooksMap,
  });

  useMouseEvents({
    visible,
    mode: EditorMode.View,
    drawData,
    setDrawData,
    editState,
    setEditState,
    clientSize,
    contentMouse,
    categories,
    updateRender,
    updateMouseCursor,
    objectHooksMap,
    imagePos,
    containerMouse,
    getAnnotColor,
    limitActiveObject: true,
  });

  // =================================================================================================================
  // Effects
  // =================================================================================================================

  /** Limit bottom layer body scroll */
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : 'overlay';
  }, [visible]);

  const { resetDataWithImageData } = useDataEffect({
    imagePos,
    clientSize,
    naturalSize,
    annotations,
    setAnnotations,
    drawData,
    setDrawData,
    editState,
    setEditState,
    initObjectList,
    updateRender,
    clearHistory,
    objectsFilter,
    labelOptions: categories,
  });

  /** Reset data when hiding the editor or switching images */
  useEffect(() => {
    resetDataWithImageData(list[current], visible);
  }, [visible, list[current], objectsFilter]);

  /** Custom options changed */
  useEffect(() => {
    updateRender();
  }, [displayOptionsResult]);

  // =================================================================================================================
  // Preview
  // =================================================================================================================

  const [showInfo, setShowInfo] = useState(true);
  const [showGrounding, setShowGrounding] = useState(false);

  const metadata = !isEmpty(list[current]?.metadata)
    ? list[current].metadata
    : undefined;

  const changeShowInfo = useCallback(() => {
    setShowInfo((s) => {
      return !s;
    });
  }, []);

  const changeShowGrounding = useCallback(() => {
    if (!metadata || !metadata.caption) return;
    setShowGrounding((s) => {
      return !s;
    });
  }, [metadata]);

  /** Snapshot image */
  const onDownload: React.MouseEventHandler<HTMLDivElement> = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const hide = message.loading('Creating image...', 60000);
    const loadDataUrl = () => {
      return new Promise((resolve, reject) => {
        setTimeout(function () {
          try {
            if (!canvasRef.current) return;
            const dataUrl = canvasRef.current.toDataURL();
            let a = document.createElement('a');
            a.setAttribute('download', `${list[current].id}.png`);
            a.setAttribute('href', dataUrl);
            a.click();
            hide();
            resolve(null);
          } catch (e) {
            reject(e);
          }
        }, 500);
      });
    };

    try {
      setEditState((s) => {
        s.focusObjectIndex = -1;
      });
      updateRender();
      await loadDataUrl();
    } catch (error) {
      console.error(error);
      hide();
      message.error('Create image fail, please try again');
    }
  };

  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.PreviousImage].shortcut,
    () => {
      if (visible) onPrev?.();
    },
    {
      exactMatch: true,
    },
  );

  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.NextImage].shortcut,
    () => {
      if (visible) onNext?.();
    },
    {
      exactMatch: true,
    },
  );

  // =================================================================================================================
  // Render
  // =================================================================================================================

  const renderPopoverMenu = () => {
    if (
      editState.focusObjectIndex > -1 &&
      drawData.objectList[editState.focusObjectIndex] &&
      !drawData.objectList[editState.focusObjectIndex]?.hidden &&
      editState.focusEleIndex > -1 &&
      editState.focusEleType === EElementType.Circle
    ) {
      const target =
        drawData.objectList[editState.focusObjectIndex]?.keypoints?.points?.[
        editState.focusEleIndex
        ];
      if (target) {
        return (
          <PopoverMenu
            index={editState.focusEleIndex}
            targetElement={target!}
            imagePos={imagePos.current}
          />
        );
      }
    }
    return <></>;
  };

  if (!visible) {
    return <></>;
  }

  const getHighlightWords = () => {
    const objects = list[current].objects;
    return categories
      .filter((category) => objects.find((obj: any) => obj.categoryId === category.id))
      .map((category) => {
        return {
          text: category.name,
          color: getAnnotColor(category.id),
        }
      })
  };

  const highlightCategory = (name: string) => {
    setDrawData((s) => {
      const category = categories.find(item => item.name === name);
      s.highlightCategory = category;
    });
  };

  const clearHighlightCategory = () => {
    setDrawData((s) => {
      s.highlightCategory = undefined;
    });
  };

  return (
    <div className="dds-annotator dds-annotator-preview">
      <TopTools
        className="top-tools"
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
            icon: <DownloadIcon />,
            onClick: onDownload,
          },
          {
            icon: showGrounding ? <EyeOutlined /> : <EyeInvisibleOutlined />,
            onClick: changeShowGrounding,
            disabled: !metadata || !metadata.caption,
            title: showGrounding ? localeText('dataset.detail.hideGrounding') : localeText('dataset.detail.showGrounding'),
          },
        ]}
        rightTools={[
          {
            icon: <CloseOutlined />,
            onClick: onCancel,
          },
        ]}
      >
        {`${current + 1} / ${list.length}`}
      </TopTools>
      {CanvasContainer({
        className: 'edit-wrap',
        children: (
          <>
            <ImageView
              url={list[current]?.url}
              imgRef={imgRef}
              canvasRef={canvasRef}
              activeCanvasRef={activeCanvasRef}
              clientSize={clientSize}
              imagePos={imagePos}
              onLoad={onLoadImg}
            />
            {renderPopoverMenu()}
          </>
        ),
      })}
      {
        <div
          className={classNames('switch', 'switch-left', {
            'switch-disable': current === 0,
          })}
          onClick={onPrev}
        >
          <LeftOutlined />
        </div>
      }
      {
        <div
          className={classNames('switch', 'switch-right', {
            'switch-disable': current === list.length - 1,
          })}
          onClick={onNext}
        >
          <RightOutlined />
        </div>
      }
      {showInfo && metadata && (
        <div className="info-wrap">
          <div className="info-box">
            {Object.keys(metadata).map((key) => (
              <div key={key} className="item">
                {key}
                <br />
                {typeof metadata[key] === 'object'
                  ? JSON.stringify(metadata[key])
                  : metadata[key]}
              </div>
            ))}
          </div>
          <div className="bottom-mask" />
          <div className="hide-info-btn" onClick={changeShowInfo}>
            <DoubleRightIcon />
          </div>
        </div>
      )}
      {!showInfo && (
        <div className="show-info-btn" onClick={changeShowInfo}>
          <DoubleRightIcon />
        </div>
      )}
      {
        showGrounding && !!metadata?.caption &&
        <div className="dds-annotator-grounding-preview">
          <HighlightText
            text={metadata.caption}
            highlights={getHighlightWords()}
            onHoverHighlightWord={(text) => highlightCategory(text)}
            onLeaveHighlightWord={clearHighlightCategory}
          />
        </div>
      }
    </div>
  );
};

export default Preview;
