import React, { useEffect, useMemo, useRef } from 'react';
import { Button, Divider, Dropdown, Modal, message } from 'antd';
import {
  EObjectType,
  EElementType,
  EBasicToolItem,
  ESubToolItem,
} from '@/constants';
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
  EObjectStatus,
  DEFAULT_IMG_DISPLAY_OPTIONS,
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
  const [modal, contextHolder] = Modal.useModal();

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

  const isCustomCursorActive = useMemo(() => {
    return (
      drawData.selectedTool === EBasicToolItem.Mask &&
      [
        ESubToolItem.AutoEdgeStitching,
        ESubToolItem.AutoSegmentByStroke,
        ESubToolItem.BrushAdd,
        ESubToolItem.BrushErase,
      ].includes(drawData.selectedSubTool)
    );
  }, [drawData.selectedTool, drawData.selectedSubTool]);

  const showReferenceLine = useMemo(() => {
    return (
      drawData.selectedTool !== EBasicToolItem.Drag && !isCustomCursorActive
    );
  }, [drawData.selectedTool, isCustomCursorActive]);

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
    isMousePress,
  } = useCanvasContainer({
    visible,
    allowMove: editState.allowMove,
    isRequiring: editState.isRequiring,
    showReferenceLine,
    minPadding: {
      top: 30,
      left: 80,
    },
    isCustomCursorActive,
    cursorSize: drawData.brushSize,
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
    updateObjectWithoutHistory,
    updateAllObjectWithoutHistory,
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
    updateObjectWithoutHistory,
    updateAllObjectWithoutHistory,
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
    modal,
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

  const { updateMouseCursor } = useMouseCursor({
    topCanvas: activeCanvasRef.current,
    editState,
    drawData,
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
    updateObject,
    addObject,
    updateMouseCursor,
    aiLabels,
    onAiAnnotation,
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

  const { selectFocusObject, mouseRightObjectsDropDownRender } = useMouseEvents(
    {
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
    },
  );

  useShortcuts({
    visible,
    mode,
    drawData,
    isMousePress,
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
  const rebuildDrawData = () => {
    if (!clientSize.width || !clientSize.height) return;
    if (!drawData.initialized) {
      // Initialization
      setDrawData((s) => {
        s.initialized = true;
      });
      initObjectList(annotations, labelColors);
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
  }, [drawData, editState, imagePos.current.x, imagePos.current.y]);

  /** Recalculate drawData while changing size */
  useEffect(() => {
    rebuildDrawData();
  }, [annotations, clientSize.height, clientSize.width]);

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
      const annotations = list[current]?.objects
        ? [...list[current]?.objects]
        : [];
      const currAnnotations = objectsFilter
        ? objectsFilter(annotations)
        : annotations;
      setAnnotations(currAnnotations);
    }
  }, [visible, mode, current]);

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : 'overlay';
  }, [visible]);

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
    !(
      drawData.isBatchEditing &&
      drawData.selectedTool === EBasicToolItem.Skeleton
    ) &&
    !(
      drawData.selectedTool === EBasicToolItem.Polygon &&
      drawData.AIAnnotation &&
      drawData.activeObjectIndex === -1
    );

  const showSubTools =
    drawData.selectedTool === EBasicToolItem.Mask ||
    (drawData.creatingObject &&
      drawData.creatingObject.type === EObjectType.Mask);

  const commitedObjects = useMemo(() => {
    return drawData.objectList.filter((obj) => {
      return obj.status === EObjectStatus.Commited;
    });
  }, [drawData.isBatchEditing, drawData.objectList]);

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
          <div className={styles.centerContent}>
            <Dropdown
              dropdownRender={mouseRightObjectsDropDownRender}
              trigger={['contextMenu']}
              open={editState.foucsObjectAllIndexs.length > 0}
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
            </Dropdown>
            {isAnnotEditorVisible && (
              <AnnotationEditor
                hideTitle={drawData.creatingObject?.type === EObjectType.Mask}
                allowAddCategory={isSeperate}
                latestLabel={editState.latestLabel}
                categories={categories}
                currEditObject={
                  drawData.objectList[drawData.activeObjectIndex] ||
                  (drawData.selectedTool === EBasicToolItem.Mask &&
                    drawData.creatingObject)
                }
                onCreateCategory={onCreateCategory}
                onDeleteCurrObject={onDeleteCurrObject}
                onFinishCurrCreate={onFinishCurrCreate}
                onCloseAnnotationEditor={onCloseAnnotationEditor}
              />
            )}
            <SmartAnnotationControl
              drawData={drawData}
              isCtrlPressed={editState.isCtrlPressed}
              aiLabels={aiLabels}
              categories={categories}
              setAiLabels={setAiLabels}
              onExitAIAnnotation={() => {
                setDrawData((s) => {
                  s.objectList = s.objectList.filter(
                    (obj) => obj.status === EObjectStatus.Commited,
                  );
                  s.AIAnnotation = false;
                  s.isBatchEditing = false;
                  s.creatingObject = undefined;
                  s.prompt = {};
                });
              }}
              onAiAnnotation={onAiAnnotation}
              onSaveCurrCreate={() => {
                addObject({
                  type: EObjectType.Polygon,
                  polygon: drawData.creatingObject?.polygon,
                  label: drawData.creatingObject?.label || '',
                  hidden: false,
                  status: EObjectStatus.Commited,
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
                setDrawDataWithHistory((s) => {
                  const updateObjects = cloneDeep(drawData.objectList).map(
                    (obj) => {
                      if (obj.status === EObjectStatus.Commited) {
                        return obj;
                      }
                      if (obj.conf === undefined) {
                        obj.status = EObjectStatus.Unchecked;
                        return obj;
                      }
                      obj.status =
                        obj.conf < range[0] || obj.conf > range[1]
                          ? EObjectStatus.Unchecked
                          : EObjectStatus.Checked;
                      return obj;
                    },
                  );
                  s.objectList = updateObjects;
                });
              }}
              onChangeLimitConf={(value) => {
                setDrawDataWithHistory((s) => {
                  const updateObjects = cloneDeep(drawData.objectList).map(
                    (obj) => {
                      if (obj.status === EObjectStatus.Commited) {
                        return obj;
                      }
                      obj.status =
                        obj.conf && obj.conf >= value
                          ? EObjectStatus.Checked
                          : EObjectStatus.Unchecked;
                      return obj;
                    },
                  );
                  s.objectList = updateObjects;
                  const count = updateObjects.filter(
                    (item) => item.status === EObjectStatus.Checked,
                  ).length;
                  message.success(
                    localeText(`smartAnnotation.tip.annotationApplied`, {
                      count,
                    }),
                  );
                });
              }}
              onAcceptValidObjects={() => {
                setDrawDataWithHistory((s) => {
                  const validObjs = cloneDeep(drawData.objectList)
                    .filter((obj) => {
                      return obj.status !== EObjectStatus.Unchecked;
                    })
                    .map((obj) => {
                      obj.status = EObjectStatus.Commited;
                      return obj;
                    });
                  s.objectList = validObjs;
                  s.isBatchEditing = false;
                  s.activeObjectIndex = -1;
                  s.creatingObject = undefined;
                });
                setAiLabels([]);
              }}
              onCancelBatchEdit={() => {
                setDrawDataWithHistory((s) => {
                  const validObjs = cloneDeep(drawData.objectList).filter(
                    (obj) => {
                      return obj.status === EObjectStatus.Commited;
                    },
                  );
                  s.objectList = validObjs;
                  s.isBatchEditing = false;
                  s.activeObjectIndex = -1;
                  s.creatingObject = undefined;
                });
              }}
              onCreateCategory={onCreateCategory}
            />
            <ScaleToolBar
              scale={scale}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onReset={onReset}
              displayOption={editState.imageDisplayOptions}
              setBrightness={(v) => {
                setEditState((s) => {
                  s.imageDisplayOptions.brightness = v;
                });
              }}
              setContrast={(v) => {
                setEditState((s) => {
                  s.imageDisplayOptions.contrast = v;
                });
              }}
              setSaturate={(v) => {
                setEditState((s) => {
                  s.imageDisplayOptions.saturate = v;
                });
              }}
              resetOptions={() => {
                setEditState((s) => {
                  s.imageDisplayOptions = DEFAULT_IMG_DISPLAY_OPTIONS;
                });
              }}
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
                {showSubTools && (
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
            objects={commitedObjects}
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
              selectFocusObject(index);
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
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          {contextHolder}
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};

export default Edit;
