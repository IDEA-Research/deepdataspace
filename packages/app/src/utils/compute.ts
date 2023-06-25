import { EElementType, EObjectType, KEYPOINTS_VISIBLE_TYPE } from '@/constants';
import { IAnnotationObject } from '@/components/Edit';
import { DATA } from '@/services/type';
import { CursorState } from 'ahooks/lib/useMouse';
import {
  getCanvasPoint,
  getNaturalPoint,
  getSegmentationPoints,
} from './annotation';
import { rgbArrayToRgba, rgbaToRgbArray } from './color';

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
  const buffer = 5;
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

export const judgeFocusOnElement = (
  mouse: CursorState,
  object: IAnnotationObject,
): {
  focusEleIndex: number;
  focusEleType: EElementType;
} => {
  let focusEleType = EElementType.Rect;
  let focusEleIndex = -1;

  if (!isInCanvas(mouse) || object.hidden) {
    return { focusEleType, focusEleIndex };
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

        return { focusEleType, focusEleIndex };
      }
    }
  }

  if (object.polygon && object.polygon.visible) {
    const { group } = object.polygon;
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
      const pointFocusIdx = group[polygonIdx].findIndex((point) => {
        return isPointOnPoint(point, mouse);
      });
      if (pointFocusIdx > -1) {
        focusEleIndex = 0;
        focusEleType = EElementType.Circle;
      }
      focusEleType = EElementType.Polygon;
      focusEleIndex = 0;
      return { focusEleType, focusEleIndex };
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
    return { focusEleType, focusEleIndex };
  }

  return { focusEleType, focusEleIndex };
};

export const judgeFocusOnObject = (
  mouse: CursorState,
  objects: IAnnotationObject[],
): number => {
  let focusObjIndex = -1;

  if (!isInCanvas(mouse)) {
    return focusObjIndex;
  }

  // Find the topmost instance by searching the objectList in reverse order.
  for (let index = objects.length - 1; index >= 0; index--) {
    const object = objects[index];
    if (object.hidden) {
      continue;
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
          focusObjIndex = index;
        }
        break;
      }
      case EObjectType.Polygon: {
        if (object.polygon) {
          const { group } = object.polygon!;
          const isInside = group.some((polygon) =>
            isPointInside(polygon, mousePoint, EElementType.Polygon),
          );
          if (isInside) focusObjIndex = index;
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
          if (isInside) focusObjIndex = index;
        }
        if (object.rect) {
          if (isPointInside(object.rect, mousePoint, EElementType.Rect)) {
            focusObjIndex = index;
            break;
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
            focusObjIndex = index;
            break;
          }
        }
        if (object.polygon) {
          const { group } = object.polygon;
          const isInside = group.some((polygon) =>
            isPointInside(polygon, mousePoint, EElementType.Polygon),
          );
          if (isInside) {
            focusObjIndex = index;
            break;
          }
        }
        if (object.rect) {
          if (isPointInside(object.rect, mousePoint, EElementType.Rect)) {
            focusObjIndex = index;
            break;
          }
        }
        break;
      }
    }

    if (focusObjIndex > -1) {
      return focusObjIndex;
    }
  }

  return focusObjIndex;
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

export const getLinesFromPolygon = (polygon: IPolygon): ILine[] => {
  const lines: ILine[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const startPoint = polygon[i];
    const endPoint = polygon[(i + 1) % polygon.length];
    lines.push({ start: startPoint, end: endPoint });
  }
  return lines;
};

export const getFocusPartInPolygonGroup = (
  polygonGroup: IPolygonGroup,
  mouse: CursorState,
): {
  index: number;
  pointIndex: number;
  lineIndex: number;
} => {
  let index = -1;
  let pointIndex = -1;
  let lineIndex = -1;

  index = polygonGroup.group.findIndex((polygon) =>
    isPointInside(
      polygon,
      { x: mouse.elementX, y: mouse.elementY },
      EElementType.Polygon,
    ),
  );

  if (index === -1) {
    return { index, pointIndex, lineIndex };
  }
  const polygon = polygonGroup.group[index];
  pointIndex = polygon.findIndex((point) => isPointOnPoint(point, mouse, 8));
  if (pointIndex > -1) {
    return { index, pointIndex, lineIndex };
  }
  const lines = getLinesFromPolygon(polygon);
  lineIndex = lines.findIndex((line) => isPointOnLine(line, mouse));
  if (lineIndex > -1) {
    return { index, lineIndex, pointIndex };
  }
  return { index, lineIndex, pointIndex };
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

export const translateAnnotationsToObjects = ({
  annotations,
  objectsFilter,
  naturalSize,
  clientSize,
  needNormalizeBbox = true,
}: {
  annotations: DATA.BaseObject[];
  objectsFilter?: (objects: DATA.BaseObject[]) => DATA.BaseObject[];
  naturalSize: ISize;
  clientSize: ISize;
  needNormalizeBbox?: boolean;
}): IAnnotationObject[] => {
  const objects = objectsFilter ? objectsFilter(annotations) : annotations;
  const objectList = objects.map((obj) => {
    let {
      categoryName,
      boundingBox,
      points,
      lines,
      pointNames,
      pointColors,
      segmentation,
    } = obj;

    const newObj: IAnnotationObject = {
      label: categoryName || '',
      type: EObjectType.Rectangle,
      hidden: false,
      conf: 1,
    };

    // TODO: Ignore fields with bbox values of 0.
    if (boundingBox && isValidBBox(boundingBox)) {
      const rect = needNormalizeBbox
        ? translateBoundingBoxToRect(boundingBox, clientSize)
        : translateAbsBBoxToRect(boundingBox);
      Object.assign(newObj, { rect: { visible: true, ...rect } });
    }
    if (
      points &&
      points.length > 0 &&
      lines &&
      lines.length > 0 &&
      pointNames &&
      pointColors
    ) {
      const pointObjs: IElement<IPoint>[] = translatePointsToPointObjs(
        points,
        pointNames,
        pointColors,
        naturalSize,
        clientSize,
      );
      Object.assign(newObj, {
        keypoints: {
          points: pointObjs,
          lines,
        },
      });
    }
    if (segmentation) {
      const group = getSegmentationPoints(
        segmentation,
        naturalSize,
        clientSize,
      );
      const polygon: IElement<IPolygonGroup> = {
        group,
        visible: true,
      };
      Object.assign(newObj, { polygon });
    }
    newObj.type = getObjectType(newObj);
    return newObj;
  });

  return objectList;
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
