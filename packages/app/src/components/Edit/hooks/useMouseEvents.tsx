import { useRef, useState } from 'react';
import { CursorState } from 'ahooks/lib/useMouse';
import {
  DrawData,
  EditState,
  EditorMode,
  EObjectStatus,
  IAnnotationObject,
} from '../type';
import {
  Direction,
  isInCanvas,
  judgeFocusOnElement,
  judgeFocusOnObject,
  judgeFocusOnPointAllObject,
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
import { useEventListener, useRafInterval } from 'ahooks';
import styles from '../index.less';
import { fixedFloatNum } from '@/utils/digit';

interface IProps {
  visible: boolean;
  mode: EditorMode;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  clientSize: ISize;
  contentMouse: CursorState;
  categories: DATA.Category[];
  labelColors: Record<string, string>;
  updateRender: (updateDrawData?: DrawData) => void;
  updateMouseCursor: (value: string, position?: Direction) => void;
  objectHooksMap: Record<EObjectType, ToolInstanceHookReturn>;
  imagePos: React.MutableRefObject<IPoint>;
  containerMouse: CursorState;
}

const BOUNDING_OFFSET = 40;
const MOUSE_OFFSET = 10;

const useMouseEvents = ({
  visible,
  mode,
  drawData,
  setDrawData,
  editState,
  setEditState,
  clientSize,
  contentMouse,
  categories,
  labelColors,
  updateRender,
  updateMouseCursor,
  objectHooksMap,
  imagePos,
  containerMouse,
}: IProps) => {
  const moveVisibleAreaRef = useRef<{
    direction?: Direction;
    topMin: number;
    topMax: number;
    leftMin: number;
    leftMax: number;
  }>({
    topMin: 0,
    topMax: 0,
    leftMin: 0,
    leftMax: 0,
  });

  const [moveVisibleAreaInterval, setMoveVisibleAreaInterval] = useState<
    number | undefined
  >(undefined);

  useRafInterval(() => {
    let changed = false;
    if (
      moveVisibleAreaRef.current.direction?.includes('TOP') &&
      imagePos.current.y < moveVisibleAreaRef.current.topMax
    ) {
      imagePos.current.y += 8;
      changed = true;
    } else if (
      moveVisibleAreaRef.current.direction?.includes('BOTTOM') &&
      imagePos.current.y > moveVisibleAreaRef.current.topMin
    ) {
      imagePos.current.y -= 8;
      changed = true;
    }
    if (
      moveVisibleAreaRef.current.direction?.includes('LEFT') &&
      imagePos.current.x < moveVisibleAreaRef.current.leftMax
    ) {
      imagePos.current.x += 8;
      changed = true;
    } else if (
      moveVisibleAreaRef.current.direction?.includes('RIGHT') &&
      imagePos.current.x > moveVisibleAreaRef.current.leftMin
    ) {
      imagePos.current.x -= 8;
      changed = true;
    }
    if (!changed) {
      setMoveVisibleAreaInterval(undefined);
    }
    updateRender();
  }, moveVisibleAreaInterval);

  const checkContainerVisibleArea = () => {
    let direction = '';
    const topMax = BOUNDING_OFFSET;
    const topMin =
      containerMouse.elementH - contentMouse.elementH - BOUNDING_OFFSET;
    const leftMax = BOUNDING_OFFSET;
    const leftMin =
      containerMouse.elementW - contentMouse.elementW - BOUNDING_OFFSET;
    if (
      containerMouse.elementY <= MOUSE_OFFSET &&
      imagePos.current.y < topMax
    ) {
      direction = 'TOP';
    } else if (
      containerMouse.elementY >= containerMouse.elementH - MOUSE_OFFSET &&
      imagePos.current.y > topMin
    ) {
      direction = 'BOTTOM';
    }
    if (
      containerMouse.elementX <= MOUSE_OFFSET &&
      imagePos.current.x < leftMax
    ) {
      direction += direction ? '_LEFT' : 'LEFT';
    } else if (
      containerMouse.elementX >= containerMouse.elementW - MOUSE_OFFSET &&
      imagePos.current.x > leftMin
    ) {
      direction += direction ? '_RIGHT' : 'RIGHT';
    }

    if (direction) {
      moveVisibleAreaRef.current = {
        direction: direction as Direction,
        topMax,
        topMin,
        leftMax,
        leftMin,
      };
      setMoveVisibleAreaInterval(16);
    } else {
      setMoveVisibleAreaInterval(undefined);
    }
    updateRender();
  };

  const getFocusFilter = () => {
    let focusFilter;
    if (drawData.isBatchEditing) {
      if (
        drawData.selectedTool === EBasicToolItem.Rectangle &&
        editState.isCtrlPressed
      ) {
        focusFilter = (obj: IAnnotationObject) =>
          obj.status === EObjectStatus.Unchecked;
      } else {
        focusFilter = (obj: IAnnotationObject) =>
          obj.status !== EObjectStatus.Unchecked;
      }
    }
    return focusFilter;
  };

  const updateFocusInfoWhenMouseMove = () => {
    if (!isInCanvas(containerMouse)) return;

    const focusObjectIndex = judgeFocusOnObject(
      clientSize,
      contentMouse,
      drawData.activeObjectIndex,
      drawData.objectList,
      getFocusFilter(),
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
      drawData.isBatchEditing
    ) {
      setEditState((s) => {
        s.focusObjectIndex = focusObjectIndex;
        s.focusEleIndex = -1;
        s.focusEleType = EElementType.None;
        s.focusPolygonInfo = {
          index: -1,
          pointIndex: -1,
          lineIndex: -1,
        };
      });
    } else {
      setEditState((s) => {
        s.focusObjectIndex = -1;
        s.focusEleIndex = -1;
        s.focusEleType = EElementType.None;
        s.focusPolygonInfo = {
          index: -1,
          pointIndex: -1,
          lineIndex: -1,
        };
      });
    }
  };

  const selectFocusObject = (index: number, event?: MouseEvent) => {
    if (index < 0) return;
    const isMouseRightClick = event?.button === 2;
    if (isMouseRightClick) {
      // check all focus object on point
      const focusIndexs = judgeFocusOnPointAllObject(
        clientSize,
        contentMouse,
        drawData.objectList,
        getFocusFilter(),
      );
      if (focusIndexs.length > 1) {
        setEditState((s) => {
          s.foucsObjectAllIndexs = focusIndexs;
        });
      } else {
        setEditState((s) => {
          s.foucsObjectAllIndexs = [];
        });
      }
      return;
    }

    setDrawData((s) => {
      if (
        s.selectedTool === EBasicToolItem.Rectangle &&
        s.isBatchEditing &&
        editState.isCtrlPressed
      ) {
        s.objectList[index].status = EObjectStatus.Checked;
        setEditState((s) => {
          s.focusObjectIndex = -1;
        });
      } else {
        s.activeObjectIndex = index;
        s.creatingObject = {
          ...drawData.objectList[index],
          currIndex: undefined,
          startPoint: undefined,
          tempMaskSteps: [],
          maskStep: undefined,
        };

        if (
          s.selectedTool !== EBasicToolItem.Drag &&
          s.objectList[index] &&
          EBasicToolTypeMap[s.selectedTool] !== s.objectList[index].type
        ) {
          s.selectedTool = EBasicToolItem.Drag;
        }
      }
    });
  };

  const mouseRightObjectsDropDownRender = () => {
    if (!editState.foucsObjectAllIndexs.length) {
      return <></>;
    }
    const stopPropagation: React.MouseEventHandler<HTMLDivElement> = (
      event,
    ) => {
      event.stopPropagation();
    };
    const onFocusItem = (index: number) => {
      setEditState((s) => {
        s.focusObjectIndex = index;
      });
    };
    const onSelectItem = (index: number) => {
      selectFocusObject(index);
      setEditState((s) => {
        s.foucsObjectAllIndexs = [];
      });
    };
    return (
      <div
        className={styles.dropdownOptions}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        onMouseMove={stopPropagation}
      >
        {editState.foucsObjectAllIndexs.map((index) => (
          <div
            key={index}
            className={styles.objectOption}
            onMouseEnter={() => onFocusItem(index)}
            onClick={() => onSelectItem(index)}
          >
            <div
              className={styles.dot}
              style={{
                backgroundColor:
                  labelColors[drawData.objectList[index]?.label] || '#fff',
              }}
            />
            {drawData.objectList[index]?.label}
            {drawData.objectList[index]?.conf &&
              ` (${fixedFloatNum(drawData.objectList[index]?.conf || 0)})`}
          </div>
        ))}
      </div>
    );
  };

  const onMouseDown = (event: MouseEvent) => {
    if (
      !visible ||
      editState.allowMove ||
      editState.isRequiring ||
      !isInCanvas(contentMouse)
    )
      return;

    setEditState((s) => {
      s.foucsObjectAllIndexs = [];
    });

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
    if (
      drawData.selectedTool !== EBasicToolItem.Drag &&
      !drawData.isBatchEditing
    ) {
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
            status: EObjectStatus.Commited,
          },
        })
      ) {
        return;
      }
    } else {
      if (editState.focusObjectIndex > -1) {
        // 3. Active object
        selectFocusObject(editState.focusObjectIndex, event);
      } else {
        // 4. Drag object
        setEditState((s) => {
          s.allowMove = true;
        });
      }
    }
  };

  const onMouseMove = (event: MouseEvent) => {
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
        checkContainerVisibleArea();
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
        checkContainerVisibleArea();
        return;
      }
    }

    /** 3. Updata focus info */
    updateFocusInfoWhenMouseMove();
    updateRender();
  };

  const onMouseUp = (event: MouseEvent) => {
    setMoveVisibleAreaInterval(undefined);

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

  useEventListener('mousedown', (event) => {
    onMouseDown(event);
  });

  useEventListener('mousemove', (event) => {
    onMouseMove(event);
  });

  useEventListener('mouseup', (event) => {
    onMouseUp(event);
  });

  return {
    selectFocusObject,
    mouseRightObjectsDropDownRender,
  };
};

export default useMouseEvents;
