import { EElementType, EObjectType, KEYPOINTS_VISIBLE_TYPE } from '@/constants';
import {
  DrawData,
  IAnnotationObject,
  MaskPromptItem,
} from '@/components/Edit/type';
import { DATA } from '@/services/type';
import { CursorState } from 'ahooks/lib/useMouse';
import { getCanvasPoint, getNaturalPoint } from './annotation';
import { rgbArrayToRgba, rgbaToRgbArray } from './color';
import { cloneDeep } from 'lodash';

/**
 * translate points to rect
 * @param startPoint
 * @param endPoint
 * @param canvasSize
 */
export const getRectFromPoints = (
  startPoint: IPoint,
  endPoint: IPoint,
  canvasSize: ISize,
): IRect => {
  const realEndPoint = {
    x:
      endPoint.x < 0
        ? 0
        : endPoint.x > canvasSize.width
        ? canvasSize.width
        : endPoint.x,
    y:
      endPoint.y < 0
        ? 0
        : endPoint.y > canvasSize.height
        ? canvasSize.height
        : endPoint.y,
  };
  return {
    x: Math.min(startPoint.x, realEndPoint.x),
    y: Math.min(startPoint.y, realEndPoint.y),
    width: Math.abs(startPoint.x - realEndPoint.x),
    height: Math.abs(startPoint.y - realEndPoint.y),
  };
};

/**
 * Calculate the polar coordinates of a set of points.
 * @param points
 * @returns
 */
export const getLimitCoordsFromPoints = (
  points: IPoint[],
): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
};

/**
 * Calculate the coordinates of a point after scaling transformation.
 * @param point
 * @param scaleX
 * @param scaleY
 * @returns
 */
export const getScaledPointCoord = (
  point: IPoint,
  scaleX: number,
  scaleY: number,
): IPoint => {
  return {
    x: scaleX * point.x,
    y: scaleY * point.y,
  };
};

/**
 * Calculate the coordinates of a point after translation transformation.
 * @param point
 * @param translateX
 * @param translateY
 * @returns
 */
export const getTranslatedPointCoord = (
  point: IPoint,
  translateX: number,
  translateY: number,
): IPoint => {
  return {
    x: point.x + translateX,
    y: point.y + translateY,
  };
};

/**
 * Calculate the position of a set of keypoint templates after coordinate transformation.
 * @param startPoint Must be inside the canvas.
 * @param endPoint Can be outside the canvas.
 * @param canvasSize
 */
export const getKeypointsFromRect = (
  points: IElement<IPoint>[],
  rect: IRect,
): IElement<IPoint>[] => {
  const { minX, minY, maxX, maxY } = getLimitCoordsFromPoints(points);
  const scaleX = rect.width / (maxX - minX);
  const scaleY = rect.height / (maxY - minY);

  const newPoints = points.map((point) => {
    const translatedPoint = getTranslatedPointCoord(point, -minX, -minY);
    const scaledPoint = getScaledPointCoord(translatedPoint, scaleX, scaleY);
    const updatedPoint = getTranslatedPointCoord(scaledPoint, rect.x, rect.y);
    return { ...point, ...updatedPoint };
  });

  return newPoints;
};

/**
 * translate rect to bounding box
 * @param rect
 * @param size
 * @returns
 */
export const translateRectToBoundingBox = (
  rect: IRect,
  size: ISize,
): IBoundingBox => ({
  xmin: rect.x / size.width,
  ymin: rect.y / size.height,
  xmax: (rect.x + rect.width) / size.width,
  ymax: (rect.y + rect.height) / size.height,
});

export const translateRectToAbsBbox = (rect: IRect): IBoundingBox => ({
  xmin: rect.x,
  ymin: rect.y,
  xmax: rect.x + rect.width,
  ymax: rect.y + rect.height,
});

/**
 * zoom rect size
 * @param rect
 * @param size
 * @returns
 */
export const translateRectZoom = (
  rect: IRect,
  fromSize: ISize,
  toSize: ISize,
): IRect => ({
  x: (rect.x * toSize.width) / fromSize.width,
  y: (rect.y * toSize.height) / fromSize.height,
  width: (rect.width * toSize.width) / fromSize.width,
  height: (rect.height * toSize.height) / fromSize.height,
});

/**
 * zoom point size
 * @param point
 * @param size
 * @returns
 */
export const translatePointZoom = (
  point: IPoint,
  formSize: ISize,
  toSize: ISize,
): IPoint => ({
  x: (point.x * toSize.width) / formSize.width,
  y: (point.y * toSize.height) / formSize.height,
});

/**
 * transtlate bounding box to rect
 * @param box
 * @param size
 * @returns
 */
export const translateBoundingBoxToRect = (
  box: IBoundingBox,
  size: ISize,
): IRect => ({
  x: box.xmin * size.width,
  y: box.ymin * size.height,
  width: (box.xmax - box.xmin) * size.width,
  height: (box.ymax - box.ymin) * size.height,
});

