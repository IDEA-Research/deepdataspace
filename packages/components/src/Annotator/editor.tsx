import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, Divider, Dropdown, Modal } from 'antd';
import {
  EObjectType,
  EElementType,
  EBasicToolItem,
  ESubToolItem,
} from './constants';
import { Updater, useImmer } from 'use-immer';
import TopTools from './components/TopTools';
import useLabels from './hooks/useLabels';
import useActions from './hooks/useActions';
import PopoverMenu from './components/PopoverMenu';
import { ObjectList } from './components/ObjectList';
import { MainToolBar } from './components/MainToolBar';
import SmartAnnotationControl from './components/SmartAnnotationControl';
import { ScaleToolBar } from './components/ScaleToolBar';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { TopPagination } from './components/TopPagination';
import { AnnotationEditor } from './components/AnnotationEditor';
import { ShortcutsInfo } from './components/ShortcutsInfo';
import useHistory from './hooks/useHistory';
import useObjects from './hooks/useObjects';
import useCanvasContainer from './hooks/useCanvasContainer';
import usePreviousState from './hooks/usePreviousState';
import { cloneDeep } from 'lodash';
import { useLocale } from 'dds-utils/locale';
import { SubToolBar } from './components/SubToolBar';
import {
  BaseObject,
  Category,
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  DrawImageData,
  EditState,
  EditorMode,
  EObjectStatus,
  DrawObject,
  EQaAction,
} from './type';
import useMouseCursor from './hooks/useMouseCursor';
import useShortcuts from './hooks/useShortcuts';
import useToolActions from './hooks/useToolActions';
import useMouseEvents from './hooks/useMouseEvents';
import useCanvasRender from './hooks/useCanvasRender';
import useDataEffect from './hooks/useDataEffect';
import { useToolInstances } from './tools/base';
import useColor from './hooks/useColor';
import { ImageView } from './components/ImageView';
import './index.less';

