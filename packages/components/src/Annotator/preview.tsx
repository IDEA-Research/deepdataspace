import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnnotationType,
  DisplayOption,
  EElementType,
  MAX_SCALE,
  MIN_SCALE,
} from './constants';
import { useImmer } from 'use-immer';
import TopTools from './components/TopTools';
import PopoverMenu from './components/PopoverMenu';
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import useHistory from './hooks/useHistory';
import useObjects from './hooks/useObjects';
import useCanvasContainer from './hooks/useCanvasContainer';
import usePreviousState from './hooks/usePreviousState';
import { cloneDeep, isEmpty } from 'lodash';
import {
  BaseObject,
  Category,
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  DrawImageData,
  DrawObject,
  EditState,
  EditorMode,
  IAnnotationObject,
} from './type';
import useColor from './hooks/useColor';
import useMouseCursor from './hooks/useMouseCursor';
import useMouseEvents from './hooks/useMouseEvents';
import useCanvasRender from './hooks/useCanvasRender';
import useDataEffect from './hooks/useDataEffect';
import { RenderStyles, useToolInstances } from './tools/base';
import classNames from 'classnames';
import { ReactComponent as DoubleRightIcon } from './assets/doubleRight.svg';
import { ReactComponent as DownloadIcon } from './assets/download.svg';
import { useKeyPress } from 'ahooks';
import { EDITOR_SHORTCUTS, EShortcuts } from './constants/shortcuts';
import { message } from 'antd';
import { ImageView } from './components/ImageView';
import './index.less';

export interface PreviewProps {
  visible: boolean;
  categories: Category[];
  list: DrawImageData[];
  current: number;
  objectsFilter?: (imageData: any) => BaseObject[];
  getCustomObjectStyles?: (
    object: IAnnotationObject,
    color: string,
  ) => Partial<RenderStyles>;
  onCancel?: () => void;
  onPrev?: () => Promise<void>;
  onNext?: () => Promise<void>;
  displayAnnotationType?: AnnotationType;
  displayOptionsResult: { [key in DisplayOption]?: boolean };
}

const Preview: React.FC<PreviewProps> = (props) => {
  const {
    visible,
    categories,
    list,
    current,
    onPrev,
    onNext,
    onCancel,
    objectsFilter,
    getCustomObjectStyles,
    displayAnnotationType,
    displayOptionsResult,
  } = props;

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
    allowMove: editState.allowMove,
    isRequiring: editState.isRequiring,
    minPadding: {
      top: 120,
      left: 300,
    },
    cursorSize: drawData.brushSize,
    showReferenceLine: false,
    isCustomCursorActive: false,
    onClickMaskBg: onCancel,
  });

  const [preClientSize, clearPreClientSize] =
    usePreviousState<ISize>(clientSize);

  const { clearHistory, updateHistory, setDrawDataWithHistory } = useHistory({
    clientSize,
    naturalSize,
    setDrawData,
  });

  const { addObject, initObjectList, updateObject } = useObjects({
    annotations,
    setAnnotations,
    clientSize,
    naturalSize,
    drawData,
    setDrawData,
    setDrawDataWithHistory,
    editState,
    setEditState,
    mode: EditorMode.View,
    displayAnnotationType,
  });

  const { labelColors, getAnnotColor } = useColor({
    categories,
    editState,
  });

  const { updateMouseCursor } = useMouseCursor({
    topCanvas: activeCanvasRef.current,
    editState,
    drawData,
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
    getCustomObjectStyles,
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

  const { resetDataWithImageData, rebuildDrawData } = useDataEffect({
    imagePos,
    clientSize,
    preClientSize,
    clearPreClientSize,
    naturalSize,
    annotations,
    setAnnotations,
    labelColors,
    drawData,
    setDrawData,
    editState,
    setEditState,
    initObjectList,
    updateRender,
    clearHistory,
    objectsFilter,
  });

  /** Reset data when hiding the editor or switching images */
  useEffect(() => {
    resetDataWithImageData(list[current], visible);
  }, [visible, list[current], objectsFilter]);

  /** Custom options changed */
  useEffect(() => {
    rebuildDrawData(true);
  }, [displayAnnotationType, displayOptionsResult, getCustomObjectStyles]);

  // =================================================================================================================
  // Preview
  // =================================================================================================================

  const [showInfo, setShowInfo] = useState(true);
  const changeShowInfo = useCallback(() => {
    setShowInfo((s) => {
      return !s;
    });
  }, []);

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
      !drawData.objectList[editState.focusObjectIndex].hidden &&
      editState.focusEleIndex > -1 &&
      editState.focusEleType === EElementType.Circle
    ) {
      const target =
        drawData.objectList[editState.focusObjectIndex].keypoints?.points?.[
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

  const metadata = !isEmpty(list[current]?.metadata)
    ? list[current].metadata
    : undefined;

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
              url={list[current]?.urlFullRes}
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
            {
              list[current]?.caption ? (
                <div className="item">
                  {'caption'}
                  <br />
                  {list[current].caption}
                </div>
              ) : null
            }
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
    </div>
  );
};

export default Preview;
