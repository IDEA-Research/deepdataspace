import { Direction } from './compute';

export const updateMouseCursor = (
  element: HTMLElement | null,
  value: string,
  position?: Direction,
) => {
  if (!element) return;

  let cursor = value;
  if (position) {
    switch (position) {
      case Direction.TOP:
      case Direction.BOTTOM:
        cursor = 'ns-resize';
        break;
      case Direction.TOP_LEFT:
      case Direction.BOTTOM_RIGHT:
        cursor = 'nwse-resize';
        break;
      case Direction.BOTTOM_LEFT:
      case Direction.TOP_RIGHT:
        cursor = 'nesw-resize';
        break;
      default:
        cursor = 'ew-resize';
    }
  }
  if (cursor !== element.style.cursor) {
    element.style.cursor = cursor;
  }
};
