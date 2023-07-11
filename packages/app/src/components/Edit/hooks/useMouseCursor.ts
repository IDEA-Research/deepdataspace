import { useCallback, useEffect } from 'react';
import { CursorState } from 'ahooks/lib/useMouse';
import { DrawData, EditState } from '../type';
import { Direction, getAnchorUnderMouseByRect } from '@/utils/compute';
import { EBasicToolItem, EElementType } from '@/constants';

interface IProps {
  topCanvas: HTMLCanvasElement | null;
  editState: EditState;
  drawData: DrawData;
  contentMouse: CursorState;
}

const useMouseCursor = ({
  topCanvas,
  editState,
  drawData,
  contentMouse,
}: IProps) => {
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

  const updateMouseCursorWhenMouseMove = () => {
    if (
      editState.focusObjectIndex > -1 &&
      editState.focusObjectIndex === drawData.activeObjectIndex
    ) {
      switch (editState.focusEleType) {
        case EElementType.Rect: {
          if (drawData.activeObjectIndex > -1) {
            const { rect } = drawData.objectList[drawData.activeObjectIndex];
            if (rect) {
              const anchorUnderMouse = getAnchorUnderMouseByRect(rect!, {
                x: contentMouse.elementX,
                y: contentMouse.elementY,
              });
              // focus on the resize point
              if (anchorUnderMouse) {
                updateMouseCursor('resize', anchorUnderMouse.type);
              } else {
                updateMouseCursor('move');
              }
            }
          }
          break;
        }
        case EElementType.Polygon:
        case EElementType.Circle:
        default: {
          updateMouseCursor('pointer');
          break;
        }
      }
    } else if (editState.focusObjectIndex > -1) {
      updateMouseCursor('pointer');
    } else if (drawData.selectedTool !== EBasicToolItem.Drag) {
      updateMouseCursor('crosshair');
    } else {
      updateMouseCursor('grab');
    }
  };

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
    updateMouseCursorWhenMouseMove,
  };
};

export default useMouseCursor;
