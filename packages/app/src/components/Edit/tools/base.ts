/* eslint-disable @typescript-eslint/no-namespace */
import { drawRect } from '@/utils/draw';
import { hexToRgba } from '@/utils/color';
import { LABELS_STROKE_DASH } from '@/constants';
import {
  getRectWithCenterAndSize,
  mapRectToAnchors,
  setRectBetweenPixels,
} from '@/utils/compute';
import { EditState, IAnnotationObject, ICreatingObject, Prompt } from '../type';
import { CursorState } from 'ahooks/lib/useMouse';

export namespace ToolHooksFunc {
  export type RenderObject = (params: {
    object: IAnnotationObject;
    color: string;
    strokeAlpha: number;
    fillAlpha: number;
    maskAlpha: number;
  }) => void;

  export type RenderCreatingObject = (params: {
    object: ICreatingObject;
    color: string;
    strokeColor: string;
    fillColor: string;
  }) => void;

  export type RenderEditingObject = (params: {
    object: ICreatingObject;
    color: string;
    strokeAlpha: number;
    fillAlpha: number;
    isFocus: boolean;
  }) => void;

  export type RenderPrompt = (params: { prompt: Prompt }) => void;

  export type startCreateWhenMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;

  export type updateCreatingWhenMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;

  export type updateCreatingWhenMouseMove = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;

  export type finishCreatingWhenMouseUp = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;

  export type startEditWhenMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;

  export type updateEditingWhenMouseMove = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;

  export type finishEditingWhenMouseUp = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
}

export type ToolInstanceHookReturn = {
  renderObject: ToolHooksFunc.RenderObject;
  renderCreatingObject: ToolHooksFunc.RenderCreatingObject;
  renderEditingObject: ToolHooksFunc.RenderEditingObject;
  renderPrompt: ToolHooksFunc.RenderPrompt;
};

export type ToolInstanceHook = (props: {
  editState: EditState;
  clientSize: ISize;
  naturalSize: ISize;
  contentMouse: CursorState;
  imagePos: React.MutableRefObject<IPoint>;
  containerMouse: CursorState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeCanvasRef: React.RefObject<HTMLCanvasElement>;
}) => ToolInstanceHookReturn;

export const renderRect = (
  canvas: HTMLCanvasElement,
  rect: IElement<IRect>,
  color: string,
  strokeAlpha: number,
  fillAlpha: number,
) => {
  drawRect(
    canvas,
    rect,
    hexToRgba(color, strokeAlpha),
    2,
    LABELS_STROKE_DASH[0],
    hexToRgba(color, fillAlpha),
  );
};

export const renderActiveRect = (
  canvas: HTMLCanvasElement,
  rect: IElement<IRect>,
) => {
  const handleCenters: IPoint[] = mapRectToAnchors(rect).map(
    (rectAnchor) => rectAnchor.position,
  );
  handleCenters.forEach((center: IPoint) => {
    const handleRect: IRect = getRectWithCenterAndSize(center, {
      width: 10,
      height: 10,
    });
    const handleRectBetweenPixels: IRect = setRectBetweenPixels(handleRect);
    drawRect(
      canvas,
      handleRectBetweenPixels,
      'rgba(0, 0, 0, 0.8)',
      3,
      LABELS_STROKE_DASH[0],
      '#fff',
    );
  });
};
