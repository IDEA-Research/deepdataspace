import React, { useEffect, useMemo, useRef } from 'react';
import { Button, Divider, message } from 'antd';
import { EObjectType, EElementType, EBasicToolItem } from '@/constants';
import { Updater, useImmer } from 'use-immer';
import { scaleDrawData } from '@/utils/compute';
import { DATA } from '@/services/type';
import TopTools from '@/components/TopTools';
import useLabels from './hooks/useLabels';
import styles from './index.less';
import useActions from './hooks/useActions';
import PopoverMenu from './components/PopoverMenu';
import ObjectList from './components/ObjectList';
import { MainToolBar } from './components/MainToolBar';
import SmartAnnotationControl from './components/SmartAnnotationControl';
import { ScaleToolBar } from './components/ScaleToolBar';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { TopPagination } from './components/TopPagination';
import { EQaAction } from '@/pages/Project/constants';
import AnnotationEditor from './components/AnnotationEditor';
import { ShortcutsInfo } from './components/ShortcutsInfo';
import useHistory from './hooks/useHistory';
import useObjects from './hooks/useObjects';
import { cloneDeep } from 'lodash';
import { useLocale } from '@/locales/helper';
import { usePreviousState } from '@/hooks/usePreviousState';
import useCanvasContainer from '@/hooks/useCanvasContainer';
import { SubToolBar } from './components/SubToolBar';
import {
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  EditImageData,
  EditState,
  EditorMode,
} from './type';
import useMouseCursor from './hooks/useMouseCursor';
import useShortcuts from './hooks/useShortcuts';
import useToolActions from './hooks/useToolActions';
import useMouseEvents from './hooks/useMouseEvents';
import useCanvasRender from './hooks/useCanvasRender';
import useRectangle from './tools/useRectangle';
import usePolygon from './tools/usePolygon';
import useSkeleton from './tools/useSkeleton';
import useMask from './tools/useMask';
import { ToolInstanceHookReturn } from './tools/base';

export interface EditProps {
  isSeperate: boolean;
  visible: boolean;
  mode: EditorMode;
  categories: DATA.Category[];
  list: EditImageData[];
  current: number;
  pagination?: {
    show: boolean;
    total: number;
    customText?: React.ReactElement;
    customDisableNext?: boolean;
  };
  actionElements?: React.ReactElement[];
  objectsFilter?: (objects: DATA.BaseObject[]) => DATA.BaseObject[];
  onCancel?: () => void;
  onSave?: (imageId: string, annotations: DATA.BaseObject[]) => Promise<void>;
  onAutoSave?: (annotations: DATA.BaseObject[]) => void;
  onReviewResult?: (imageId: string, action: EQaAction) => Promise<void>;
  onEnterEdit?: () => void;
  onPrev?: () => Promise<void>;
  onNext?: () => Promise<void>;
  setCategories?: Updater<DATA.Category[]>;
}

