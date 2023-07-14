import { drawCircleWithFill, drawLine, drawRect } from '@/utils/draw';
import {
  BODY_TEMPLATE,
  EElementType,
  KEYPOINTS_VISIBLE_TYPE,
  LABELS_STROKE_DASH,
} from '@/constants';
import {
  getKeypointsFromRect,
  getRectFromPoints,
  translatePointsToPointObjs,
  translateRectCoord,
} from '@/utils/compute';
import {
  ToolInstanceHook,
  ToolHooksFunc,
  renderRect,
  renderActiveRect,
} from './base';
import { changeRgbaOpacity, hexToRgba } from '@/utils/color';

const renderKeypoints = (
  canvas: HTMLCanvasElement,
  keypoints: {
    points: IElement<IPoint>[];
    lines: number[];
  },
  color: string,
  strokeAlpha: number,
) => {
  const { lines, points } = keypoints;

  // draw line
  for (let i = 0; i * 2 < lines.length; i++) {
    const [index1, index2] = [lines[i * 2], lines[i * 2 + 1]];
    if (
      points[index1].visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible &&
      points[index2].visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible
    ) {
      drawLine(
        canvas,
        points[index1],
        points[index2],
        hexToRgba(color, strokeAlpha),
        2,
        LABELS_STROKE_DASH[0],
      );
    }
  }

  // draw circle
  points.forEach((point) => {
    const { x, y, visible, color } = point;
    const fillColor = changeRgbaOpacity(
      color || 'rgba(255, 255, 255, 1)',
      strokeAlpha,
    );
    const strokeColor = `rgba(0, 0, 0, ${strokeAlpha})`;
    if (visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible) {
      drawCircleWithFill(canvas, { x, y }, 4, fillColor, 2, strokeColor);
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
}) => {
  const renderObject: ToolHooksFunc.RenderObject = ({
    object,
    color,
    strokeAlpha,
    fillAlpha,
  }) => {
    const { rect, keypoints } = object;
    if (rect && rect.visible) {
      renderRect(canvasRef.current!, rect, color, strokeAlpha, fillAlpha);
    }
    if (keypoints) {
      renderKeypoints(canvasRef.current!, keypoints, color, strokeAlpha);
    }
  };

  const renderCreatingObject: ToolHooksFunc.RenderCreatingObject = ({
    object,
    strokeColor,
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
      drawRect(activeCanvasRef.current, canvasCoordRect, strokeColor, 2);

      // draw circles
      updatedKeypoints.forEach((p) => {
        drawCircleWithFill(
          activeCanvasRef.current!,
          { x: p.x, y: p.y },
          4,
          strokeColor,
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
          strokeColor,
          2.5,
          LABELS_STROKE_DASH[0],
        );
      }
    }
  };

  const renderEditingObject: ToolHooksFunc.RenderEditingObject = ({
    object,
    color,
    strokeAlpha,
    fillAlpha,
    isFocus,
  }) => {
    const { rect, keypoints } = object;
    if (rect && rect.visible) {
      // editing
      renderRect(activeCanvasRef.current!, rect, color, strokeAlpha, fillAlpha);
      renderActiveRect(activeCanvasRef.current!, rect);
    }
    if (keypoints) {
      renderKeypoints(activeCanvasRef.current!, keypoints, color, strokeAlpha);

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

  return {
    renderObject,
    renderCreatingObject,
    renderEditingObject,
    renderPrompt,
  };
};

export default useSkeleton;
