import { CursorState } from 'ahooks/lib/useMouse';
import { cloneDeep } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useImmer } from 'use-immer';

import { ImageView } from './components/ImageView';
import { DisplayOption } from './constants';
import useCanvasRender from './hooks/useCanvasRender';
import useColor from './hooks/useColor';
import useDataEffect from './hooks/useDataEffect';
import useHistory from './hooks/useHistory';
import useMouseCursor from './hooks/useMouseCursor';
import useObjects from './hooks/useObjects';
import useTranslate from './hooks/useTranslate';
import { useToolInstances } from './tools/base';
import {
  BaseObject,
  Category,
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  EditState,
  EditorMode,
  AnnoItem,
  DrawObject,
} from './type';
import { zoomImgSize } from './utils/compute';

import './index.less';

export interface ViewProps {
  isOldMode?: boolean; // is old dataset design mode
  categories: Category[];
  data: AnnoItem;
  objectsFilter?: (imageData: any) => BaseObject[];
  currentSize?: ISize;
  wrapWidth?: number;
  wrapHeight?: number;
  minHeight?: number;
  displayOptionsResult?: { [key in DisplayOption]?: boolean };
}

const View: React.FC<ViewProps> = (props) => {
  const {
    isOldMode,
    categories,
    data,
    currentSize,
    wrapWidth,
    wrapHeight,
    minHeight,
    objectsFilter,
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

  const imagePos = useRef<IPoint>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<ISize>({
    width: 0,
    height: minHeight || 0,
  });

  const clientSize: ISize = useMemo(() => {
    // Exact size passed in from outside.
    if (currentSize) {
      return currentSize;
    }
    if (!naturalSize.width) {
      // Init default size
      return {
        width: wrapWidth || 0,
        height: wrapHeight || minHeight || 0,
      };
    }
    const [width, height] = zoomImgSize(
      naturalSize.width,
      naturalSize.height,
      wrapWidth,
      wrapHeight,
    );
    return { width, height };
  }, [wrapWidth, wrapHeight, minHeight, naturalSize, currentSize]);

  const [contentMouse, containerMouse] = useMemo(() => {
    const mouse: CursorState = {
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      elementX: 0,
      elementY: 0,
      elementPosX: 0,
      elementPosY: 0,
      elementW: clientSize.width,
      elementH: clientSize.height,
    };
    return [mouse, mouse];
  }, [clientSize]);

  const { getAnnotColor } = useColor({
    categories,
    editState,
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
    containerMouse,
    imagePos,
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
    visible: true,
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

  // =================================================================================================================
  // Effects
  // =================================================================================================================

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
    resetDataWithImageData(data, true);
  }, [data, objectsFilter]);

  /** Custom options changed */
  useEffect(() => {
    updateRender();
  }, [displayOptionsResult]);

  const onLoadImg = (e: React.UIEvent<HTMLImageElement, UIEvent>) => {
    // Set natural size.
    const img = e.target as HTMLImageElement;
    const size = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
    setNaturalSize(size);
  };

  // =================================================================================================================
  // Render
  // =================================================================================================================

  return (
    <div className="dds-annotator-view">
      <ImageView
        url={data?.url}
        imgRef={imgRef}
        canvasRef={canvasRef}
        activeCanvasRef={activeCanvasRef}
        clientSize={clientSize}
        imagePos={imagePos}
        onLoad={onLoadImg}
      />
    </div>
  );
};

export default View;