export interface EditProps {
  isSeperate: boolean;
  visible: boolean;
  mode: EditorMode;
  categories: Category[];
  list: DrawImageData[];
  current: number;
  pagination?: {
    show: boolean;
    total: number;
    customText?: React.ReactElement;
    customDisableNext?: boolean;
  };
  actionElements?: React.ReactElement[];
  objectsFilter?: (imageData: any) => BaseObject[];
  onCancel?: () => void;
  onSave?: (imageId: string, annotations: BaseObject[]) => Promise<void>;
  onAutoSave?: (annotations: BaseObject[], naturalSize: ISize) => void;
  onReviewResult?: (imageId: string, action: EQaAction) => Promise<void>;
  onEnterEdit?: () => void;
  onPrev?: () => Promise<void>;
  onNext?: () => Promise<void>;
  setCategories?: Updater<Category[]>;
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
    setCategories,
    onAutoSave,
    objectsFilter,
  } = props;

  const { localeText } = useLocale();
  const [modal, contextHolder] = Modal.useModal();

  const [annotations, setAnnotations] = useImmer<DrawObject[]>([]);

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
    const isToolWithSize = [
      ESubToolItem.AutoEdgeStitching,
      ESubToolItem.AutoSegmentByStroke,
      ESubToolItem.BrushAdd,
      ESubToolItem.BrushErase,
    ].includes(drawData.selectedSubTool);

    if (
      drawData.creatingObject &&
      drawData.activeObjectIndex > -1 &&
      drawData.creatingObject.type === EObjectType.Mask
    ) {
      return isToolWithSize;
    }
    if (
      drawData.selectedTool !== EBasicToolItem.Drag &&
      !drawData.isBatchEditing
    ) {
      return drawData.selectedTool === EBasicToolItem.Mask && isToolWithSize;
    }
    return false;
  }, [drawData.selectedTool, drawData.selectedSubTool]);

  const showReferenceLine = useMemo(() => {
    return (
      drawData.selectedTool !== EBasicToolItem.Drag && !isCustomCursorActive
    );
  }, [drawData.selectedTool, isCustomCursorActive]);

  const { labelColors, getAnnotColor } = useColor({
    categories,
    editState,
  });

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
    onChangeObjectHidden,
    onChangeCategoryHidden,
    onChangeActiveClass,
    onCreateCategory,
    onChangePointVisible
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
    drawData,
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
    getAnnotColor,
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
    onAcceptValidObjects,
    onAbortBatchObjects,
    selectTool,
    selectSubTool,
    forceChangeTool,
    onExitAIAnnotation,
    setBrushSize,
    activeAIAnnotation,
    onSaveAIPolygon,
    onCancelAIPolygon,
    onChangeSkeletonConf,
    onChangeLimitConf,
    onChangeAnnotsDisplayOpts,
    onChangeImageDisplayOpts,
    onChangeColorMode,
  } = useToolActions({
    mode,
    drawData,
    setDrawData,
    setDrawDataWithHistory,
    setAiLabels,
    editState,
    setEditState,
    getAnnotColor,
    clientSize,
    naturalSize,
    addObject,
    removeObject,
    updateObject,
    updateAllObject,
  });

  const { objectHooksMap } = useToolInstances({
    imgRef,
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
    getAnnotColor,
  });

  const { updateRender } = useCanvasRender({
    visible,
    drawData,
    editState,
    clientSize,
    imagePos,
    containerMouse,
    canvasRef,
    activeCanvasRef,
    imgRef,
    objectHooksMap,
  });

  const {
    selectFocusObject,
    forceChangeFocusObject,
    mouseRightObjectsDropDownRender,
  } = useMouseEvents({
    visible,
    mode,
    drawData,
    setDrawData,
    editState,
    setEditState,
    clientSize,
    contentMouse,
    categories,
    updateRender,
    updateMouseCursor,
    objectHooksMap,
    imagePos,
    containerMouse,
    getAnnotColor,
  });

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
    addObject,
  });

  const { resetDataWithImageData } = useDataEffect({
    imagePos,
    clientSize,
    preClientSize,
    clearPreClientSize,
    naturalSize,
    annotations,
    setAnnotations,
    labelColors,
    drawData,
    setDrawData,
    editState,
    setEditState,
    initObjectList,
    updateRender,
    clearHistory,
    objectsFilter,
  });

  /** Copy annots from previous image  */
  const repeatPrevious = useCallback(() => {
    if (current > 0 && current < list.length) {
      resetDataWithImageData(list[current - 1], visible, false);
    }
  }, [resetDataWithImageData, list, current, visible]);

  // =================================================================================================================
  // Effects
  // =================================================================================================================

  /** Limit bottom layer body scroll */
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : 'overlay';
  }, [visible]);

  /** Reset data when hiding the editor or switching images */
  useEffect(() => {
    resetDataWithImageData(list[current], visible);
  }, [visible, mode, current, objectsFilter]);

  useEffect(() => {
    onChangeColorMode();
  }, [editState.annotsDisplayOptions.colorByCategory]);

  // =================================================================================================================
  // Render
  // =================================================================================================================

  const fileName = useMemo(() => {
    if (
      list[current]?.urlFullRes &&
      list[current]?.urlFullRes.indexOf('http') === 0
    ) {
      const url = decodeURIComponent(list[current]?.urlFullRes);
      return url.replace(/\?.*$/, '').split('/').pop() || '';
    }
    return '';
  }, [list, current]);

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
                {localeText('DDSAnnotator.reject')}
              </Button>
            ),
          },
          {
            customElement: (
              <Button type="primary" onClick={onAccept}>
                {localeText('DDSAnnotator.approve')}
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
                {localeText('DDSAnnotator.save')}
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
      <div className="dds-annotator dds-annotator-editor">
        <TopTools
          leftTools={[
            ...(isSeperate
              ? []
              : [
                  {
                    title: localeText('DDSAnnotator.exit'),
                    icon: <ArrowLeftOutlined />,
                    onClick: () => onCancelAnnotations(),
                  },
                ]),
            {
              customElement: fileName,
            },
          ]}
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
        <div className="editor-container">
          <div className="left-slider"></div>
          <div className="center-content">
            <Dropdown
              dropdownRender={mouseRightObjectsDropDownRender}
              trigger={['contextMenu']}
              open={editState.foucsObjectAllIndexs.length > 0}
            >
              {CanvasContainer({
                className: 'edit-wrap',
                children: (
                  <>
                    <ImageView
                      url={list[current]?.urlFullRes}
                      imgRef={imgRef}
                      canvasRef={canvasRef}
                      activeCanvasRef={activeCanvasRef}
                      clientSize={clientSize}
                      imagePos={imagePos}
                      onLoad={onLoadImg}
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
                currObjectIndex={drawData.activeObjectIndex}
                focusObjectIndex={editState.focusObjectIndex}
                focusEleType={editState.focusEleType}
                focusEleIndex={editState.focusEleIndex}
                onCreateCategory={onCreateCategory}
                onDeleteCurrObject={onDeleteCurrObject}
                onFinishCurrCreate={onFinishCurrCreate}
                onCloseAnnotationEditor={onCloseAnnotationEditor}
                onChangePointVisible={onChangePointVisible}
              />
            )}
            <SmartAnnotationControl
              selectedTool={drawData.selectedTool}
              selectedSubTool={drawData.selectedSubTool}
              isBatchEditing={drawData.isBatchEditing}
              AIAnnotation={drawData.AIAnnotation}
              hasPolygonPreds={!!drawData.creatingObject?.polygon}
              isCtrlPressed={editState.isCtrlPressed}
              limitConf={drawData.limitConf}
              aiLabels={aiLabels}
              naturalSize={naturalSize}
              categories={categories}
              setAiLabels={setAiLabels}
              forceChangeTool={forceChangeTool}
              onAiAnnotation={onAiAnnotation}
              onExitAIAnnotation={onExitAIAnnotation}
              onSaveAIPolygon={onSaveAIPolygon}
              onCancelAIPolygon={onCancelAIPolygon}
              onChangeConfidenceRange={onChangeSkeletonConf}
              onChangeLimitConf={onChangeLimitConf}
              onAcceptValidObjects={onAcceptValidObjects}
              onCancelBatchEdit={onAbortBatchObjects}
              onCreateCategory={onCreateCategory}
            />
            <ScaleToolBar
              scale={scale}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onReset={onReset}
              displayOption={editState.imageDisplayOptions}
              colorByCategory={editState.annotsDisplayOptions.colorByCategory}
              onChangeImageDisplayOpts={onChangeImageDisplayOpts}
              onChangeAnnotsDisplayOpts={onChangeAnnotsDisplayOpts}
            />
            {mode === EditorMode.Edit && (
              <>
                <MainToolBar
                  selectedTool={drawData.selectedTool}
                  isAIAnnotationActive={drawData.AIAnnotation}
                  onChangeSelectedTool={selectTool}
                  onActiveAIAnnotation={activeAIAnnotation}
                  undo={undo}
                  redo={redo}
                  repeatPrevious={repeatPrevious}
                  deleteAll={removeAllObjects}
                />
                {showSubTools && (
                  <SubToolBar
                    selectedSubTool={drawData.selectedSubTool}
                    isAIAnnotationActive={drawData.AIAnnotation}
                    isSegEverythingAvailable={
                      (drawData.objectList.length === 0 &&
                        !drawData.creatingObject) ||
                      drawData.isBatchEditing
                    }
                    isManualAvailable={
                      !drawData.prompt.segmentationMask &&
                      !(
                        drawData.prompt.maskPrompts &&
                        drawData.prompt.maskPrompts.length > 0
                      ) &&
                      !drawData.isBatchEditing
                    }
                    brushSize={drawData.brushSize}
                    onChangeSubTool={selectSubTool}
                    onChangeBrushSize={setBrushSize}
                    onActiveAIAnnotation={activeAIAnnotation}
                  />
                )}
              </>
            )}
          </div>
          <ObjectList
            supportEdit={mode === EditorMode.Edit}
            className="right-slider"
            objects={commitedObjects}
            labelColors={labelColors}
            activeObjectIndex={drawData.activeObjectIndex}
            activeClassName={drawData.activeClassName}
            onFocusObject={forceChangeFocusObject}
            onActiveObject={selectFocusObject}
            onChangeObjectHidden={onChangeObjectHidden}
            onChangeCategoryHidden={onChangeCategoryHidden}
            onDeleteObject={removeObject}
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