export const translateAbsBBoxToRect = (box: IBoundingBox): IRect => ({
  x: box.xmin,
  y: box.ymin,
  width: box.xmax - box.xmin,
  height: box.ymax - box.ymin,
});

/**
 * format points
 * @param box
 * @param size
 * @returns
 */
export const translatePointsToPointObjs = (
  points: number[],
  pointNames: string[],
  pointColors: string[],
  naturalSize: ISize,
  clientSize: ISize,
): IElement<IPoint>[] => {
  const pointList = [];
  for (let i = 0; i * 6 < points.length; i++) {
    const { x, y } = getCanvasPoint(
      [points[i * 6], points[i * 6 + 1]],
      naturalSize,
      clientSize,
    );
    const color = rgbArrayToRgba(pointColors.slice(i * 3, i * 3 + 3), 1);
    const point = {
      x,
      y,
      visible: points[i * 6 + 4],
      color,
      name: pointNames[i],
    };
    pointList.push(point);
  }
  return pointList;
};

export const translatePointObjsToPointAttrs = (
  pointObjs: IElement<IPoint>[],
  naturalSize: ISize,
  clientSize: ISize,
): {
  points: number[];
  pointNames: string[];
  pointColors: string[];
} => {
  const points = [];
  const pointNames = [];
  const pointColors = [];

  for (let i = 0; i < pointObjs.length; i++) {
    const point = pointObjs[i];
    const { x, y } = point;
    const rgb = rgbaToRgbArray(point.color!);
    const naturalPoint = getNaturalPoint([x, y], naturalSize, clientSize);
    points.push(naturalPoint.x, naturalPoint.y, 0, 1, point.visible, 1);
    pointNames.push(point.name!);
    pointColors.push(rgb[0] || '255', rgb[1] || '255', rgb[2] || '255');
  }

  return {
    points,
    pointNames,
    pointColors,
  };
};

/**
 * Determine if two rects are the same.（Only compare the decimal places after the second digit）
 * @param aRect
 * @param bRect
 * @returns
 */
export const isEqualRect = (aRect: IRect, bRect: IRect): boolean => {
  return (
    Object.keys(aRect).findIndex(
      (key) =>
        aRect[key as keyof IRect].toFixed(2) !==
        bRect[key as keyof IRect].toFixed(2),
    ) < 0
  );
};

/**
 * Whether it is inside the canvas.
 * @param mouse
 * @returns
 */
export const isInCanvas = (mouse: CursorState): boolean =>
  mouse.elementX >= 0 &&
  mouse.elementX <= mouse.elementW &&
  mouse.elementY >= 0 &&
  mouse.elementY <= mouse.elementH;

/**
 * Expand / shrink rect
 * @param rect
 * @param delta
 * @returns
 */
export const expandRect = (rect: IRect, delta: IPoint): IRect => {
  return {
    x: rect.x - delta.x,
    y: rect.y - delta.y,
    width: rect.width + 2 * delta.x,
    height: rect.height + 2 * delta.y,
  };
};

export const expandPointToCircle = (point: IPoint, radius: number): ICircle => {
  return {
    ...point,
    radius,
  };
};

function crossProduct(p1: IPoint, p2: IPoint, p3: IPoint) {
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v2 = { x: p3.x - p1.x, y: p3.y - p1.y };
  return v1.x * v2.y - v1.y * v2.x;
}

/**
 * Determine if a point is inside a shape.
 * @param shape
 * @param point
 * @param type
 * @returns
 */
export const isPointInside = (
  shape: IRect | ICircle | IPolygon,
  point: IPoint,
  type: EElementType,
): boolean => {
  if (!shape || !point) return false;
  switch (type) {
    case EElementType.Rect: {
      const rect = shape as IRect;
      return (
        rect.x <= point.x &&
        rect.x + rect.width >= point.x &&
        rect.y <= point.y &&
        rect.y + rect.height >= point.y
      );
    }
    case EElementType.Circle: {
      const circle = shape as ICircle;
      return (
        Math.sqrt(
          Math.pow(point.x - circle.x, 2) + Math.pow(point.y - circle.y, 2),
        ) <= circle.radius
      );
    }
    case EElementType.Polygon: {
      const polygon = shape as IPolygon;
      // Divide a polygon into several triangles.
      for (let i = 1; i < polygon.length - 1; i++) {
        // Calculate the cross product of the three vertices of a triangle and point P.
        const cross1 = crossProduct(polygon[0], polygon[i], point);
        const cross2 = crossProduct(polygon[i], polygon[i + 1], point);
        const cross3 = crossProduct(polygon[i + 1], polygon[0], point);
        // If the signs of all three cross products are the same, then the point is inside the triangle.
        if (cross1 * cross2 > 0 && cross1 * cross3 > 0) {
          return true;
        }
      }
      return false;
    }
    default:
      return false;
  }
};

