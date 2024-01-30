import Icon, { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useLocale } from 'dds-utils/locale';
import { useMemo } from 'react';

import { ReactComponent as DocsIcon } from '../assets/docs.svg';
import { ReactComponent as LogoIcon } from '../assets/logo.svg';
import DisplaySettings from '../components/DisplaySettings';
import EditorStatus from '../components/EditorStatus';
import LabelSelector from '../components/LabelSelector';
import ModelSelector from '../components/ModelSelector';
import { ShortcutsInfo } from '../components/ShortcutsInfo';
import SubToolBar from '../components/SubToolBar';
import TopTools from '../components/TopTools';
import {
  EBasicToolItem,
  EnumModelType,
  ESubToolItem,
  TOOL_MODELS_MAP,
} from '../constants';
import {
  DrawData,
  EditState,
  EditorMode,
  IImageDisplayOptions,
  IAnnotsDisplayOptions,
  Category,
} from '../type';

import { TSubtoolOptions } from './useSubtools';

interface IProps {
  isOldMode?: boolean;
  isSeperate?: boolean;
  mode: EditorMode;
  fileName?: string;
  drawData: DrawData;
  editState: EditState;
  hideTopBarActions?: boolean;
  titleElements?: React.ReactElement[];
  actionElements?: React.ReactElement[];
  enableReviewerModify?: boolean;
  labelOptions: Category[];
  showSubTools: boolean;
  currSubTools: TSubtoolOptions;
  topBarCenterElement?: React.ReactElement | null;
  labelColors?: Record<string, string>;
  selectSubTool: (tool: ESubToolItem) => void;
  onSelectModel: (type: EnumModelType) => void;
  setBrushSize: (size: number) => void;
  activeAIAnnotation: (active: boolean) => void;
  onChangeImageDisplayOpts: (value: IImageDisplayOptions) => void;
  onChangeAnnotsDisplayOpts: (value: IAnnotsDisplayOptions) => void;
  onChangeObjectLabel: (labelId: string) => void;
  onCreateCategory: (name: string) => void;
  onSaveAnnotations: () => Promise<void>;
  onCommitAnnotations: () => Promise<void>;
  onRejectAnnotations: () => Promise<void>;
  onAcceptAnnotations: () => Promise<void>;
  onModifyAnnotations: () => Promise<void>;
  onCancelAnnotations: () => Promise<void>;
}

