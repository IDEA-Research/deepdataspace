import Icon from '@ant-design/icons';
import { Slider } from 'antd';
import { useLocale } from 'dds-utils/locale';
import { useMemo } from 'react';

import { ReactComponent as AddPromptIcon } from '../assets/add-prompt.svg';
import { ReactComponent as BrushAddIcon } from '../assets/brush-add.svg';
import { ReactComponent as BrushEraseIcon } from '../assets/brush-erase.svg';
import { ReactComponent as EdgeStitchIcon } from '../assets/edge-stitch.svg';
import { ReactComponent as MagicBoxIcon } from '../assets/magic-box.svg';
import { ReactComponent as StrokeIcon } from '../assets/magic-brush.svg';
import { ReactComponent as ClickIcon } from '../assets/magic-click.svg';
import { ReactComponent as PenAddIcon } from '../assets/pen-add.svg';
import { ReactComponent as PenEraseIcon } from '../assets/pen-erase.svg';
import { ReactComponent as RemovePromptIcon } from '../assets/remove-prompt.svg';
import { ReactComponent as SegmentEverythingIcon } from '../assets/segment-everything.svg';
import {
  EBasicToolItem,
  EnumModelType,
  EObjectType,
  ESubToolItem,
} from '../constants';
import { TShortcutItem } from '../constants/shortcuts';
import { DrawData } from '../type';

export type TToolItem<T> = {
  key: T;
  name: string;
  shortcut?: TShortcutItem;
  icon: JSX.Element;
  available: boolean;
  description?: string;
  withSize?: boolean;
  withCustomElement?: boolean;
};

export type TSubtoolOptions = {
  basicTools: TToolItem<ESubToolItem>[];
  smartTools: TToolItem<ESubToolItem>[];
  customElement?: React.ReactNode;
};

interface IProps {
  drawData: DrawData;
  onChangePointResolution: (value: number, update?: boolean) => void;
}

