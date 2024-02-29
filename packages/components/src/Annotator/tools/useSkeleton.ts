import {
  BODY_TEMPLATE,
  EElementType,
  EObjectType,
  KEYPOINTS_VISIBLE_TYPE,
} from '../constants';
import { EObjectStatus } from '../type';
import {
  getKeypointsFromRect,
  getRectFromPoints,
  movePoint,
  translatePointsToPointObjs,
  translateRectCoord,
} from '../utils/compute';
import { drawCircleWithFill, drawLine, drawRect } from '../utils/draw';

import {
  ToolInstanceHook,
  ToolHooksFunc,
  renderActiveRect,
  editBaseElementWhenMouseDown,
  updateEditingRectWhenMouseMove,
  RenderStyles,
} from './base';

const renderKeypoints = (
  canvas: HTMLCanvasElement,
  keypoints: {
    points: IElement<IPoint>[];
    lines: number[];
  },
  color: string,
  styles: RenderStyles,
  hideLine?: boolean,
  pointThickness = 4,
) => {
  const { lines, points } = keypoints;

  // draw line
  if (!hideLine) {
    for (let i = 0; i * 2 < lines.length; i++) {
      const [index1, index2] = [lines[i * 2], lines[i * 2 + 1]];
      if (
        points[index1]?.visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible &&
        points[index2]?.visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible
      ) {
        drawLine(
          canvas,
          points[index1],
          points[index2],
          styles.strokeColor,
          styles.thickness,
          styles.strokeDash,
        );
      }
    }
  }

  // draw circle
  points.forEach((point) => {
    const { x, y, visible, color } = point;
    if (visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible) {
      drawCircleWithFill(canvas, { x, y }, pointThickness, color, 2, '#000');
    }
  });
};

