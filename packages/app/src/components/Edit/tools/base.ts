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

export type RenderObjectFunc = (params: {
  object: IAnnotationObject;
  color: string;
  strokeAlpha: number;
  fillAlpha: number;
  maskAlpha: number;
}) => void;

export type RenderCreatingObjectFunc = (params: {
  object: ICreatingObject;
  color: string;
  strokeColor: string;
  fillColor: string;
}) => void;

export type RenderEditingObjectFunc = (params: {
  object: ICreatingObject;
  color: string;
  strokeAlpha: number;
  fillAlpha: number;
  isFocus: boolean;
}) => void;

export type RenderPromptFunc = (params: { prompt: Prompt }) => void;

export type ToolInstanceHookReturn = {
  renderObject: RenderObjectFunc;
  renderCreatingObject: RenderCreatingObjectFunc;
  renderEditingObject: RenderEditingObjectFunc;
  renderPrompt: RenderPromptFunc;
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
