/* eslint-disable @typescript-eslint/no-namespace */
import { drawRect } from '@/utils/draw';
import { EElementType, LABELS_STROKE_DASH } from '@/constants';
import {
  Direction,
  getAnchorFixRectPoint,
  getAnchorUnderMouseByRect,
  getClosestPointOnLineSegment,
  getLinesFromPolygon,
  getRectWithCenterAndSize,
  judgeFocusOnElement,
  mapRectToAnchors,
  moveRect,
  resizeRect,
  setRectBetweenPixels,
} from '@/utils/compute';
import {
  DrawData,
  EditState,
  EObjectStatus,
  IAnnotationObject,
  ICreatingObject,
  IPrompt,
} from '../type';
import { CursorState } from 'ahooks/lib/useMouse';
import { Updater } from 'use-immer';
import { HistoryItem } from '../hooks/useHistory';
import { OnAiAnnotationFunc } from '../hooks/useActions';

export namespace ToolHooksFunc {
  export type RenderObject = (params: {
    object: IAnnotationObject;
    color: string;
    strokeAlpha: number;
    fillAlpha: number;
    maskAlpha: number;
    isFocus: boolean;
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
    event: MouseEvent;
    object?: ICreatingObject;
    point: { x: number; y: number };
    basic: { hidden: boolean; label: string; status: EObjectStatus };
  }) => boolean;

  export type StartEditingWhenMouseDown = (params: {
    event: MouseEvent;
    object: ICreatingObject;
  }) => boolean;

  export type UpdateCreatingWhenMouseMove = (params: {
    event: MouseEvent;
    object?: ICreatingObject;
  }) => boolean;

  export type UpdateEditingWhenMouseMove = (params: {
    event: MouseEvent;
    object: ICreatingObject;
  }) => boolean;

  export type FinishCreatingWhenMouseUp = (params: {
    event: MouseEvent;
    object?: ICreatingObject;
  }) => boolean;

  export type FinishEditingWhenMouseUp = (params: {
    event: MouseEvent;
    object: ICreatingObject;
  }) => boolean;
}

export type ToolInstanceHookReturn = {
  renderObject: ToolHooksFunc.RenderObject;
  renderCreatingObject: ToolHooksFunc.RenderCreatingObject;
  renderEditingObject: ToolHooksFunc.RenderEditingObject;
  renderPrompt: ToolHooksFunc.RenderPrompt;
  startCreatingWhenMouseDown: ToolHooksFunc.StartCreatingWhenMouseDown;
  startEditingWhenMouseDown: ToolHooksFunc.StartEditingWhenMouseDown;
  updateCreatingWhenMouseMove: ToolHooksFunc.UpdateCreatingWhenMouseMove;
  updateEditingWhenMouseMove: ToolHooksFunc.UpdateEditingWhenMouseMove;
  finishCreatingWhenMouseUp: ToolHooksFunc.FinishCreatingWhenMouseUp;
  finishEditingWhenMouseUp: ToolHooksFunc.FinishEditingWhenMouseUp;
};

export type ToolInstanceHook = (props: {
  editState: EditState;
  setEditState: Updater<EditState>;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  updateHistory: (item: HistoryItem) => void;
  updateObject: (object: IAnnotationObject, index: number) => void;
  addObject: (object: IAnnotationObject, notActive?: boolean) => void;
  clientSize: ISize;
  naturalSize: ISize;
  contentMouse: CursorState;
  imagePos: React.MutableRefObject<IPoint>;
  containerMouse: CursorState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeCanvasRef: React.RefObject<HTMLCanvasElement>;
  updateMouseCursor: (value: string, position?: Direction) => void;
  aiLabels: string[];
  onAiAnnotation: OnAiAnnotationFunc;
}) => ToolInstanceHookReturn;

export const getPromptBoolean = (event: MouseEvent): boolean => {
  // Right Mouse Click / Lift Mouse Click + (Alt/Option) -> false
  if (event.button === 2 || (event.button === 0 && event.altKey)) return false;
  return true;
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
  const { focusEleIndex, focusEleType, focusPolygonInfo } = judgeFocusOnElement(
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
        const { lineIndex, index } = focusPolygonInfo;
        if (polygon) {
          if (lineIndex > -1) {
            // add point
            const line = getLinesFromPolygon(polygon.group[index])[lineIndex];
            if (line) {
              const midPoint = getClosestPointOnLineSegment(
                mouse,
                line.start,
                line.end,
              );
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
              s.focusPolygonInfo.pointIndex = lineIndex + 1;
              s.startElementMovePoint = {
                topLeftPoint: {
                  x: 0,
                  y: 0,
                },
                mousePoint: midPoint,
                initPoint: midPoint,
              };
            }
          } else {
            s.startElementMovePoint = {
              topLeftPoint: {
                x: 0,
                y: 0,
              },
              mousePoint: mouse,
              initPoint: mouse,
            };
          }
        }
        break;
      }
    }
  });
  return true;
};

export const updateEditingRectWhenMouseMove = ({
  object,
  editState,
  contentMouse,
  drawData,
  setDrawData,
  updateMouseCursor,
}: {
  object: ICreatingObject;
  editState: EditState;
  contentMouse: CursorState;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  updateMouseCursor: (value: string, position?: Direction) => void;
}) => {
  const {
    focusObjectIndex,
    focusEleIndex,
    focusEleType,
    startRectResizeAnchor,
  } = editState;
  // update mouse cursor
  if (
    focusObjectIndex === drawData.activeObjectIndex &&
    focusEleType === EElementType.Rect &&
    object.rect
  ) {
    const anchorUnderMouse = getAnchorUnderMouseByRect(object.rect, {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    });
    if (anchorUnderMouse) {
      updateMouseCursor('resize', anchorUnderMouse.type);
    } else {
      updateMouseCursor('move');
    }
  }
  if (focusEleType === EElementType.Rect && focusEleIndex === 0) {
    // resize rectangle
    if (startRectResizeAnchor) {
      setDrawData((s) => {
        if (
          s.activeObjectIndex > -1 &&
          editState.startRectResizeAnchor &&
          s.creatingObject &&
          s.creatingObject.rect
        ) {
          const newRect = resizeRect(
            s.creatingObject.rect,
            editState.startRectResizeAnchor,
            contentMouse,
          );
          s.creatingObject.rect = { ...s.creatingObject.rect, ...newRect };
        }
      });
      return true;
    }
    // move rectangle
    if (editState.startElementMovePoint) {
      setDrawData((s) => {
        if (
          s.activeObjectIndex > -1 &&
          editState.startElementMovePoint &&
          s.creatingObject &&
          s.creatingObject.rect
        ) {
          const newRect = moveRect(
            s.creatingObject.rect,
            editState.startElementMovePoint,
            contentMouse,
          );
          s.creatingObject.rect = { ...s.creatingObject.rect, ...newRect };
        }
      });
      return true;
    }
  }
  return false;
};
