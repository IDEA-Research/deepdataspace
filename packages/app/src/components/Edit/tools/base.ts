/* eslint-disable @typescript-eslint/no-namespace */
import { drawRect } from '@/utils/draw';
import { hexToRgba } from '@/utils/color';
import { EElementType, LABELS_STROKE_DASH } from '@/constants';
import {
  getAnchorFixRectPoint,
  getAnchorUnderMouseByRect,
  getLinesFromPolygon,
  getMidPointFromTwoPoints,
  getRectWithCenterAndSize,
  judgeFocusOnElement,
  mapRectToAnchors,
  setRectBetweenPixels,
} from '@/utils/compute';
import {
  DrawData,
  EditState,
  IAnnotationObject,
  ICreatingObject,
  IPrompt,
} from '../type';
import { CursorState } from 'ahooks/lib/useMouse';
import { Updater } from 'use-immer';
import { HistoryItem } from '../hooks/useHistory';

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

  export type RenderPrompt = (params: { prompt: IPrompt }) => void;

  export type StartCreatingWhenMouseDown = (params: {
    event: React.MouseEvent<HTMLDivElement, MouseEvent>;
    object?: ICreatingObject;
    prompt: IPrompt;
    point: { x: number; y: number };
    basic: { hidden: boolean; label: string };
  }) => boolean;

  export type StartEditingWhenMouseDown = (params: {
    event: React.MouseEvent<HTMLDivElement, MouseEvent>;
    object: ICreatingObject;
    prompt: IPrompt;
  }) => boolean;

  export type UpdateCreatingWhenMouseMove = (params: {
    event: React.MouseEvent<HTMLDivElement, MouseEvent>;
    object?: ICreatingObject;
    prompt: IPrompt;
  }) => boolean;

  export type UpdateEditingWhenMouseMove = (params: {
    event: React.MouseEvent<HTMLDivElement, MouseEvent>;
    object: ICreatingObject;
    prompt: IPrompt;
  }) => boolean;

  export type FinishCreatingWhenMouseUp = (params: {
    event: React.MouseEvent<HTMLDivElement, MouseEvent>;
    object?: ICreatingObject;
    prompt: IPrompt;
  }) => boolean;

  export type FinishEditingWhenMouseUp = (params: {
    event: React.MouseEvent<HTMLDivElement, MouseEvent>;
    object: ICreatingObject;
    prompt: IPrompt;
  }) => boolean;
}

export type ToolInstanceHookReturn = {
  renderObject: ToolHooksFunc.RenderObject;
  renderCreatingObject: ToolHooksFunc.RenderCreatingObject;
  renderEditingObject: ToolHooksFunc.RenderEditingObject;
  renderPrompt: ToolHooksFunc.RenderPrompt;
  startCreatingWhenMouseDown: ToolHooksFunc.StartCreatingWhenMouseDown;
  startEditingWhenMouseDown: ToolHooksFunc.StartEditingWhenMouseDown;
};

export type ToolInstanceHook = (props: {
  editState: EditState;
  setEditState: Updater<EditState>;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  updateHistory: (item: HistoryItem) => void;
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

export const getPromptBoolean = (
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
): boolean => {
  // Right Mouse Click / Lift Mouse Click + (Alt/Option) -> false
  if (event.button === 2 || (event.button === 0 && event.altKey)) return false;
  return true;
};

export const editBaseElementWhenMouseDown = ({
  object,
  contentMouse,
  setEditState,
  setDrawData,
}: {
  object: ICreatingObject;
  contentMouse: CursorState;
  setEditState: Updater<EditState>;
  setDrawData: Updater<DrawData>;
}) => {
  const { focusEleIndex, focusEleType } = judgeFocusOnElement(
    contentMouse,
    object,
  );
  if (focusEleType === EElementType.None) return false;

  const { rect, keypoints, polygon } = object;
  const mouse = {
    x: contentMouse.elementX,
    y: contentMouse.elementY,
  };
  setEditState((s) => {
    switch (focusEleType) {
      case EElementType.Rect: {
        if (rect) {
          const anchorUnderMouse = getAnchorUnderMouseByRect(rect, mouse);
          if (anchorUnderMouse) {
            // resize
            s.startRectResizeAnchor = {
              type: anchorUnderMouse.type,
              position: getAnchorFixRectPoint(rect, anchorUnderMouse.type),
            };
          } else {
            // move
            s.startElementMovePoint = {
              topLeftPoint: {
                x: rect.x,
                y: rect.y,
              },
              mousePoint: mouse,
            };
          }
        }
        break;
      }
      case EElementType.Circle: {
        // move circle
        if (keypoints) {
          const point = keypoints.points[focusEleIndex];
          s.startElementMovePoint = {
            topLeftPoint: {
              x: point.x,
              y: point.y,
            },
            mousePoint: mouse,
          };
        }
        break;
      }
      case EElementType.Polygon: {
        const { lineIndex, index } = s.focusPolygonInfo;
        if (polygon) {
          // move
          s.startElementMovePoint = {
            topLeftPoint: {
              x: 0,
              y: 0,
            },
            mousePoint: mouse,
            initPoint: mouse,
          };

          // add point
          if (lineIndex > -1) {
            const line = getLinesFromPolygon(polygon.group[index])[lineIndex];
            if (line) {
              const midPoint = getMidPointFromTwoPoints(line.start, line.end);
              setDrawData((s) => {
                const activeObject = s.objectList[s.activeObjectIndex];
                if (activeObject.polygon) {
                  activeObject.polygon.group[index].splice(
                    lineIndex + 1,
                    0,
                    midPoint,
                  );
                }
                s.creatingObject = { ...activeObject };
              });
            }
          }
        }
        break;
      }
    }
  });
  return true;
};