// const isPointInsideRect = (rect: IRect, mouse: CursorState): boolean => {
//   const outerRect = expandRect(rect, { x: 8, y: 8 });
//   const innerRect = expandRect(rect, { x: -8, y: -8 });
//   const point = { x: mouse.elementX, y: mouse.elementY };
//   return (
//     isPointInside(outerRect, point, EElementType.Rect) &&
//     !isPointInside(innerRect, point, EElementType.Rect)
//   );
// };

export const isPointOnPoint = (
  point: IPoint,
  mouse: CursorState,
  redius: number = 5,
): boolean => {
  const circle = expandPointToCircle(point, redius);
  const focusPoint = { x: mouse.elementX, y: mouse.elementY };
  return isPointInside(circle, focusPoint, EElementType.Circle);
};

const isPointOnLine = (line: ILine, mouse: CursorState): boolean => {
  const { elementX: x, elementY: y } = mouse;
  const distanceFromStart = Math.sqrt(
    Math.pow(x - line.start.x, 2) + Math.pow(y - line.start.y, 2),
  );
  const distanceFromEnd = Math.sqrt(
    Math.pow(x - line.end.x, 2) + Math.pow(y - line.end.y, 2),
  );
  const lineLength = Math.sqrt(
    Math.pow(line.end.x - line.start.x, 2) +
      Math.pow(line.end.y - line.start.y, 2),
  );
  const buffer = 0.75;
  return (
    distanceFromStart + distanceFromEnd >= lineLength - buffer &&
    distanceFromStart + distanceFromEnd <= lineLength + buffer
  );
};

