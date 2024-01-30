import { useCallback, useEffect } from 'react';

import { EBasicToolItem } from '../constants';
import { DrawData, EditState } from '../type';
import { Direction } from '../utils/compute';

interface IProps {
  topCanvas: HTMLCanvasElement | null;
  editState: EditState;
  drawData: DrawData;
}

const useMouseCursor = ({ topCanvas, editState, drawData }: IProps) => {
  const updateMouseCursor = useCallback(
    (value: string, position?: Direction) => {
      if (!topCanvas) return;

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
      if (cursor !== topCanvas.style.cursor) {
        topCanvas.style.cursor = cursor;
      }
    },
    [topCanvas],
  );

  useEffect(() => {
    if (editState.allowMove) {
      updateMouseCursor('grabbing');
    } else {
      if (drawData.selectedTool === EBasicToolItem.Drag) {
        updateMouseCursor('grab');
      } else {
        updateMouseCursor('crosshair');
      }
    }
  }, [editState.allowMove]);

  return {
    updateMouseCursor,
  };
};

export default useMouseCursor;
