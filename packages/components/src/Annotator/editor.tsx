import { Dropdown, Modal } from 'antd';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import { Updater, useImmer } from 'use-immer';

import AttributeEditor from './components/AttributeEditor';
import ClassificationPanel from './components/Classification';
import { ImageView } from './components/ImageView';
import ModelSelectModal from './components/ModelSelectModal';
import { ObjectList } from './components/ObjectList';
import PointsEditModal from './components/PointsEditModal';
import SegConfirmModal from './components/SegConfirmModal';
import SliderToolBar from './components/SliderToolBar';
import SmartAnnotationControl from './components/SmartAnnotationControl';
import { TopPagination } from './components/TopPagination';
import { DisplayOption, EBasicToolItem, TOOL_MODELS_MAP } from './constants';
import useActions from './hooks/useActions';
import useAttributes from './hooks/useAttributes';
import useCanvasContainer from './hooks/useCanvasContainer';
import useCanvasRender from './hooks/useCanvasRender';
import useColor from './hooks/useColor';
import useDataEffect from './hooks/useDataEffect';
import useHistory from './hooks/useHistory';
import useLabels from './hooks/useLabels';
import useMouseCursor from './hooks/useMouseCursor';
import useMouseEvents from './hooks/useMouseEvents';
import useObjects from './hooks/useObjects';
import useShortcuts from './hooks/useShortcuts';
import useSubTools from './hooks/useSubtools';
import useToolActions from './hooks/useToolActions';
import useTopTools from './hooks/useTopTools';
import useTranslate from './hooks/useTranslate';
import { useToolInstances } from './tools/base';
import {
  BaseObject,
  Category,
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  AnnoItem,
  EditState,
  EditorMode,
  DrawObject,
} from './type';

import './index.less';

export interface EditProps {
  isOldMode?: boolean; // is old dataset design mode
  isSeperate?: boolean; // is quickmode single editor
  theme?: 'light' | 'dark';
  visible: boolean;
  mode: EditorMode;
  enableReviewerModify?: boolean;
  limitToolTypes?: EBasicToolItem[];
  categories: Category[];
  list: AnnoItem[];
  current: number;
  pagination?: {
    show: boolean;
    total: number;
    customText?: React.ReactElement;
    customDisableNext?: boolean;
  };
  titleElements?: React.ReactElement[];
  actionElements?: React.ReactElement[];
  layoutOptions?: {
    wrapHeight?: string;
    hideRightList?: boolean;
    hideMainToolBar?: boolean;
    hideTopBar?: boolean;
    hideTopBarActions?: boolean;
    hideUndoRedoActions?: boolean;
    hideReferenceLine?: boolean;
    minPadding?: {
      top: number;
      left: number;
    };
  };
  displayOptionsResult?: { [key in DisplayOption]?: boolean };
  manualMode?: boolean;
  forceColorByObject?: boolean;
  limitActiveObject?: boolean;
  limitActiveObjectAfterCreate?: boolean;
  customDefaultDrawData?: Partial<DrawData>;
  customDefaultEditState?: EditState;
  customDrawData?: DrawData;
  customEditState?: EditState;
  customObjects?: DrawObject[];
  customObjectsFilter?: (imageData: any) => BaseObject[];
  objectsFilter?: (imageData: any) => BaseObject[];
  onAutoSave?: (annotations: BaseObject[], naturalSize: ISize) => void;
  onCancel?: () => void;
  onSave?: (id: string, labels: any[]) => Promise<void>;
  onCommit?: (id: string, labels: any[]) => Promise<void>;
  onReviewModify?: (id: string, labels: any[]) => Promise<void>;
  onReviewAccept?: (id: string, labels: any[]) => Promise<void>;
  onReviewReject?: (id: string, labels: any[]) => Promise<void>;
  onPrev?: () => Promise<void>;
  onNext?: () => Promise<void>;
  setCategories?: Updater<Category[]>;
}