export const getLimitRectFromPoints = (points: IPoint[]): IRect => {
  const { maxX, minX, maxY, minY } = getLimitCoordsFromPoints(points);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const getLinesFromPolygon = (polygon: IPolygon): ILine[] => {
  const lines: ILine[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const startPoint = polygon[i];
    const endPoint = polygon[(i + 1) % polygon.length];
    lines.push({ start: startPoint, end: endPoint });
  }
  return lines;
};

export const judgeFocusOnSingleObject = (
  mouse: CursorState,
  object: IAnnotationObject,
  clientSize?: ISize,
): boolean => {
  if (object.hidden) {
    return false;
  }

  const mousePoint = {
    x: mouse.elementX,
    y: mouse.elementY,
  };

  switch (object.type) {
    case EObjectType.Rectangle: {
      if (
        object.rect &&
        isPointInside(
          expandRect(object.rect, { x: 8, y: 8 }),
          mousePoint,
          EElementType.Rect,
        )
      ) {
        return true;
      }
      break;
    }
    case EObjectType.Polygon: {
      if (object.polygon) {
        const { group } = object.polygon!;
        const isInside = group.some((polygon) =>
          isPointInside(polygon, mousePoint, EElementType.Polygon),
        );
        if (isInside) return true;
        const isInsidePoints = group.some((polygon) => {
          return polygon.some((point) => {
            return isPointOnPoint(point, mouse);
          });
        });
        if (isInsidePoints) return true;
        const isOnLines = group.some((polygon) => {
          const lines = getLinesFromPolygon(polygon);
          return lines.some((line) => {
            return isPointOnLine(line, mouse);
          });
        });
        if (isOnLines) return true;
      }
      break;
    }
    case EObjectType.Skeleton: {
      if (object.keypoints?.points) {
        const validPoints = object.keypoints?.points.filter(
          (point) => point.visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible,
        );
        const limitRect = getLimitRectFromPoints(validPoints);
        const isInside = isPointInside(
          limitRect,
          mousePoint,
          EElementType.Rect,
        );
        if (isInside) return true;
      }
      if (object.rect) {
        if (isPointInside(object.rect, mousePoint, EElementType.Rect)) {
          return true;
        }
      }
      break;
    }
    case EObjectType.Custom: {
      if (object.keypoints?.points) {
        const validPoints = object.keypoints?.points.filter(
          (point) => point.visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible,
        );
        const limitRect = getLimitRectFromPoints(validPoints);
        const isInside = isPointInside(
          limitRect,
          mousePoint,
          EElementType.Rect,
        );
        if (isInside) {
          return true;
        }
      }
      if (object.polygon) {
        const { group } = object.polygon;
        const isInside = group.some((polygon) =>
          isPointInside(polygon, mousePoint, EElementType.Polygon),
        );
        if (isInside) {
          return true;
        }
      }
      if (object.rect) {
        if (isPointInside(object.rect, mousePoint, EElementType.Rect)) {
          return true;
        }
      }
      break;
    }
    case EObjectType.Mask: {
      if (object.maskCanvasElement) {
        const tempCtx = object.maskCanvasElement.getContext('2d');
        if (!tempCtx || !clientSize) break;

        // get target pixel data
        const pixelData = tempCtx.getImageData(
          (mousePoint.x * object.maskCanvasElement.width) / clientSize.width,
          (mousePoint.y * object.maskCanvasElement.height) / clientSize.height,
          1,
          1,
        ).data;
        if (pixelData[3] > 0) {
          return true;
        }
      }
      break;
    }
  }
  return false;
};

export const judgeFocusOnElement = (
  mouse: CursorState,
  object: IAnnotationObject,
): {
  focusEleIndex: number;
  focusEleType: EElementType;
  focusPolygonInfo: {
    index: number;
    pointIndex: number;
    lineIndex: number;
  };
} => {
  let focusEleType = EElementType.None;
  let focusEleIndex = -1;
  let focusPolygonInfo = {
    index: -1,
    pointIndex: -1,
    lineIndex: -1,
  };

  if (!isInCanvas(mouse) || object.hidden) {
    return { focusEleType, focusEleIndex, focusPolygonInfo };
  }

  if (object.keypoints?.points) {
    const { points } = object.keypoints;
    for (let j = 0; j < points.length; j++) {
      const { visible, x, y } = points[j];
      if (
        visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible &&
        isPointOnPoint({ x, y }, mouse)
      ) {
        focusEleType = EElementType.Circle;
        focusEleIndex = j;

        return { focusEleType, focusEleIndex, focusPolygonInfo };
      }
    }
  }

  if (object.polygon && object.polygon.visible) {
    const { group } = object.polygon;
    // find point in polygon
    for (let i = 0; i < group.length; i++) {
      const pointIndex = group[i].findIndex((point) => {
        return isPointOnPoint(point, mouse);
      });
      if (pointIndex > -1) {
        focusPolygonInfo.index = i;
        focusPolygonInfo.pointIndex = pointIndex;
        return {
          focusEleType: EElementType.Polygon,
          focusEleIndex: 0,
          focusPolygonInfo,
        };
      }
    }
    // find line in polygon
    for (let i = 0; i < group.length; i++) {
      const lines = getLinesFromPolygon(group[i]);
      const lineIndex = lines.findIndex((line) => isPointOnLine(line, mouse));
      if (lineIndex > -1) {
        focusPolygonInfo.index = i;
        focusPolygonInfo.lineIndex = lineIndex;
        return {
          focusEleType: EElementType.Polygon,
          focusEleIndex: 0,
          focusPolygonInfo,
        };
      }
    }
    const polygonIdx = group.findIndex((polygon) =>
      isPointInside(
        polygon,
        {
          x: mouse.elementX,
          y: mouse.elementY,
        },
        EElementType.Polygon,
      ),
    );
    if (polygonIdx > -1) {
      focusPolygonInfo.index = polygonIdx;
      return {
        focusEleType: EElementType.Polygon,
        focusEleIndex: 0,
        focusPolygonInfo,
      };
    }
  }

  if (
    object.rect &&
    isPointInside(
      expandRect(object.rect, { x: 8, y: 8 }),
      {
        x: mouse.elementX,
        y: mouse.elementY,
      },
      EElementType.Rect,
    )
  ) {
    focusEleType = EElementType.Rect;
    focusEleIndex = 0;
    return { focusEleType, focusEleIndex, focusPolygonInfo };
  }

  return { focusEleType, focusEleIndex, focusPolygonInfo };
};

export const judgeFocusOnObject = (
  clientSize: ISize,
  mouse: CursorState,
  activeObjectIndex: number,
  objects: IAnnotationObject[],
): number => {
  if (!isInCanvas(mouse)) {
    return -1;
  }

  // Judge focus on active object.
  if (
    objects[activeObjectIndex] &&
    judgeFocusOnSingleObject(mouse, objects[activeObjectIndex], clientSize)
  ) {
    return activeObjectIndex;
  }

  // Find the topmost instance by searching the objectList in reverse order.
  for (let index = objects.length - 1; index >= 0; index--) {
    if (judgeFocusOnSingleObject(mouse, objects[index], clientSize)) {
      return index;
    }
  }

  return -1;
};

export enum Direction {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP_RIGHT = 'TOP_RIGHT',
  TOP_LEFT = 'TOP_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  CENTER = 'CENTER',
}

export interface RectAnchor {
  type: Direction;
  position: IPoint;
}

const setValueBetweenPixels = (value: number): number => {
  return Math.floor(value) + 0.5;
};

const setPointBetweenPixels = (point: IPoint): IPoint => {
  return {
    x: setValueBetweenPixels(point.x),
    y: setValueBetweenPixels(point.y),
  };
};

export const setRectBetweenPixels = (rect: IRect): IRect => {
  const topLeft: IPoint = {
    x: rect.x,
    y: rect.y,
  };
  const bottomRight: IPoint = {
    x: rect.x + rect.width,
    y: rect.y + rect.height,
  };
  const topLeftBetweenPixels = setPointBetweenPixels(topLeft);
  const bottomRightBetweenPixels = setPointBetweenPixels(bottomRight);
  return {
    x: topLeftBetweenPixels.x,
    y: topLeftBetweenPixels.y,
    width: bottomRightBetweenPixels.x - topLeftBetweenPixels.x,
    height: bottomRightBetweenPixels.y - topLeftBetweenPixels.y,
  };
};

export const mapRectToAnchors = (rect: IRect): RectAnchor[] => {
  return [
    { type: Direction.TOP_LEFT, position: { x: rect.x, y: rect.y } },
    {
      type: Direction.TOP,
      position: { x: rect.x + 0.5 * rect.width, y: rect.y },
    },
    {
      type: Direction.TOP_RIGHT,
      position: { x: rect.x + rect.width, y: rect.y },
    },
    {
      type: Direction.LEFT,
      position: { x: rect.x, y: rect.y + 0.5 * rect.height },
    },
    {
      type: Direction.RIGHT,
      position: { x: rect.x + rect.width, y: rect.y + 0.5 * rect.height },
    },
    {
      type: Direction.BOTTOM_LEFT,
      position: { x: rect.x, y: rect.y + rect.height },
    },
    {
      type: Direction.BOTTOM,
      position: { x: rect.x + 0.5 * rect.width, y: rect.y + rect.height },
    },
    {
      type: Direction.BOTTOM_RIGHT,
      position: { x: rect.x + rect.width, y: rect.y + rect.height },
    },
  ];
};

export const getRectWithCenterAndSize = (
  centerPoint: IPoint,
  size: ISize,
): IRect => {
  return {
    x: centerPoint.x - 0.5 * size.width,
    y: centerPoint.y - 0.5 * size.height,
    ...size,
  };
};

export const getAnchorUnderMouseByRect = (
  rect: IRect,
  mousePosition: IPoint,
): RectAnchor | null => {
  const rectAnchors: RectAnchor[] = mapRectToAnchors(rect);
  for (let i = 0; i < rectAnchors.length; i++) {
    const anchorRect: IRect = getRectWithCenterAndSize(
      rectAnchors[i].position,
      { width: 16, height: 16 },
    );
    if (
      !!mousePosition &&
      isPointInside(anchorRect, mousePosition, EElementType.Rect)
    ) {
      return rectAnchors[i];
    }
  }
  return null;
};

export const getAnchorFixRectPoint = (
  rect: IRect,
  direction: Direction,
): IPoint => {
  switch (direction) {
    case Direction.RIGHT:
    case Direction.BOTTOM:
    case Direction.BOTTOM_RIGHT:
      return { x: rect.x, y: rect.y };
    case Direction.LEFT:
    case Direction.TOP:
    case Direction.TOP_LEFT:
      return { x: rect.x + rect.width, y: rect.y + rect.height };
    case Direction.BOTTOM_LEFT:
      return { x: rect.x + rect.width, y: rect.y };
    case Direction.TOP_RIGHT:
      return { x: rect.x, y: rect.y + rect.height };
  }
  return { x: rect.x, y: rect.y };
};

export const resizeRect = (
  rect: IRect,
  anchor: RectAnchor,
  mouse: CursorState,
): IRect => {
  const { type, position } = anchor;
  const limitMouseX =
    mouse.elementX < 0
      ? 0
      : mouse.elementX > mouse.elementW
      ? mouse.elementW
      : mouse.elementX;
  const limitMouseY =
    mouse.elementY < 0
      ? 0
      : mouse.elementY > mouse.elementH
      ? mouse.elementH
      : mouse.elementY;
  const endPoint = { x: limitMouseX, y: limitMouseY };
  switch (type) {
    case Direction.RIGHT:
      endPoint.y = rect.y + rect.height;
      break;
    case Direction.BOTTOM:
      endPoint.x = rect.x + rect.width;
      break;
    case Direction.LEFT:
      endPoint.y = rect.y;
      break;
    case Direction.TOP:
      endPoint.x = rect.x;
      break;
  }
  return getRectFromPoints(position, endPoint, {
    width: mouse.elementW,
    height: mouse.elementH,
  });
};

export const moveRect = (
  rect: IRect,
  startPoints: { topLeftPoint: IPoint; mousePoint: IPoint },
  mouse: CursorState,
): IRect => {
  const { width, height } = rect;
  const { topLeftPoint, mousePoint } = startPoints;
  const offsetX = mouse.elementX - mousePoint.x;
  const offsetY = mouse.elementY - mousePoint.y;
  const x = topLeftPoint.x + offsetX;
  const y = topLeftPoint.y + offsetY;

  return {
    x: x < 0 ? 0 : x + width > mouse.elementW ? mouse.elementW - width : x,
    y: y < 0 ? 0 : y + height > mouse.elementH ? mouse.elementH - height : y,
    width,
    height,
  };
};

export const movePolygon = (
  polygon: IPolygon,
  startPoints: { mousePoint: IPoint },
  mouse: CursorState,
): IPolygon => {
  const { mousePoint } = startPoints;
  const { elementX, elementY, elementW, elementH } = mouse;
  const { minX, minY, maxX, maxY } = getLimitCoordsFromPoints(polygon);
  let offsetX = elementX - mousePoint.x;
  let offsetY = elementY - mousePoint.y;
  offsetX =
    offsetX + maxX > elementW
      ? elementW - maxX
      : offsetX + minX < 0
      ? 0
      : offsetX;
  offsetY =
    offsetY + maxY > elementH
      ? elementH - maxY
      : offsetY + minY < 0
      ? 0
      : offsetY;
  const newPolygon = polygon.map((point) => ({
    x: point.x + offsetX,
    y: point.y + offsetY,
  }));
  return newPolygon;
};

export const movePoint = (mouse: CursorState): IPoint => {
  const { elementX, elementY } = mouse;
  return {
    x: elementX < 0 ? 0 : elementX > mouse.elementW ? mouse.elementW : elementX,
    y: elementY < 0 ? 0 : elementY > mouse.elementH ? mouse.elementH : elementY,
  };
};

// TODO: How to confirm ObjectType
export const getObjectType = (obj: IAnnotationObject): EObjectType => {
  if (obj.rect && !obj.keypoints && !obj.polygon) {
    return EObjectType.Rectangle;
  } else if (obj.polygon && !obj.keypoints && !obj.rect) {
    return EObjectType.Polygon;
  } else if (obj.keypoints && !obj.polygon) {
    return EObjectType.Skeleton;
  } else if (obj.maskRle) {
    return EObjectType.Mask;
  }
  return EObjectType.Custom;
};

export const translatePolygonsToSegmentation = (
  polygons: IElement<IPolygonGroup>,
  naturalSize: ISize,
  clientSize: ISize,
): string => {
  const arr = polygons.group.map((polygon) => {
    return polygon.reduce((acc: number[], point: IPoint) => {
      const { x, y } = point;
      const naturalPoint = getNaturalPoint([x, y], naturalSize, clientSize);
      return acc.concat([naturalPoint.x, naturalPoint.y]);
    }, []);
  });

  const res =
    arr
      .map((polygon) => {
        return polygon.join(',');
      })
      .join('/') || '';

  return res;
};

export const isValidBBox = (bbox: IBoundingBox) => {
  if (
    bbox.xmax === undefined ||
    bbox.ymax === undefined ||
    bbox.xmin === undefined ||
    bbox.ymin === undefined
  ) {
    return false;
  }
  if (
    bbox.xmax === 0 &&
    bbox.xmin === 0 &&
    bbox.ymin === 0 &&
    bbox.ymax === 0
  ) {
    return false;
  }
  return true;
};

export const translateObjectsToAnnotations = (
  objectList: IAnnotationObject[],
  naturalSize: ISize,
  clientSize: ISize,
  needNormalizeBbox: boolean = true,
): DATA.BaseObject[] => {
  const annotations = objectList.map((obj) => {
    const { label, rect, keypoints, polygon, maskRle } = obj;
    const annoObj = {
      categoryName: label,
    };
    if (rect) {
      Object.assign(annoObj, {
        boundingBox: needNormalizeBbox
          ? translateRectToBoundingBox(rect, clientSize)
          : translateRectToAbsBbox(rect),
      });
    } else {
      Object.assign(annoObj, {
        boundingBox: {
          xmin: 0,
          xmax: 0,
          ymin: 0,
          ymax: 0,
        },
      });
    }
    if (keypoints) {
      Object.assign(annoObj, {
        lines: keypoints.lines,
        ...translatePointObjsToPointAttrs(
          keypoints.points,
          naturalSize,
          clientSize,
        ),
      });
    }
    if (polygon) {
      const segmentation = translatePolygonsToSegmentation(
        polygon,
        naturalSize,
        clientSize,
      );
      Object.assign(annoObj, {
        segmentation,
      });
    }
    if (maskRle) {
      Object.assign(annoObj, {
        maskRle,
      });
    }
    return annoObj;
  });

  return annotations;
};

export const getClosestPointOnLineSegment = (
  point: IPoint,
  lineStart: IPoint,
  lineEnd: IPoint,
) => {
  const ap = { x: point.x - lineStart.x, y: point.y - lineStart.y };
  const ab = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y };
  const ab2: number = ab.x * ab.x + ab.y * ab.y;
  const ap_ab: number = ap.x * ab.x + ap.y * ab.y;
  let t: number = ap_ab / ab2;
  if (t < 0 || isNaN(t)) {
    t = 0;
  } else if (t > 1) {
    t = 1;
  }
  return { x: lineStart.x + ab.x * t, y: lineStart.y + ab.y * t };
};