const useTopTools = ({
  isOldMode,
  isSeperate,
  mode,
  fileName,
  drawData,
  editState,
  hideTopBarActions,
  titleElements,
  actionElements,
  enableReviewerModify,
  labelOptions,
  labelColors,
  showSubTools,
  currSubTools,
  topBarCenterElement,
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
}: IProps) => {
  const { localeText } = useLocale();
  const jumpDocs = () => {
    window.open('https://docs.deepdataspace.com');
  };

  const supportActions = useMemo(() => {
    const actions = actionElements
      ? actionElements.map((item) => ({ customElement: item }))
      : [];
    if (hideTopBarActions) return actions;
    if (mode === EditorMode.Review) {
      actions.push(
        ...[
          {
            customElement: (
              <Button type="primary" danger onClick={onRejectAnnotations}>
                {localeText('DDSAnnotator.reject')}
              </Button>
            ),
          },
          ...(isOldMode || !enableReviewerModify
            ? []
            : [
                {
                  customElement: (
                    <Button type="default" onClick={onModifyAnnotations}>
                      {localeText('DDSAnnotator.modify')}
                    </Button>
                  ),
                },
              ]),
          {
            customElement: (
              <Button type="primary" onClick={onAcceptAnnotations}>
                {localeText('DDSAnnotator.approve')}
              </Button>
            ),
          },
        ],
      );
    }
    if (mode === EditorMode.Edit && !isSeperate) {
      actions.push({
        customElement: (
          <Button type="default" onClick={onSaveAnnotations}>
            {localeText('DDSAnnotator.save')}
          </Button>
        ),
      });
      if (!isOldMode) {
        actions.push({
          customElement: (
            <Button type="primary" onClick={onCommitAnnotations}>
              {localeText('DDSAnnotator.commit')}
            </Button>
          ),
        });
      }
    }
    actions.unshift({
      customElement: (
        <>
          {mode === EditorMode.Edit && (
            <div className="dds-annotator-qk-actions">
              <Tooltip title={localeText('DDSAnnotator.docs')}>
                <Icon component={DocsIcon} onClick={jumpDocs} />
              </Tooltip>
              <DisplaySettings
                displayOption={editState.imageDisplayOptions}
                colorByCategory={editState.annotsDisplayOptions.colorByCategory}
                onChangeImageDisplayOpts={onChangeImageDisplayOpts}
                onChangeAnnotsDisplayOpts={onChangeAnnotsDisplayOpts}
              />
            </div>
          )}
          <ShortcutsInfo mode={mode} />
          <EditorStatus mode={mode} />
        </>
      ),
    });
    return actions;
  }, [
    mode,
    isOldMode,
    enableReviewerModify,
    hideTopBarActions,
    onSaveAnnotations,
    onCommitAnnotations,
    onCancelAnnotations,
    onRejectAnnotations,
    onAcceptAnnotations,
    onModifyAnnotations,
  ]);

  const leftTools = () => {
    const actions = [];
    if (titleElements) {
      actions.push(...titleElements.map((item) => ({ customElement: item })));
    } else {
      if (isSeperate || mode === EditorMode.Edit) {
        actions.push({
          customElement: (
            <Tooltip title={localeText('DDSAnnotator.exit')}>
              <LogoIcon
                className="dds-annotator-logo"
                onClick={onCancelAnnotations}
              />
            </Tooltip>
          ),
        });
      } else {
        actions.push({
          title: localeText('DDSAnnotator.exit'),
          icon: <ArrowLeftOutlined />,
          onClick: () => onCancelAnnotations(),
        });
      }
      if (mode !== EditorMode.Edit && fileName) {
        actions.push({ customElement: fileName });
      }
    }
    if (
      mode === EditorMode.Edit &&
      TOOL_MODELS_MAP[drawData.selectedTool] &&
      TOOL_MODELS_MAP[drawData.selectedTool].length > 1 &&
      drawData.AIAnnotation &&
      drawData.selectedModel
    ) {
      actions.push({
        customElement: (
          <ModelSelector
            selectedTool={drawData.selectedTool}
            selectedModel={drawData.selectedModel[drawData.selectedTool]}
            modelOptions={TOOL_MODELS_MAP[drawData.selectedTool]}
            onSelectModel={onSelectModel}
          />
        ),
      });
    }
    if (
      mode === EditorMode.Edit &&
      (drawData.objectList[drawData.activeObjectIndex] ||
        drawData.selectedTool !== EBasicToolItem.Drag)
    ) {
      actions.push({
        customElement: (
          <LabelSelector
            drawData={drawData}
            latestLabelId={editState.latestLabelId}
            isSeperate={isSeperate}
            labelOptions={labelOptions}
            labelColors={labelColors}
            onChangeObjectLabel={onChangeObjectLabel}
            onCreateCategory={onCreateCategory}
          />
        ),
      });
    }
    if (mode === EditorMode.Edit && showSubTools) {
      actions.push({
        customElement: (
          <SubToolBar
            toolOptions={currSubTools}
            selectedSubTool={drawData.selectedSubTool}
            isAIAnnotationActive={drawData.AIAnnotation}
            brushSize={drawData.brushSize}
            onChangeSubTool={selectSubTool}
            onChangeBrushSize={setBrushSize}
            onActiveAIAnnotation={activeAIAnnotation}
          />
        ),
      });
    }
    return actions;
  };

  const topToolsBar = (
    <TopTools leftTools={leftTools()} rightTools={supportActions}>
      {topBarCenterElement}
    </TopTools>
  );

  return {
    topToolsBar,
  };
};

export default useTopTools;