const useSubTools = ({ drawData, onChangePointResolution }: IProps) => {
  const { localeText } = useLocale();

  const isSegEverythingAvailable = useMemo(() => {
    return (
      (drawData.objectList.length === 0 && !drawData.creatingObject) ||
      drawData.isBatchEditing
    );
  }, [drawData.objectList, drawData.creatingObject, drawData.isBatchEditing]);

  const isManualAvailable = useMemo(() => {
    return (
      !drawData.prompt.sessionId &&
      !(
        drawData.prompt.promptsQueue && drawData.prompt.promptsQueue.length > 0
      ) &&
      !drawData.isBatchEditing
    );
  }, [drawData.prompt, drawData.isBatchEditing]);

  const basicMaskTools: TToolItem<ESubToolItem>[] = useMemo(
    () => [
      {
        key: ESubToolItem.PenAdd,
        name: localeText('DDSAnnotator.subtoolbar.mask.penAdd'),
        icon: <Icon component={PenAddIcon} />,
        available: isManualAvailable,
      },
      {
        key: ESubToolItem.PenErase,
        name: localeText('DDSAnnotator.subtoolbar.mask.penErase'),
        icon: <Icon component={PenEraseIcon} />,
        available: isManualAvailable && !!drawData.creatingObject,
      },
      {
        key: ESubToolItem.BrushAdd,
        name: localeText('DDSAnnotator.subtoolbar.mask.brushAdd'),
        icon: <Icon component={BrushAddIcon} />,
        available: isManualAvailable,
        withSize: true,
      },
      {
        key: ESubToolItem.BrushErase,
        name: localeText('DDSAnnotator.subtoolbar.mask.brushErase'),
        icon: <Icon component={BrushEraseIcon} />,
        available: isManualAvailable && !!drawData.creatingObject,
        withSize: true,
      },
    ],
    [isManualAvailable, drawData.creatingObject],
  );

  const isgTools: TToolItem<ESubToolItem>[] = useMemo(() => {
    return [
      {
        key: ESubToolItem.AutoSegmentByBox,
        name: localeText('DDSAnnotator.subtoolbar.mask.box'),
        icon: <Icon component={MagicBoxIcon} />,
        available: true,
      },
      {
        key: ESubToolItem.AutoSegmentByStroke,
        name: localeText('DDSAnnotator.subtoolbar.mask.stroke'),
        icon: <Icon component={StrokeIcon} />,
        available: true,
        withSize: true,
      },
      {
        key: ESubToolItem.AutoSegmentByClick,
        name: localeText('DDSAnnotator.subtoolbar.mask.click'),
        icon: <Icon component={ClickIcon} />,
        available: true,
      },
    ];
  }, []);

  const smartPolygonTools: TToolItem<ESubToolItem>[] = useMemo(() => {
    return [
      {
        key: ESubToolItem.AutoSegmentByBox,
        name: localeText('DDSAnnotator.subtoolbar.mask.box'),
        icon: <Icon component={MagicBoxIcon} />,
        available: true,
        withCustomElement: true,
      },
      {
        key: ESubToolItem.AutoSegmentByStroke,
        name: localeText('DDSAnnotator.subtoolbar.mask.stroke'),
        icon: <Icon component={StrokeIcon} />,
        available: true,
        withSize: true,
        withCustomElement: true,
      },
      {
        key: ESubToolItem.AutoSegmentByClick,
        name: localeText('DDSAnnotator.subtoolbar.mask.click'),
        icon: <Icon component={ClickIcon} />,
        available: true,
        withCustomElement: true,
      },
    ];
  }, []);

  const ivpTools: TToolItem<ESubToolItem>[] = useMemo(() => {
    return [
      {
        key: ESubToolItem.PositiveVisualPrompt,
        name: localeText('DDSAnnotator.subtoolbar.visualprompt.positive'),
        icon: <Icon component={AddPromptIcon} />,
        available: true,
      },
      {
        key: ESubToolItem.NegativeVisualPrompt,
        name: localeText('DDSAnnotator.subtoolbar.visualprompt.negative'),
        icon: <Icon component={RemovePromptIcon} />,
        available: true,
      },
    ];
  }, []);

  const samTools: TToolItem<ESubToolItem>[] = useMemo(() => {
    return [
      {
        key: ESubToolItem.AutoSegmentEverything,
        name: localeText('DDSAnnotator.subtoolbar.mask.sam'),
        icon: <Icon component={SegmentEverythingIcon} />,
        available: isSegEverythingAvailable,
        description: isSegEverythingAvailable
          ? localeText('DDSAnnotator.subtoolbar.mask.sam.desc')
          : localeText('DDSAnnotator.subtoolbar.mask.sam.notAllow'),
      },
      {
        key: ESubToolItem.AutoEdgeStitching,
        name: localeText('DDSAnnotator.subtoolbar.mask.edgeStitch'),
        icon: <Icon component={EdgeStitchIcon} />,
        available: true,
        withSize: true,
      },
    ];
  }, [isSegEverythingAvailable]);

  const showSubTools = useMemo(() => {
    if (drawData.selectedTool === EBasicToolItem.Mask) return true;

    if (
      drawData.selectedTool === EBasicToolItem.Polygon &&
      drawData.AIAnnotation
    )
      return true;

    if (
      drawData.selectedTool === EBasicToolItem.Rectangle &&
      drawData.AIAnnotation &&
      drawData.selectedModel[drawData.selectedTool] === EnumModelType.IVP
    )
      return true;

    if (drawData.creatingObject?.type === EObjectType.Mask) return true;

    if (
      drawData.creatingObject?.type === EObjectType.Polygon &&
      drawData.AIAnnotation
    )
      return true;

    return false;
  }, [
    drawData.selectedTool,
    drawData.creatingObject,
    drawData.AIAnnotation,
    drawData.selectedModel,
  ]);

  const currSubTools: TSubtoolOptions = useMemo(() => {
    if (
      drawData.selectedTool === EBasicToolItem.Mask ||
      drawData.creatingObject?.type === EObjectType.Mask
    ) {
      if (!drawData.AIAnnotation) {
        return {
          basicTools: basicMaskTools,
          smartTools: [],
        };
      }

      const currModel = drawData.selectedModel[drawData.selectedTool];
      if (currModel === EnumModelType.IVP) {
        return {
          basicTools: [],
          smartTools: ivpTools,
        };
      } else if (currModel === EnumModelType.SegmentByMask) {
        return {
          basicTools: [],
          smartTools: isgTools,
        };
      } else if (currModel === EnumModelType.SegmentEverything) {
        return {
          basicTools: [],
          smartTools: samTools,
        };
      }
      return {
        basicTools: basicMaskTools,
        smartTools: [],
      };
    } else if (
      drawData.selectedTool === EBasicToolItem.Polygon ||
      drawData.creatingObject?.type === EObjectType.Polygon
    ) {
      return {
        basicTools: [],
        smartTools: smartPolygonTools,
        customElement: (
          <>
            <div className="dds-annotator-subtoolbar-title">
              {localeText('DDSAnnotator.subtoolbar.polygon.pointResolution')}
            </div>
            <div className="dds-annotator-subtoolbar-slider">
              <Slider
                min={0.1}
                max={0.9}
                step={0.1}
                value={drawData.pointResolution}
                onChange={onChangePointResolution}
                onAfterChange={(value) => onChangePointResolution(value, true)}
              />
            </div>
          </>
        ),
      };
    } else if (
      drawData.selectedTool === EBasicToolItem.Rectangle &&
      drawData.AIAnnotation &&
      drawData.selectedModel[drawData.selectedTool] === EnumModelType.IVP
    ) {
      return {
        basicTools: [],
        smartTools: ivpTools,
      };
    }
    return {
      basicTools: [],
      smartTools: [],
    };
  }, [
    drawData.selectedTool,
    drawData.creatingObject,
    drawData.AIAnnotation,
    drawData.selectedModel,
    smartPolygonTools,
    basicMaskTools,
    isgTools,
    samTools,
    ivpTools,
    drawData.pointResolution,
  ]);

  return {
    showSubTools,
    currSubTools,
  };
};

export default useSubTools;