export const getMidPointFromTwoPoints = (p1: IPoint, p2: IPoint): IPoint => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

/**
 * Get the corner points, edge midpoints, and center point of a rectangle.
 */
export const getReferencePointsFromRect = (rect: IRect): IPoint[] => {
  const { x, y, width, height } = rect;

  const topLeft: IPoint = { x, y };
  const topRight: IPoint = { x: x + width, y };
  const bottomLeft: IPoint = { x, y: y + height };
  const bottomRight: IPoint = { x: x + width, y: y + height };

  const topMidpoint: IPoint = { x: x + width / 2, y };
  const bottomMidpoint: IPoint = { x: x + width / 2, y: y + height };
  const leftMidpoint: IPoint = { x, y: y + height / 2 };
  const rightMidpoint: IPoint = { x: x + width, y: y + height / 2 };

  const center: IPoint = { x: x + width / 2, y: y + height / 2 };

  return [
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    topMidpoint,
    bottomMidpoint,
    leftMidpoint,
    rightMidpoint,
    center,
  ];
};

/**
 * Determine if polygon p1 is surrounded by p2.
 * @param p1
 * @param p2
 * @returns
 */
export const isPolygonInsidePolygon = (p1: IPolygon, p2: IPolygon) => {
  const box1 = getLimitCoordsFromPoints(p1);
  const box2 = getLimitCoordsFromPoints(p2);
  if (
    box2.minX >= box1.maxX ||
    box2.maxX <= box1.minX ||
    box2.minY >= box1.maxY ||
    box2.maxY <= box1.minY
  ) {
    return false;
  }
  for (const point of p1) {
    if (!isPointInside(p2, point, EElementType.Polygon)) {
      return false;
    }
  }
  return true;
};

