/** Global ts define */
declare interface IPoint {
  x: number;
  y: number;
}

declare interface ISize {
  height: number;
  width: number;
}

declare interface IBoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

declare interface IRect {
  x: number;
  y: number;
  height: number;
  width: number;
}

declare type IPolygon = IPoint[];
declare interface IPolygonGroup {
  group: IPolygon[];
}
declare interface ICircle {
  x: number;
  y: number;
  radius: number;
}

declare interface ILine {
  start: IPoint;
  end: IPoint;
}

declare type IElement<T extends IRect | IPoint | IPolygonGroup> = T & {
  visible: T extends IRect | IPolygonGroup ? boolean : number;
  name?: string;
  color?: string;
};
