import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnnotationType, DisplayOption } from './constants';
import { useImmer } from 'use-immer';
import { cloneDeep } from 'lodash';
import useHistory from './hooks/useHistory';
import useObjects from './hooks/useObjects';
import usePreviousState from './hooks/usePreviousState';
import {
  BaseObject,
  Category,
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
  DrawImageData,
  DrawObject,
} from './type';
import useColor from './hooks/useColor';
import useMouseCursor from './hooks/useMouseCursor';
import useCanvasRender from './hooks/useCanvasRender';
import useDataEffect from './hooks/useDataEffect';
import { RenderStyles, useToolInstances } from './tools/base';
import { zoomImgSize } from './utils/compute';
import { CursorState } from 'ahooks/lib/useMouse';
import { ImageView } from './components/ImageView';
import './index.less';

export interface ViewProps {
  categories: Category[];
  data: DrawImageData;
  objectsFilter?: (imageData: any) => BaseObject[];
  getCustomObjectStyles?: (
    object: IAnnotationObject,
    color: string,
  ) => Partial<RenderStyles>;
  currentSize?: ISize;
  wrapWidth?: number;
  wrapHeight?: number;
  minHeight?: number;
  displayAnnotationType?: AnnotationType;
  displayOptionsResult?: { [key in DisplayOption]?: boolean };
}

const View: React.FC<ViewProps> = (props) => {
  const {
    categories,
    data,
    currentSize,
    wrapWidth,
    wrapHeight,
    minHeight,
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

  const [preClientSize, clearPreClientSize] =
    usePreviousState<ISize>(clientSize);

  const { labelColors, getAnnotColor } = useColor({
    categories,
    editState,
  });

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
    getCustomObjectStyles,
  });

  // =================================================================================================================
  // Effects
  // =================================================================================================================

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
    resetDataWithImageData(data, true);
  }, [data, objectsFilter]);

  /** Custom options changed */
  useEffect(() => {
    rebuildDrawData(true);
  }, [displayAnnotationType, displayOptionsResult, getCustomObjectStyles]);

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