/**
 * Find the polygons in a set of polygons that are completely surrounded and return their indexs.
 * @param polygons
 * @returns
 */
export const getInnerPolygonIndexFromGroup = (
  polygons: IPolygon[],
): number[] => {
  const innerPolygonIdx: number[] = [];
  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    let isInnerPolygon = false;
    for (let j = 0; j < polygons.length; j++) {
      if (i !== j && isPolygonInsidePolygon(polygon, polygons[j])) {
        isInnerPolygon = true;
        break;
      }
    }
    if (isInnerPolygon) {
      innerPolygonIdx.push(i);
    }
  }
  return innerPolygonIdx;
};

export const calculatePolygonArea = (vertices: [number, number][]): number => {
  const n = vertices.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
};

export const convertToVerticesArray = (
  numbers: number[],
): [number, number][] => {
  const vertices: [number, number][] = [];

  for (let i = 0; i < numbers.length; i += 2) {
    const x = numbers[i];
    const y = numbers[i + 1];
    vertices.push([x, y]);
  }

  return vertices;
};

export const translateRectCoord = (
  rect: IRect,
  newCoordOrigin: IPoint,
): IRect => {
  return {
    ...rect,
    x: rect.x - newCoordOrigin.x,
    y: rect.y - newCoordOrigin.y,
  };
};