const useSkeleton: ToolInstanceHook = ({
  editState,
  clientSize,
  naturalSize,
  contentMouse,
  imagePos,
  canvasRef,
  activeCanvasRef,
  setEditState,
  drawData,
  setDrawData,
  updateMouseCursor,
  addObject,
  updateObject,
  onAiAnnotation,
  displayOptionsResult,
}) => {
  const renderObject: ToolHooksFunc.RenderObject = ({
    object,
    color,
    styles,
  }) => {
    if (object.status === EObjectStatus.Unchecked) return;
    const { rect, keypoints } = object;
    if (rect && rect.visible) {
      if (!displayOptionsResult || displayOptionsResult.showKeyPointsBox) {
        drawRect(
          canvasRef.current!,
          rect,
          styles.strokeColor,
          styles.thickness,
          styles.strokeDash,
          styles.fillColor,
        );
      }
    }
    if (keypoints) {
      renderKeypoints(
        canvasRef.current!,
        keypoints,
        color,
        styles,
        displayOptionsResult && !displayOptionsResult.showKeyPointsLine,
        clientSize.width > 400 ? 4 : 2,
      );
    }
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = ({
    object,
    styles,
  }) => {
    const { startPoint } = object;
    if (startPoint) {
      // creating
      const rect = getRectFromPoints(
        startPoint!,
        {
          x: contentMouse.elementX,
          y: contentMouse.elementY,
        },
        {
          width: contentMouse.elementW,
          height: contentMouse.elementH,
        },
      );
      const canvasCoordRect = translateRectCoord(rect, {
        x: -imagePos.current.x,
        y: -imagePos.current.y,
      });
      const { points, lines, pointColors, pointNames } = BODY_TEMPLATE;
      const pointObjs = translatePointsToPointObjs(
        points,
        pointNames,
        pointColors,
        naturalSize,
        clientSize,
      );
      const updatedKeypoints = getKeypointsFromRect(pointObjs, canvasCoordRect);

      // draw rect
      drawRect(
        activeCanvasRef.current,
        canvasCoordRect,
        styles.strokeColor,
        styles.thickness,
      );

      // draw circles
      updatedKeypoints.forEach((p) => {
        drawCircleWithFill(
          activeCanvasRef.current!,
          { x: p.x, y: p.y },
          4,
          styles.strokeColor,
          3,
          '#1f4dd8',
        );
      });

      // draw lines
      for (let i = 0; i * 2 < lines.length; i++) {
        const [index1, index2] = [lines[i * 2], lines[i * 2 + 1]];
        drawLine(
          activeCanvasRef.current!,
          updatedKeypoints[index1],
          updatedKeypoints[index2],
          styles.strokeColor,
          2.5,
          [0],
        );
      }
    }
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = ({
    object,
    color,
    styles,
    isFocus,
  }) => {
    const { rect, keypoints } = object;
    if (rect && rect.visible) {
      // editing
      drawRect(
        activeCanvasRef.current!,
        rect,
        styles.strokeColor,
        styles.thickness,
        styles.strokeDash,
        styles.fillColor,
      );
      renderActiveRect(activeCanvasRef.current!, rect);
    }
    if (keypoints) {
      renderKeypoints(activeCanvasRef.current!, keypoints, color, styles);

      // draw hightlight circle
      if (
        isFocus &&
        editState.focusEleType === EElementType.Circle &&
        keypoints.points[editState.focusEleIndex]
      ) {
        const { x, y, visible, color } =
          keypoints.points[editState.focusEleIndex];
        if (visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible) {
          drawCircleWithFill(
            activeCanvasRef.current!,
            { x, y },
            4,
            color,
            5,
            '#fff',
          );
        }
      }
    }
  };

  const renderPrompt: ToolHooksFunc.RenderPrompt = () => {
    // nothing in skeleton
  };

  const startEditingWhenMouseDown: ToolHooksFunc.StartEditingWhenMouseDown = ({
    object,
    event,
  }) => {
    if (event?.button === 2) return false;
    if (
      editBaseElementWhenMouseDown({
        object,
        contentMouse,
        setEditState,
        setDrawData,
      })
    ) {
      return true;
    }
    return false;
  };

  const startCreatingWhenMouseDown: ToolHooksFunc.StartCreatingWhenMouseDown =
    ({ point, basic }) => {
      setDrawData((s) => {
        s.activeObjectIndex = -1;
        s.creatingObject = {
          type: EObjectType.Skeleton,
          startPoint: point,
          ...basic,
        };
      });
      return true;
    };

  const updateEditingWhenMouseMove: ToolHooksFunc.UpdateEditingWhenMouseMove =
    ({ object }) => {
      // change rect
      if (
        updateEditingRectWhenMouseMove({
          object,
          editState,
          contentMouse,
          drawData,
          setDrawData,
          updateMouseCursor,
        })
      )
        return true;

      if (
        editState.focusObjectIndex === drawData.activeObjectIndex &&
        editState.focusEleType === EElementType.Circle
      ) {
        updateMouseCursor('pointer');
      }
      if (editState.focusEleType === EElementType.Circle) {
        // move point
        if (editState.startElementMovePoint) {
          setDrawData((s) => {
            if (
              s.activeObjectIndex > -1 &&
              editState.focusEleIndex > -1 &&
              editState.startElementMovePoint &&
              s.creatingObject?.keypoints?.points?.[editState.focusEleIndex]
            ) {
              const point =
                s.creatingObject?.keypoints?.points?.[editState.focusEleIndex];
              const { x: newX, y: newY } = movePoint(contentMouse);
              point.x = newX;
              point.y = newY;
            }
          });
          return true;
        }
      }
      return false;
    };

  const updateCreatingWhenMouseMove: ToolHooksFunc.UpdateCreatingWhenMouseMove =
    ({ object }) => {
      return !!object;
    };

  const finishEditingWhenMouseUp: ToolHooksFunc.FinishEditingWhenMouseUp = ({
    object,
  }) => {
    const isResizingOrMoving =
      editState.startRectResizeAnchor || editState.startElementMovePoint;
    if (isResizingOrMoving) {
      updateObject(object, drawData.activeObjectIndex);
    }

    if (drawData.AIAnnotation) {
      if (
        editState.startElementMovePoint &&
        (editState.startElementMovePoint.mousePoint?.x !==
          contentMouse.elementX ||
          editState.startElementMovePoint.mousePoint?.y !==
            contentMouse.elementY)
      ) {
        onAiAnnotation?.({ type: EObjectType.Skeleton, drawData });
      }
    }

    setEditState((s) => {
      s.startRectResizeAnchor = undefined;
      s.startElementMovePoint = undefined;
    });
    return true;
  };

  const finishCreatingWhenMouseUp: ToolHooksFunc.FinishCreatingWhenMouseUp = ({
    object,
  }) => {
    if (!object || !object.startPoint) return false;
    // Need to check if it can form a rectangle
    if (
      contentMouse.elementX === object.startPoint?.x ||
      contentMouse.elementY === object.startPoint?.y
    ) {
      setDrawData((s) => (s.creatingObject = undefined));
      return true;
    }
    const newRect = getRectFromPoints(
      object.startPoint,
      { x: contentMouse.elementX, y: contentMouse.elementY },
      {
        width: contentMouse.elementW,
        height: contentMouse.elementH,
      },
    );
    const { points, lines, pointColors, pointNames } = BODY_TEMPLATE;
    const pointObjs = translatePointsToPointObjs(
      points,
      pointNames,
      pointColors,
      naturalSize,
      clientSize,
    );
    const updatedObjs = getKeypointsFromRect(pointObjs, newRect);
    const newObject = {
      type: EObjectType.Skeleton,
      labelId: object.labelId,
      hidden: false,
      color: object.color,
      rect: { visible: true, ...newRect },
      keypoints: {
        points: updatedObjs,
        lines: lines,
      },
      conf: 1,
      status: EObjectStatus.Commited,
    };
    addObject(newObject);
    return true;
  };

  return {
    renderObject,
    renderCreatingObject,
    renderEditingObject,
    renderPrompt,
    startEditingWhenMouseDown,
    startCreatingWhenMouseDown,
    updateEditingWhenMouseMove,
    updateCreatingWhenMouseMove,
    finishEditingWhenMouseUp,
    finishCreatingWhenMouseUp,
  };
};

export default useSkeleton;
