import { hexToRgba } from './color';

function deg2rad(angleDeg: number) {
  return (angleDeg * Math.PI) / 180;
}

export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function resizeSmoothCanvas(
  canvas: HTMLCanvasElement,
  clientSize: ISize,
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  if (window.devicePixelRatio) {
    canvas.style.width = clientSize.width + 'px';
    canvas.style.height = clientSize.height + 'px';
    canvas.height = clientSize.height * window.devicePixelRatio;
    canvas.width = clientSize.width * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
}

export function drawImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  imageRect: IRect,
) {
  if (!!image && !!canvas) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(
      image,
      imageRect.x,
      imageRect.y,
      imageRect.width,
      imageRect.height,
    );
  }
}

export function putImageData(
  canvas: HTMLCanvasElement,
  imageData: ImageData,
  imageRect: IRect,
) {
  if (!!imageData && !!canvas) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.putImageData(
      imageData,
      0,
      0,
      imageRect.x,
      imageRect.y,
      imageRect.width,
      imageRect.height,
    );
  }
}

export function drawLine(
  canvas: HTMLCanvasElement,
  startPoint: IPoint,
  endPoint: IPoint,
  color = '#111111',
  thickness = 1,
  lineDash?: number[],
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x + 1, endPoint.y + 1);
  ctx.stroke();
  ctx.restore();
}

export function drawPath(
  canvas: HTMLCanvasElement,
  points: IPoint[],
  color = '#111111',
  thickness = 1,
  lineDash?: number[],
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1, len = points.length; i < len; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

const midPointBtw = (p1: any, p2: any) => {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  };
};

export function drawQuadraticPath(
  canvas: HTMLCanvasElement,
  points: IPoint[],
  color = '#111111',
  thickness = 20,
  lineDash?: number[],
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }

  ctx.beginPath();

  let p1 = points[0];
  let p2 = points[1];

  ctx.moveTo(p1.x, p1.y);

  for (let i = 1, len = points.length; i < len; i++) {
    let midPoint = midPointBtw(p1, p2);
    ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    p1 = points[i];
    p2 = points[i + 1];
  }
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
  ctx.restore();
}

export function drawRect(
  canvas: HTMLCanvasElement | null,
  rect: IRect,
  color = '#fff',
  thickness = 1,
  lineDash?: number[],
  fillColor?: string,
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.stroke();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.restore();
}

export function drawRectWithFill(
  canvas: HTMLCanvasElement | null,
  rect: IRect,
  color = '#fff',
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.fill();
  ctx.restore();
}

export function shadeEverythingButRect(
  canvas: HTMLCanvasElement,
  rect: IRect,
  color = '#000',
  alpha = 0.5,
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

export function drawPolygon(
  canvas: HTMLCanvasElement | null,
  offset: IPoint = { x: 0, y: 0 },
  anchors: IPoint[],
  color = '#fff',
  thickness = 1,
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  const { x: offsetX, y: offsetY } = offset;
  ctx.moveTo(anchors[0].x + offsetX, anchors[0].y + offsetY);
  for (let i = 1; i < anchors.length; i++) {
    ctx.lineTo(anchors[i].x + offsetX, anchors[i].y + offsetX);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawPolygonWithFill(
  canvas: HTMLCanvasElement | null,
  anchors: IPoint[],
  fillColor = '#fff',
  strokeColor = '#fff',
  thickness = 1,
  lineDash?: number[],
): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = thickness;
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }
  ctx.beginPath();
  ctx.moveTo(anchors[0].x, anchors[0].y);
  for (let i = 1; i < anchors.length; i++) {
    ctx.lineTo(anchors[i].x, anchors[i].y);
  }
  ctx.closePath();
  if (thickness > 0) {
    ctx.stroke();
  }
  ctx.fill();
  ctx.restore();
}

export function drawText(
  canvas: HTMLCanvasElement,
  text: string,
  textSize: number,
  anchorPoint: IPoint,
  color = '#ffffff',
  bold = false,
  align = 'center',
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = 'top';
  ctx.font = (bold ? 'bold ' : '') + textSize + 'px Arial';
  ctx.fillText(text, anchorPoint.x, anchorPoint.y);
  ctx.restore();
}

export function drawCircleWithFill(
  canvas: HTMLCanvasElement,
  anchorPoint: IPoint,
  radius: number,
  color = '#ffffff',
  strokeWidth: number,
  strokeColor = '#000',
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  const startAngleRad = deg2rad(0);
  const endAngleRad = deg2rad(360);
  ctx.lineWidth = strokeWidth || 0;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(
    anchorPoint.x,
    anchorPoint.y,
    radius,
    startAngleRad,
    endAngleRad,
    false,
  );
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

export function drawCircle(
  canvas: HTMLCanvasElement,
  anchorPoint: IPoint,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  thickness = 20,
  color = '#ffffff',
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const startAngleRad = deg2rad(startAngleDeg);
  const endAngleRad = deg2rad(endAngleDeg);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.arc(
    anchorPoint.x,
    anchorPoint.y,
    radius,
    startAngleRad,
    endAngleRad,
    false,
  );
  ctx.stroke();
  ctx.restore();
}

export function drawBooleanPolygon(
  canvas: HTMLCanvasElement,
  anchors: IPoint[],
  addPolygon = true,
  fillColor = '#fff',
  strokeColor = '#fff',
  thickness = 1,
  lineDash?: number[],
) {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }
  ctx.beginPath();
  ctx.moveTo(anchors[0].x, anchors[0].y);
  for (let i = 1; i < anchors.length; i++) {
    ctx.lineTo(anchors[i].x, anchors[i].y);
  }
  ctx.closePath();
  ctx.clip();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (addPolygon) {
    if (thickness > 0) {
      ctx.stroke();
    }
    ctx.fill();
  }
  ctx.restore();
}

export function drawBooleanBrush(
  canvas: HTMLCanvasElement,
  points: IPoint[],
  addBrush = true,
  color = '#111111',
  alpha = 1,
  thickness = 20,
  lineDash?: number[],
): void {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (lineDash) {
    ctx.setLineDash(lineDash);
  }

  let p1 = points[0];
  let p2 = points[1];

  ctx.moveTo(p1.x, p1.y);

  for (let i = 1, len = points.length; i < len; i++) {
    let midPoint = midPointBtw(p1, p2);
    ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    p1 = points[i];
    p2 = points[i + 1];
  }
  ctx.lineTo(p1.x, p1.y);

  if (addBrush) {
    if (thickness > 0) {
      // remove overlap area firstly to avoid color blending
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = color;
      ctx.stroke();
      // draw new stroke path
      ctx.strokeStyle = hexToRgba(color, alpha);
      ctx.globalCompositeOperation = 'source-over';
      ctx.stroke();
    }
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.stroke();
  }
  ctx.restore();
}