export const translatePolygonCoord = (
  polygon: IPolygon,
  newCoordOrigin: IPoint,
): IPolygon => {
  return polygon.map((point) => {
    return {
      x: point.x - newCoordOrigin.x,
      y: point.y - newCoordOrigin.y,
    };
  });
};

export const translatePointCoord = (
  point: IPoint,
  newCoordOrigin: IPoint,
): IPoint => {
  return {
    x: point.x - newCoordOrigin.x,
    y: point.y - newCoordOrigin.y,
  };
};

export const translateAnnotCoord = (
  annoObj: IAnnotationObject,
  newCoordOrigin: IPoint,
): IAnnotationObject => {
  const { rect, polygon, keypoints } = annoObj;
  const newAnnoObj = { ...annoObj };

  if (rect) {
    newAnnoObj.rect = {
      ...rect,
      ...translateRectCoord(rect, newCoordOrigin),
    };
  }

  if (polygon) {
    const newGroup = polygon.group.map((polyItem) => {
      return translatePolygonCoord(polyItem, newCoordOrigin);
    });
    newAnnoObj.polygon = {
      ...polygon,
      group: newGroup,
    };
  }

  if (keypoints) {
    const newPoints = keypoints.points.map((point) => {
      return {
        ...point,
        ...translatePointCoord(point, newCoordOrigin),
      };
    });
    newAnnoObj.keypoints = {
      ...keypoints,
      points: newPoints,
    };
  }

  return newAnnoObj;
};

/**
 * Scale obj to curSize
 * @param obj
 * @param preSize
 * @param curSize
 * @returns
 */
export const scaleObject = (
  obj: IAnnotationObject,
  preSize: ISize,
  curSize: ISize,
) => {
  const newObj = { ...obj };

  if (newObj.rect) {
    const newRect = translateRectZoom(newObj.rect, preSize, curSize);
    newObj.rect = { ...newObj.rect, ...newRect };
  }
  if (newObj.keypoints) {
    const { points, lines } = newObj.keypoints;
    const newPoints = points.map((point) => {
      const newPoint = translatePointZoom(point, preSize, curSize);
      return { ...point, ...newPoint };
    });
    newObj.keypoints = { points: newPoints, lines };
  }
  if (newObj.polygon) {
    const newGroups = newObj.polygon.group.map((polygon) => {
      return polygon.map((point) => {
        return translatePointZoom(point, preSize, curSize);
      });
    });
    newObj.polygon = { ...newObj.polygon, group: newGroups };
  }
  return newObj;
};