const Edit: React.FC<EditProps> = (props) => {
  const {
    theme = 'dark',
    isOldMode,
    isSeperate,
    visible,
    categories,
    list,
    current,
    pagination,
    mode,
    enableReviewerModify,
    limitToolTypes,
    titleElements,
    actionElements,
    layoutOptions,
    displayOptionsResult,
    manualMode,
    forceColorByObject,
    limitActiveObject,
    limitActiveObjectAfterCreate,
    customDefaultDrawData,
    onPrev,
    onNext,
    onCancel,
    onSave,
    onCommit,
    onReviewModify,
    onReviewAccept,
    onReviewReject,
    setCategories,
    onAutoSave,
    objectsFilter,
  } = props;
  const [modal, contextHolder] = Modal.useModal();

  const [annotations, setAnnotations] = useImmer<DrawObject[]>([]);

  const [editState, setEditState] = useImmer<EditState>(
    cloneDeep(DEFAULT_EDIT_STATE),
  );

  const [drawData, setDrawData] = useImmer<DrawData>({
    ...cloneDeep(DEFAULT_DRAW_DATA),
    ...customDefaultDrawData,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const currAnnoItem = useMemo(() => {
    return list[current];
  }, [list, current]);

  const currImageItem = currAnnoItem;

  const { getAnnotColor, labelColors } = useColor({
    categories,
    editState,
    forceColorByObject,
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
    drawData,
    allowMove: editState.allowMove,
    isRequiring: editState.isRequiring,
    minPadding: layoutOptions?.minPadding || {
      top: 30,
      left: 80,
    },
    cursorSize: drawData.brushSize,
    hideReferenceLine: !!layoutOptions?.hideReferenceLine,
  });

  const { translateObject, translateToObject } = useTranslate({
    isOldMode,
    clientSize,
    naturalSize,
    categories,
    getAnnotColor,
  });

  const {
    undo,
    redo,
    clearHistory,
    flagSaved,
    hadChangeRecord,
    updateHistory,
    setDrawDataWithHistory,
  } = useHistory({
    clientSize,
    naturalSize,
    setDrawData,
    onAutoSave,
    translateObject,
  });

  const { judgeEditingAttribute, onConfirmAttibuteEdit, onCancelAttibuteEdit } =
    useAttributes({
      setDrawDataWithHistory,
      categories,
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
    commitedObjects,
    currObject,
  } = useObjects({
    annotations,
    setAnnotations,
    drawData,
    setDrawData,
    setDrawDataWithHistory,
    setEditState,
    mode,
    translateToObject,
    judgeEditingAttribute,
    limitActiveObjectAfterCreate,
    updateHistory,
  });

  const {
    labelOptions,
    classificationOptions,
    aiLabels,
    setAiLabels,
    onChangeObjectHidden,
    onChangeCategoryHidden,
    onChangeActiveClass,
    onCreateCategory,
    onChangePointVisible,
  } = useLabels({
    isOldMode,
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
    onCommitAnnotations,
    onCancelAnnotations,
    onRejectAnnotations,
    onAcceptAnnotations,
    onModifyAnnotations,
  } = useActions({
    mode,
    currImageItem,
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
    hadChangeRecord,
    getAnnotColor,
    categories,
    translateObject,
    flagSaved,
    onCancel,
    onSave,
    onCommit,
    onReviewModify,
    onReviewAccept,
    onReviewReject,
    classificationOptions,
  });

  const { updateMouseCursor } = useMouseCursor({
    topCanvas: activeCanvasRef.current,
    editState,
    drawData,
  });

  const {
    onChangeObjectLabel,
    onFinishCurrCreate,
    onAcceptValidObjects,
    onAbortBatchObjects,
    selectTool,
    selectSubTool,
    forceChangeTool,
    onExitAIAnnotation,
    setBrushSize,
    activeAIAnnotation,
    onChangeSkeletonConf,
    onChangeLimitConf,
    onChangeAnnotsDisplayOpts,
    onChangeImageDisplayOpts,
    onChangeColorMode,
    onChangePointResolution,
    onSelectModel,
  } = useToolActions({
    mode,
    manualMode: !!manualMode,
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
    updateObject,
    updateAllObject,
    onAiAnnotation,
  });

  const { showSubTools, currSubTools } = useSubTools({
    drawData,
    onChangePointResolution,
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
    categories,
    displayOptionsResult,
  });

  const { updateRender, renderPopoverMenu } = useCanvasRender({
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
    limitActiveObject,
  });

  useShortcuts({
    visible,
    mode,
    drawData,
    categories,
    isMousePress,
    setDrawData,
    setEditState,
    onSaveAnnotations,
    onAcceptAnnotations,
    onRejectAnnotations,
    onChangeObjectHidden,
    onChangeCategoryHidden,
    removeObject,
    addObject,
  });

  const { resetDataWithImageData } = useDataEffect({
    imagePos,
    clientSize,
    naturalSize,
    annotations,
    setAnnotations,
    drawData,
    setDrawData,
    editState,
    setEditState,
    initObjectList,
    updateRender,
    clearHistory,
    objectsFilter,
    labelOptions,
    customDefaultDrawData,
  });

  // =================================================================================================================
  // Effects
  // =================================================================================================================

  /** Limit bottom layer body scroll */
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : 'overlay';
    return () => {
      document.body.style.overflow = 'overlay';
    };
  }, [visible]);

  /** Reset data when hiding the editor or switching images */
  useEffect(() => {
    resetDataWithImageData(currImageItem, visible);
  }, [visible, mode, current, currImageItem?.id, objectsFilter]);

  useEffect(() => {
    onChangeColorMode();
  }, [editState.annotsDisplayOptions.colorByCategory]);

  // =================================================================================================================
  // Render
  // =================================================================================================================

  const fileName = useMemo(() => {
    if (currAnnoItem?.name) return currAnnoItem?.name;
    if (currAnnoItem?.url && currAnnoItem?.url.indexOf('http') === 0) {
      const url = decodeURIComponent(currAnnoItem?.url);
      return url.replace(/\?.*$/, '').split('/').pop() || '';
    }
    return '';
  }, [currAnnoItem]);

  const topBarCenterElement =
    pagination && pagination.show ? (
      <TopPagination
        list={list}
        current={current}
        total={pagination.total}
        customText={pagination.customText}
        customDisableNext={pagination.customDisableNext}
        onPrev={onPrev}
        onNext={onNext}
      />
    ) : null;

  const { topToolsBar } = useTopTools({
    isOldMode,
    isSeperate,
    mode,
    hideTopBarActions: layoutOptions?.hideTopBarActions,
    fileName,
    drawData,
    editState,
    titleElements,
    actionElements,
    enableReviewerModify,
    labelOptions,
    showSubTools,
    currSubTools,
    topBarCenterElement,
    labelColors,
    selectSubTool,
    setBrushSize,
    activeAIAnnotation,
    onChangeImageDisplayOpts,
    onChangeAnnotsDisplayOpts,
    onChangeObjectLabel,
    onCreateCategory,
    onSaveAnnotations,
    onCommitAnnotations,
    onRejectAnnotations,
    onAcceptAnnotations,
    onModifyAnnotations,
    onCancelAnnotations,
    onSelectModel,
  });

  if (!visible) {
    return null;
  }

  return (
    <div
      className={classNames(
        'dds-annotator',
        'dds-annotator-editor',
        `dds-annotator-editor-${theme}`,
      )}
      style={{
        height: layoutOptions?.wrapHeight || '100vh',
      }}
    >
      {!layoutOptions?.hideTopBar && topToolsBar}
      <div
        className="editor-container"
        style={{ top: layoutOptions?.hideTopBar ? '0' : '' }}
      >
        {!layoutOptions?.hideMainToolBar && (
          <SliderToolBar
            onlySupportZoom={mode !== EditorMode.Edit}
            selectedTool={drawData.selectedTool}
            manualMode={!!manualMode}
            limitToolTypes={limitToolTypes}
            isAIAnnotationActive={drawData.AIAnnotation}
            onChangeSelectedTool={selectTool}
            onActiveAIAnnotation={activeAIAnnotation}
            hideUndoRedoActions={layoutOptions?.hideUndoRedoActions}
            undo={undo}
            redo={redo}
            deleteAll={removeAllObjects}
            scale={scale}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onReset}
          />
        )}
        <div className="center-content">
          {currImageItem && (
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
                      url={currImageItem?.url}
                      imgRef={imgRef}
                      canvasRef={canvasRef}
                      activeCanvasRef={activeCanvasRef}
                      clientSize={clientSize}
                      imagePos={imagePos}
                      onLoad={(event) => {
                        // Possibly size not changed but image changed
                        updateRender();
                        onLoadImg(event);
                      }}
                    />
                    {renderPopoverMenu()}
                  </>
                ),
              })}
            </Dropdown>
          )}
          <SegConfirmModal
            mode={mode}
            isAiAnnotation={drawData.AIAnnotation}
            latestLabelId={editState.latestLabelId}
            currObject={currObject}
            onFinishCurrCreate={onFinishCurrCreate}
          />
          <PointsEditModal
            mode={mode}
            isAiAnnotation={drawData.AIAnnotation}
            currObject={currObject}
            currObjectIndex={drawData.activeObjectIndex}
            focusObjectIndex={editState.focusObjectIndex}
            focusEleType={editState.focusEleType}
            focusEleIndex={editState.focusEleIndex}
            onChangePointVisible={onChangePointVisible}
            setEditState={setEditState}
          />
          <SmartAnnotationControl
            selectedTool={drawData.selectedTool}
            selectedSubTool={drawData.selectedSubTool}
            selectedModel={drawData.selectedModel[drawData.selectedTool]}
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
            onChangeConfidenceRange={onChangeSkeletonConf}
            onChangeLimitConf={onChangeLimitConf}
            onAcceptValidObjects={onAcceptValidObjects}
            onCancelBatchEdit={onAbortBatchObjects}
          />
          <ModelSelectModal
            AIAnnotation={drawData.AIAnnotation}
            modelOptions={TOOL_MODELS_MAP[drawData.selectedTool]}
            selectedModel={drawData.selectedModel[drawData.selectedTool]}
            onSelectModel={onSelectModel}
            onCloseModal={() =>
              setDrawData((s) => {
                s.AIAnnotation = false;
              })
            }
          />
          {drawData.editingAttribute && (
            <AttributeEditor
              data={drawData.editingAttribute}
              supportEdit={mode === EditorMode.Edit}
              onConfirmAttibuteEdit={onConfirmAttibuteEdit}
              onCancelAttibuteEdit={onCancelAttibuteEdit}
            />
          )}
        </div>
        {!layoutOptions?.hideRightList && (
          <div className="right-slider">
            {classificationOptions.length > 0 && (
              <ClassificationPanel
                className="classifications"
                supportEdit={mode === EditorMode.Edit}
                classificationOptions={classificationOptions}
                values={drawData.classifications}
                setDrawDataWithHistory={setDrawDataWithHistory}
              />
            )}
            <ObjectList
              supportEdit={mode === EditorMode.Edit}
              className="object-list"
              objects={commitedObjects}
              categories={categories}
              activeObjectIndex={drawData.activeObjectIndex}
              activeClassName={drawData.activeClassName}
              onFocusObject={forceChangeFocusObject}
              onActiveObject={selectFocusObject}
              onChangeObjectHidden={onChangeObjectHidden}
              onChangeCategoryHidden={onChangeCategoryHidden}
              onDeleteObject={removeObject}
              onChangeActiveClassName={onChangeActiveClass}
              setDrawDataWithHistory={setDrawDataWithHistory}
              colorByCategory={editState.annotsDisplayOptions.colorByCategory}
              onChangeAnnotsDisplayOpts={onChangeAnnotsDisplayOpts}
            />
          </div>
        )}
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
};

export default Edit;