const Edit: React.FC<EditProps> = (props) => {
  const {
    isSeperate,
    visible,
    categories,
    list,
    current,
    pagination,
    mode,
    actionElements,
    onPrev,
    onNext,
    onCancel,
    onSave,
    onEnterEdit,
    onReviewResult,
    objectsFilter,
    setCategories,
    onAutoSave,
  } = props;

  const { localeText } = useLocale();

  const [annotations, setAnnotations] = useImmer<DATA.BaseObject[]>([]);

  const [editState, setEditState] = useImmer<EditState>(
    cloneDeep(DEFAULT_EDIT_STATE),
  );

  const [drawData, setDrawData] = useImmer<DrawData>(
    cloneDeep(DEFAULT_DRAW_DATA),
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const isDragToolActive = useMemo(() => {
    return drawData.selectedTool === EBasicToolItem.Drag;
  }, [drawData.selectedTool]);

  const isAIPoseEstimation = useMemo(() => {
    return (
      drawData.AIAnnotation && drawData.selectedTool === EBasicToolItem.Skeleton
    );
  }, [drawData.AIAnnotation, drawData.selectedTool]);

  const {
    scale,
    naturalSize,
    clientSize,
    containerMouse,
    contentMouse,
    imagePos,
    onLoadImg,
    onZoomIn,
    onZoomOut,
    onReset,
    CanvasContainer,
  } = useCanvasContainer({
    visible,
    allowMove: editState.allowMove,
    isRequiring: editState.isRequiring,
    showMouseAim: true,
    minPadding: {
      top: 30,
      left: 30,
    },
  });

  const [preClientSize, clearPreClientSize] =
    usePreviousState<ISize>(clientSize);

  const {
    undo,
    redo,
    clearHistory,
    hadChangeRecord,
    updateHistory,
    setDrawDataWithHistory,
  } = useHistory({
    clientSize,
    naturalSize,
    setDrawData,
    onAutoSave,
  });

  const {
    addObject,
    removeObject,
    removeAllObjects,
    initObjectList,
    updateAllObject,
    updateObject,
    setCurrSelectedObject,
  } = useObjects({
    annotations,
    setAnnotations,
    clientSize,
    naturalSize,
    drawData,
    setDrawData,
    setDrawDataWithHistory,
    editState,
    setEditState,
    mode,
  });

  const {
    aiLabels,
    setAiLabels,
    labelColors,
    onChangeObjectHidden,
    onChangeCategoryHidden,
    onChangeElementVisible,
    onChangePointVisible,
    onChangeActiveClass,
    onCreateCategory,
  } = useLabels({
    visible,
    mode,
    categories,
    setCategories,
    drawData,
    setDrawData,
    editState,
    updateObject,
    updateAllObject,
  });

  const {
    onAiAnnotation,
    onSaveAnnotations,
    onCancelAnnotations,
    onReject,
    onAccept,
  } = useActions({
    mode,
    list,
    current,
    setDrawData,
    setDrawDataWithHistory,
    editState,
    setEditState,
    naturalSize,
    clientSize,
    imagePos,
    containerMouse,
    onCancel,
    onSave,
    updateAllObject,
    hadChangeRecord,
    latestLabel: editState.latestLabel,
    labelColors,
  });

  const { updateMouseCursor, updateMouseCursorWhenMouseMove } = useMouseCursor({
    topCanvas: activeCanvasRef.current,
    editState,
    drawData,
    contentMouse,
  });

  const {
    onDeleteCurrObject,
    onFinishCurrCreate,
    onCloseAnnotationEditor,
    selectTool,
    selectSubTool,
    setBrushSize,
    activeAIAnnotation,
  } = useToolActions({
    mode,
    drawData,
    setDrawData,
    editState,
    setEditState,
    labelColors,
    clientSize,
    naturalSize,
    addObject,
    removeObject,
    updateObject,
  });

  const toolInstanceHookprops = {
    editState,
    clientSize,
    naturalSize,
    contentMouse,
    imagePos,
    containerMouse,
    canvasRef,
    activeCanvasRef,
    setEditState,
    drawData,
    setDrawData,
    setDrawDataWithHistory,
    updateHistory,
    updateMouseCursor,
  };
  const rectangleHooks = useRectangle(toolInstanceHookprops);
  const polygenHooks = usePolygon(toolInstanceHookprops);
  const skeletonHooks = useSkeleton(toolInstanceHookprops);
  const maskHooks = useMask(toolInstanceHookprops);

  const objectHooksMap: Record<EObjectType, ToolInstanceHookReturn> = {
    [EObjectType.Rectangle]: rectangleHooks,
    [EObjectType.Polygon]: polygenHooks,
    [EObjectType.Skeleton]: skeletonHooks,
    [EObjectType.Mask]: maskHooks,
    [EObjectType.Custom]: rectangleHooks, // todo
  };

  const { updateRender } = useCanvasRender({
    visible,
    drawData,
    editState,
    clientSize,
    labelColors,
    imagePos,
    containerMouse,
    canvasRef,
    activeCanvasRef,
    imgRef,
    objectHooksMap,
  });

  const { onMouseDown, onMouseMove, onMouseUp, isMousePress } = useMouseEvents({
    visible,
    mode,
    drawData,
    setDrawData,
    setDrawDataWithHistory,
    editState,
    setEditState,
    clientSize,
    naturalSize,
    contentMouse,
    isDragToolActive,
    isAIPoseEstimation,
    categories,
    aiLabels,
    onAiAnnotation,
    updateRender,
    addObject,
    updateObject,
    updateMouseCursor,
    updateMouseCursorWhenMouseMove,
    setCurrSelectedObject,
    objectHooksMap,
  });

  useShortcuts({
    visible,
    isMousePress,
    mode,
    drawData,
    setDrawData,
    setEditState,
    onSaveAnnotations,
    onAccept,
    onReject,
    onChangeObjectHidden,
    onChangeCategoryHidden,
    removeObject,
  });

  // =================================================================================================================
  // Effects
  // =================================================================================================================

  /**
   * Rebuilds the draw data for the annotation tool.
   * @param {boolean} isUpdateDrawData - Optional parameter that specifies whether to update draw data.
   * @return {void}
   */
  const rebuildDrawData = (isUpdateDrawData?: boolean) => {
    if (!clientSize.width || !clientSize.height) return;
    if (isUpdateDrawData || !drawData.initialized) {
      // Initialization
      initObjectList(annotations, labelColors);
      setDrawData((s) => {
        s.initialized = true;
      });
    } else if (preClientSize) {
      // scale change
      const updateDrawData = scaleDrawData(drawData, preClientSize, clientSize);
      setDrawData(updateDrawData);
      updateRender(updateDrawData);
      clearPreClientSize();
    }
  };

  /** Update canvas while data changing */
  useEffect(() => {
    updateRender();
  }, [drawData, editState]);

  /** Recalculate drawData while changing size */
  useEffect(() => {
    rebuildDrawData();
  }, [
    imagePos.current.x,
    imagePos.current.y,
    clientSize.height,
    clientSize.width,
  ]);

  /** Reset data when hiding the editor or switching images */
  useEffect(() => {
    setDrawData({
      ...cloneDeep(DEFAULT_DRAW_DATA),
      brushSize: drawData.brushSize,
      selectedTool: drawData.selectedTool,
    });
    setEditState(cloneDeep(DEFAULT_EDIT_STATE));
    clearHistory();
    if (visible) {
      const annotations = list[current]?.objects || [];
      const currAnnotations = objectsFilter
        ? objectsFilter(annotations)
        : annotations;

      setAnnotations(currAnnotations);
    }
  }, [visible, current]);

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : 'overlay';
  }, [visible]);

  useEffect(() => {
    if (!drawData.initialized) {
      clearHistory();
      rebuildDrawData(true);
    }
  }, [annotations]);

  // =================================================================================================================
  // Render
  // =================================================================================================================

  const supportActions = useMemo(() => {
    const actions = actionElements
      ? actionElements.map((item) => ({ customElement: item }))
      : [];
    if (mode === EditorMode.Review && onReviewResult) {
      actions.push(
        ...[
          {
            customElement: (
              <Button type="primary" danger onClick={onReject}>
                {localeText('editor.reject')}
              </Button>
            ),
          },
          {
            customElement: (
              <Button type="primary" onClick={onAccept}>
                {localeText('editor.approve')}
              </Button>
            ),
          },
        ],
      );
    }
    if (mode === EditorMode.Edit && !isSeperate) {
      actions.push(
        ...[
          {
            customElement: (
              <Button
                type="primary"
                onClick={() => onSaveAnnotations(drawData)}
              >
                {localeText('editor.save')}
              </Button>
            ),
          },
        ],
      );
    }
    actions.unshift({
      customElement: (
        <>
          <ShortcutsInfo viewOnly={mode === EditorMode.View} />
          <Divider
            type="vertical"
            style={{
              height: 20,
              borderLeft: '1px solid #fff',
            }}
          />
        </>
      ),
    });
    return actions;
  }, [mode, onReviewResult, onEnterEdit, onSaveAnnotations, list[current]]);

  const renderPopoverMenu = () => {
    if (
      editState.focusObjectIndex > -1 &&
      drawData.objectList[editState.focusObjectIndex] &&
      !drawData.objectList[editState.focusObjectIndex].hidden &&
      editState.focusEleIndex > -1 &&
      editState.focusEleType === EElementType.Circle
    ) {
      const target =
        drawData.objectList[editState.focusObjectIndex].keypoints?.points?.[
          editState.focusEleIndex
        ];
      if (target) {
        return (
          <PopoverMenu
            index={editState.focusEleIndex}
            targetElement={target!}
            imagePos={imagePos.current}
          />
        );
      }
    }
    return <></>;
  };

  const isAnnotEditorVisible =
    mode === EditorMode.Edit &&
    !isAIPoseEstimation &&
    !(
      drawData.selectedTool === EBasicToolItem.Polygon &&
      drawData.AIAnnotation &&
      drawData.activeObjectIndex === -1
    );

  if (visible) {
    return (
      <div className={styles.editor}>
        <TopTools
          className={styles.topTools}
          leftTools={
            isSeperate
              ? []
              : [
                  {
                    title: localeText('editor.exit'),
                    icon: <ArrowLeftOutlined />,
                    onClick: () => onCancelAnnotations(),
                  },
                ]
          }
          rightTools={supportActions}
        >
          {pagination && pagination.show && (
            <TopPagination
              list={list}
              current={current}
              total={pagination.total}
              customText={pagination.customText}
              customDisableNext={pagination.customDisableNext}
              onPrev={onPrev}
              onNext={onNext}
            />
          )}
        </TopTools>
        <div className={styles.container}>
          <div className={styles.leftSlider}></div>
          <div
            className={styles.centerContent}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
          >
            {CanvasContainer({
              className: styles.editWrap,
              children: (
                <>
                  <img
                    ref={imgRef}
                    src={list[current]?.urlFullRes}
                    alt="pic"
                    onLoad={onLoadImg}
                  />
                  <canvas
                    ref={canvasRef}
                    onContextMenu={(
                      event: React.MouseEvent<HTMLCanvasElement>,
                    ) => event.preventDefault()}
                    draggable={false}
                  />
                  <canvas
                    ref={activeCanvasRef}
                    onContextMenu={(
                      event: React.MouseEvent<HTMLCanvasElement>,
                    ) => event.preventDefault()}
                    draggable={false}
                  />
                  {renderPopoverMenu()}
                </>
              ),
            })}
            {isAnnotEditorVisible && (
              <AnnotationEditor
                hideTitle={drawData.creatingObject?.type === EObjectType.Mask}
                allowAddCategory={isSeperate}
                latestLabel={editState.latestLabel}
                categories={categories}
                currEditObject={drawData.creatingObject}
                onCreateCategory={onCreateCategory}
                onDeleteCurrObject={onDeleteCurrObject}
                onFinishCurrCreate={onFinishCurrCreate}
                onCloseAnnotationEditor={onCloseAnnotationEditor}
              />
            )}
            <SmartAnnotationControl
              drawData={drawData}
              aiLabels={aiLabels}
              categories={categories}
              setAiLabels={setAiLabels}
              onExitAIAnnotation={() => {
                setDrawData((s) => {
                  s.AIAnnotation = false;
                  s.creatingObject = undefined;
                  s.prompt = {};
                });
              }}
              onAiAnnotation={() => onAiAnnotation({ drawData, aiLabels })}
              onSaveCurrCreate={() => {
                addObject({
                  type: EObjectType.Polygon,
                  polygon: drawData.creatingObject?.polygon,
                  label: drawData.creatingObject?.label || '',
                  hidden: false,
                });
                setDrawData((s) => {
                  s.activeObjectIndex = s.objectList.length - 1;
                  s.prompt = {};
                });
              }}
              onCancelCurrCreate={() => {
                setDrawData((s) => {
                  s.creatingObject = undefined;
                  s.activeObjectIndex = -1;
                  s.prompt = {};
                });
              }}
              onChangeConfidenceRange={(range) => {
                setDrawData((s) => {
                  const filterObjects = s.objectList.map((obj) => {
                    if (obj.conf === undefined) return obj;
                    obj.hidden =
                      obj.conf < range[0] || obj.conf > range[1] ? true : false;
                    return obj;
                  });
                  s.objectList = filterObjects;
                  const visibleCount = filterObjects.reduce((sum, obj) => {
                    return sum + (obj.hidden ? 0 : 1);
                  }, 0);
                  message.success(
                    localeText('smartAnnotation.msg.confResults', {
                      count: visibleCount,
                    }),
                  );
                });
              }}
              onApplyCurVisibleObjects={() => {
                setDrawData((s) => {
                  const visibleObjects = s.objectList.filter((obj) => {
                    return (
                      (!obj.hidden && obj.type === EObjectType.Skeleton) ||
                      obj.type !== EObjectType.Skeleton
                    );
                  });
                  s.objectList = visibleObjects;
                  s.activeObjectIndex = -1;
                  s.creatingObject = undefined;
                  message.success(
                    localeText('smartAnnotation.msg.applyConf', {
                      count: visibleObjects.length,
                    }),
                  );
                });
              }}
              onCreateCategory={onCreateCategory}
            />
            <ScaleToolBar
              scale={scale}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onReset={onReset}
            />
            {mode === EditorMode.Edit && (
              <>
                <MainToolBar
                  selectedTool={drawData.selectedTool}
                  isAIAnnotationActive={drawData.AIAnnotation}
                  onChangeSelectedTool={(type) => {
                    selectTool(type);
                    setAiLabels([]);
                  }}
                  onActiveAIAnnotation={activeAIAnnotation}
                  undo={undo}
                  redo={redo}
                  deleteAll={removeAllObjects}
                />
                {drawData.selectedTool === EBasicToolItem.Mask && (
                  <SubToolBar
                    selectedSubTool={drawData.selectedSubTool}
                    isAIAnnotationActive={drawData.AIAnnotation}
                    isSegEverythingAvailable={
                      drawData.objectList.length === 0 &&
                      !drawData.creatingObject
                    }
                    brushSize={drawData.brushSize}
                    onChangeSubTool={(type) => {
                      selectSubTool(type);
                    }}
                    onChangeBrushSize={(value) => {
                      setBrushSize(value);
                    }}
                    onActiveAIAnnotation={activeAIAnnotation}
                  />
                )}
              </>
            )}
          </div>
          <ObjectList
            supportEdit={mode === EditorMode.Edit}
            className={styles.rightSlider}
            objects={drawData.objectList}
            labelColors={labelColors}
            activeObjectIndex={drawData.activeObjectIndex}
            focusObjectIndex={editState.focusObjectIndex}
            focusEleIndex={editState.focusEleIndex}
            focusEleType={editState.focusEleType}
            isMovingElement={!!editState.startElementMovePoint}
            activeClassName={drawData.activeClassName}
            onFocusObject={(index) =>
              setEditState((s) => {
                s.focusObjectIndex = index;
              })
            }
            onActiveObject={(index) => {
              setCurrSelectedObject(index);
            }}
            onFocusElement={(index) =>
              setEditState((s) => {
                s.focusEleIndex = index;
              })
            }
            onChangeFocusEleType={(type) => {
              setEditState((s) => {
                s.focusEleType = type;
              });
            }}
            onCancelMovingStatus={() => {
              setEditState((s) => {
                s.startElementMovePoint = undefined;
              });
            }}
            onChangeObjectHidden={onChangeObjectHidden}
            onChangeCategoryHidden={onChangeCategoryHidden}
            onDeleteObject={removeObject}
            onChangeEleVisible={onChangeElementVisible}
            onChangePointVisible={onChangePointVisible}
            onChangeActiveClassName={onChangeActiveClass}
          />
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};

export default Edit;