const scalePromptItem = (
  promptItem: MaskPromptItem,
  preSize: ISize,
  curSize: ISize,
): MaskPromptItem => {
  const { point, startPoint, rect, stroke } = promptItem;
  const scaledPromptItem = { ...promptItem };
  if (point) {
    Object.assign(scaledPromptItem, {
      point: translatePointZoom(point, preSize, curSize),
    });
  }
  if (startPoint) {
    Object.assign(scaledPromptItem, {
      startPoint: translatePointZoom(startPoint, preSize, curSize),
    });
  }
  if (rect) {
    Object.assign(scaledPromptItem, {
      rect: translateRectZoom(rect, preSize, curSize),
    });
  }
  if (stroke) {
    Object.assign(scaledPromptItem, {
      stroke: stroke.map((point) => {
        return translatePointZoom(point, preSize, curSize);
      }),
    });
  }
  return scaledPromptItem;
};

/**
 * Scale draw data
 * @param preSize
 * @param curSize
 */
export const scaleDrawData = (
  theDrawData: DrawData,
  preSize: ISize,
  curSize: ISize,
) => {
  const updateDrawData = cloneDeep(theDrawData);
  updateDrawData.objectList = updateDrawData.objectList.map((obj) => {
    return scaleObject(obj, preSize, curSize);
  });

  if (updateDrawData.creatingObject) {
    updateDrawData.creatingObject = scaleObject(
      updateDrawData.creatingObject,
      preSize,
      curSize,
    );
    if (updateDrawData.creatingObject.startPoint) {
      updateDrawData.creatingObject.startPoint = translatePointZoom(
        updateDrawData.creatingObject.startPoint,
        preSize,
        curSize,
      );
    }
    if (updateDrawData.creatingObject.maskStep) {
      const newPoints = updateDrawData.creatingObject.maskStep.points.map(
        (point) => {
          return translatePointZoom(point, preSize, curSize);
        },
      );
      updateDrawData.creatingObject = {
        ...updateDrawData.creatingObject,
        maskStep: {
          ...updateDrawData.creatingObject.maskStep,
          points: newPoints,
        },
      };
    }
    if (updateDrawData.creatingObject.tempMaskSteps) {
      const newSteps = updateDrawData.creatingObject.tempMaskSteps.map(
        (step) => {
          return {
            ...step,
            points: step.points.map((point) =>
              translatePointZoom(point, preSize, curSize),
            ),
          };
        },
      );
      updateDrawData.creatingObject = {
        ...updateDrawData.creatingObject,
        tempMaskSteps: newSteps,
      };
    }
  }

  if (updateDrawData.prompt.segmentationClicks) {
    updateDrawData.prompt.segmentationClicks =
      updateDrawData.prompt.segmentationClicks.map((click) => {
        if (click.point) {
          const newPoint = translatePointZoom(click.point, preSize, curSize);
          return {
            ...click,
            point: newPoint,
          };
        }
        return click;
      });
  }

  if (updateDrawData.prompt.creatingMask) {
    updateDrawData.prompt.creatingMask = scalePromptItem(
      updateDrawData.prompt.creatingMask,
      preSize,
      curSize,
    );
  }

  if (updateDrawData.prompt.maskPrompts) {
    updateDrawData.prompt.maskPrompts = updateDrawData.prompt.maskPrompts?.map(
      (item) => {
        return scalePromptItem(item, preSize, curSize);
      },
    );
  }

  if (updateDrawData.prompt.activeRectWhileLoading) {
    updateDrawData.prompt.activeRectWhileLoading = translateRectZoom(
      updateDrawData.prompt.activeRectWhileLoading,
      preSize,
      curSize,
    );
  }

  return updateDrawData;
};

export const getVisibleAreaForImage = (
  imagePos: IPoint,
  clientSize: ISize,
  containerMouse: CursorState,
) => {
  const { x: imageX, y: imageY } = imagePos;
  const { width: imageWidth, height: imageHeight } = clientSize;
  const { elementW: containerWidth, elementH: containerHeight } =
    containerMouse;

  if (
    imageX > containerWidth ||
    imageY > containerHeight ||
    imageX + imageWidth <= 0 ||
    imageY + imageHeight <= 0
  ) {
    return {
      xmin: 0,
      ymin: 0,
      xmax: 0,
      ymax: 0,
    };
  }

  const leftTopPoint = {
    x: Math.max(0, imageX),
    y: Math.max(0, imageY),
  };
  const rightBottonPoint = {
    x: Math.min(imageX + imageWidth, containerWidth),
    y: Math.min(imageY + imageHeight, containerHeight),
  };

  const newCoordOrigin = {
    x: imagePos.x,
    y: imagePos.y,
  };
  const { x: xmin, y: ymin } = translatePointCoord(
    leftTopPoint,
    newCoordOrigin,
  );
  const { x: xmax, y: ymax } = translatePointCoord(
    rightBottonPoint,
    newCoordOrigin,
  );

  return {
    xmin,
    ymin,
    xmax,
    ymax,
  };
};
