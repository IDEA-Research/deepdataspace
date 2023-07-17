import { MouseEventHandler, useState } from 'react';
import { CursorState } from 'ahooks/lib/useMouse';
import { DrawData, EditState, EditorMode } from '../type';
import {
  Direction,
  isInCanvas,
  judgeFocusOnElement,
  judgeFocusOnObject,
} from '@/utils/compute';
import {
  EBasicToolItem,
  EBasicToolTypeMap,
  EElementType,
  EObjectType,
} from '@/constants';
import { Updater } from 'use-immer';
import { DATA } from '@/services/type';
import { ToolInstanceHookReturn } from '../tools/base';

interface IProps {
  visible: boolean;
  mode: EditorMode;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  clientSize: ISize;
  contentMouse: CursorState;
  isAIPoseEstimation: boolean;
  categories: DATA.Category[];
  updateRender: (updateDrawData?: DrawData) => void;
  updateMouseCursor: (value: string, position?: Direction) => void;
  setCurrSelectedObject: (index?: number) => void;
  objectHooksMap: Record<EObjectType, ToolInstanceHookReturn>;
}

const useMouseEvents = ({
  visible,
  mode,
  drawData,
  editState,
  setEditState,
  clientSize,
  contentMouse,
  isAIPoseEstimation,
  categories,
  updateRender,
  updateMouseCursor,
  setCurrSelectedObject,
  objectHooksMap,
}: IProps) => {
  const updateFocusInfoWhenMouseMove = () => {
    const focusObjectIndex = judgeFocusOnObject(
      clientSize,
      contentMouse,
      drawData.activeObjectIndex,
      drawData.objectList,
    );
    /** If focus in active object */
    if (
      focusObjectIndex > -1 &&
      focusObjectIndex === drawData.activeObjectIndex
    ) {
      setEditState((s) => {
        s.focusObjectIndex = focusObjectIndex;
      });
      /** Update focus element index & mouse style */
      const activeObject = drawData.objectList[drawData.activeObjectIndex];
      const { focusEleIndex, focusEleType, focusPolygonInfo } =
        judgeFocusOnElement(contentMouse, activeObject);
      setEditState((s) => {
        s.focusEleIndex = focusEleIndex;
        s.focusEleType = focusEleType;
        s.focusPolygonInfo = focusPolygonInfo;
      });
    } else if (
      drawData.selectedTool === EBasicToolItem.Drag ||
      isAIPoseEstimation
    ) {
      setEditState((s) => {
        s.focusObjectIndex = focusObjectIndex;
        s.focusEleIndex = -1;
        s.focusEleType = EElementType.Rect;
      });
    } else {
      setEditState((s) => {
        s.focusObjectIndex = -1;
        s.focusEleIndex = -1;
        s.focusEleType = EElementType.Rect;
      });
    }
  };

  const [isMousePress, setMousePress] = useState(false);

  const onMouseDown: MouseEventHandler<HTMLDivElement> = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    setMousePress(true);

    if (
      !visible ||
      editState.allowMove ||
      editState.isRequiring ||
      !isInCanvas(contentMouse)
    )
      return;

    // 1. Edit object
    if (drawData.creatingObject && drawData.activeObjectIndex > -1) {
      if (
        mode === EditorMode.Edit &&
        objectHooksMap[drawData.creatingObject.type].startEditingWhenMouseDown({
          event,
          object: drawData.creatingObject,
        })
      ) {
        return;
      }
    }

    // 2. Create object
    if (drawData.selectedTool !== EBasicToolItem.Drag && !isAIPoseEstimation) {
      const objectType = EBasicToolTypeMap[drawData.selectedTool];
      if (
        mode === EditorMode.Edit &&
        objectHooksMap[objectType].startCreatingWhenMouseDown({
          event,
          object: drawData.creatingObject,
          point: {
            x: contentMouse.elementX,
            y: contentMouse.elementY,
          },
          basic: {
            hidden: false,
            label: editState.latestLabel || categories[0].name,
          },
        })
      ) {
        return;
      }
    } else {
      if (editState.focusObjectIndex > -1) {
        // 3. Active object
        setCurrSelectedObject();
      } else {
        // 4. Drag object
        setEditState((s) => {
          s.allowMove = true;
        });
      }
    }
  };

  const onMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!visible || editState.isRequiring || editState.allowMove) return;

    // update default cursor
    if (editState.focusObjectIndex > -1) {
      updateMouseCursor('pointer');
    } else if (drawData.selectedTool !== EBasicToolItem.Drag) {
      updateMouseCursor('crosshair');
    } else {
      updateMouseCursor('grab');
    }

    if (drawData.creatingObject && drawData.activeObjectIndex > -1) {
      // 1. Edit object
      if (
        mode === EditorMode.Edit &&
        objectHooksMap[drawData.creatingObject.type].updateEditingWhenMouseMove(
          {
            event,
            object: drawData.creatingObject,
          },
        )
      ) {
        return;
      }
    } else if (
      drawData.selectedTool !== EBasicToolItem.Drag &&
      drawData.activeObjectIndex < 0
    ) {
      /** 2. Create Object */
      const objectType = EBasicToolTypeMap[drawData.selectedTool];
      if (
        mode === EditorMode.Edit &&
        objectHooksMap[objectType].updateCreatingWhenMouseMove({
          event,
          object: drawData.creatingObject,
        })
      ) {
        return;
      }
    }

    /** 3. Updata focus info */
    updateFocusInfoWhenMouseMove();
    updateRender();
  };

  const onMouseUp: MouseEventHandler<HTMLDivElement> = (event) => {
    setMousePress(false);

    if (!visible || editState.isRequiring) return;

    if (editState.allowMove) {
      setEditState((s) => {
        s.allowMove = false;
      });
      return;
    }

    if (drawData.creatingObject && drawData.activeObjectIndex > -1) {
      // 1. Edit object
      if (
        mode === EditorMode.Edit &&
        objectHooksMap[drawData.creatingObject.type].finishEditingWhenMouseUp({
          event,
          object: drawData.creatingObject,
        })
      ) {
        return;
      }
    } else if (
      drawData.selectedTool !== EBasicToolItem.Drag &&
      drawData.activeObjectIndex < 0
    ) {
      /** 2. Create Object */
      const objectType = EBasicToolTypeMap[drawData.selectedTool];
      if (
        mode === EditorMode.Edit &&
        objectHooksMap[objectType].finishCreatingWhenMouseUp({
          event,
          object: drawData.creatingObject,
        })
      ) {
        return;
      }
    }
  };

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    isMousePress,
  };
};

export default useMouseEvents;
