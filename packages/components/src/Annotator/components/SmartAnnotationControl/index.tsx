import {
  OBJECT_ICON,
  EBasicToolItem,
  EObjectType,
  EDITOR_TOOL_ICON,
  EActionToolItem,
  ESubToolItem,
  EToolType,
} from '../../constants';
import { CloseOutlined } from '@ant-design/icons';
import Icon from '@ant-design/icons/lib/components/Icon';
import { Button, Card, Select, Slider, Space } from 'antd';
import classNames from 'classnames';
import { useMemo, memo } from 'react';
import { FloatWrapper } from '../FloatWrapper';
import { useLocale } from 'dds-utils/locale';
import CategoryCreator from '../CategoryCreator';
import { OnAiAnnotationFunc } from '../../hooks/useActions';
import { useImmer } from 'use-immer';
import { ReactComponent as DragToolIcon } from '../../assets/drag.svg';
import { ReactComponent as MouseLeftIcon } from '../../assets/mouse-left.svg';
import { ReactComponent as MouseRightIcon } from '../../assets/mouse-right.svg';
import { Category } from '../../type';
import './index.less';

interface IProps {
  selectedTool: EToolType;
  selectedSubTool: ESubToolItem;
  AIAnnotation: boolean;
  hasPolygonPreds: boolean;
  isBatchEditing: boolean;
  isCtrlPressed: boolean;
  naturalSize: ISize;
  aiLabels: string[];
  limitConf: number;
  categories: Category[];
  setAiLabels: (labels: string[]) => void;
  forceChangeTool: (tool: EBasicToolItem, subtool: ESubToolItem) => void;
  onCreateCategory: (name: string) => void;
  onExitAIAnnotation: () => void;
  onAiAnnotation: OnAiAnnotationFunc;
  onSaveAIPolygon: () => void;
  onCancelAIPolygon: () => void;
  onChangeConfidenceRange: (range: [number, number]) => void;
  onChangeLimitConf: (value: number) => void;
  onAcceptValidObjects: () => void;
  onCancelBatchEdit: () => void;
}

const SmartAnnotationControl: React.FC<IProps> = memo(
  ({
    selectedTool,
    selectedSubTool,
    AIAnnotation,
    hasPolygonPreds,
    isBatchEditing,
    isCtrlPressed,
    aiLabels,
    categories,
    naturalSize,
    limitConf,
    setAiLabels,
    onCreateCategory,
    onExitAIAnnotation,
    onAiAnnotation,
    onSaveAIPolygon,
    onCancelAIPolygon,
    onChangeConfidenceRange,
    onChangeLimitConf,
    onAcceptValidObjects,
    onCancelBatchEdit,
    forceChangeTool,
  }) => {
    const { localeText } = useLocale();

    /** Parameters for requesting segmemt everything API */
    const [samParams, setSamParams] = useImmer({
      predIouThresh: 0.89,
      pointsPerSide: 32,
      minMaskRegionArea: 300,
    });

    const titleMap = {
      [EBasicToolItem.Drag]: {
        name: localeText('DDSAnnotator.shortcuts.tools.drag'),
        icon: DragToolIcon,
      },
      [EBasicToolItem.Rectangle]: {
        name: localeText('DDSAnnotator.smart.detection.name'),
        icon: OBJECT_ICON[EObjectType.Rectangle],
      },
      [EBasicToolItem.Polygon]: {
        name: localeText('DDSAnnotator.smart.segmentation.name'),
        icon: OBJECT_ICON[EObjectType.Polygon],
      },
      [EBasicToolItem.Skeleton]: {
        name: localeText('DDSAnnotator.smart.pose.name'),
        icon: OBJECT_ICON[EObjectType.Skeleton],
      },
      [EBasicToolItem.Mask]: {
        name: localeText('DDSAnnotator.smart.mask.name'),
        icon: OBJECT_ICON[EObjectType.Mask],
      },
    };

    const labelOptions = useMemo(() => {
      if (selectedTool === EBasicToolItem.Rectangle) {
        return categories?.map((category) => (
          <Select.Option key={category.id} value={category.name}>
            {category.name}
          </Select.Option>
        ));
      } else if (selectedTool === EBasicToolItem.Polygon) {
        return [];
      } else if (selectedTool === EBasicToolItem.Skeleton) {
        return ['person'].map((label) => (
          <Select.Option key={label} value={label}>
            {label}
          </Select.Option>
        ));
      }
    }, [selectedTool, categories]);

    const mouseEventHandler = (event: React.MouseEvent) => {
      if (
        event.type === 'mouseup' &&
        (selectedTool === EBasicToolItem.Skeleton ||
          (selectedTool === EBasicToolItem.Mask &&
            selectedSubTool === ESubToolItem.AutoSegmentEverything) ||
          selectedTool === EBasicToolItem.Rectangle)
      ) {
        event.preventDefault();
        return;
      } else {
        event.stopPropagation();
      }
    };

    const isVisible = useMemo(() => {
      if (!AIAnnotation || selectedTool === EBasicToolItem.Drag) return false;

      if (
        selectedTool === EBasicToolItem.Mask &&
        selectedSubTool !== ESubToolItem.AutoSegmentEverything
      )
        return false;

      if (
        selectedTool === EBasicToolItem.Rectangle &&
        isBatchEditing &&
        isCtrlPressed
      )
        return false;

      return true;
    }, [
      selectedTool,
      selectedSubTool,
      AIAnnotation,
      isBatchEditing,
      isCtrlPressed,
    ]);

    const onApplyCurrMaskObjs = () => {
      onAcceptValidObjects();
      forceChangeTool(EBasicToolItem.Drag, ESubToolItem.PenAdd);
    };

    const aiDetectionTip = useMemo(() => {
      if (isBatchEditing && isCtrlPressed) {
        return [
          {
            text: localeText('DDSAnnotator.smart.tip.recover'),
            logo: <MouseLeftIcon />,
          },
          {
            text: localeText('DDSAnnotator.smart.tip.overlayobject'),
            logo: <MouseRightIcon />,
          },
        ];
      }
      return [];
    }, [isBatchEditing, isCtrlPressed]);

    const imageArea = useMemo(() => {
      return naturalSize.width * naturalSize.height;
    }, [naturalSize]);

    return (
      <FloatWrapper eventHandler={mouseEventHandler}>
        {aiDetectionTip.length > 0 && (
          <div className="dds-annotator-operation-tip">
            {aiDetectionTip.map((item) => (
              <div key={item.text} className="dds-annotator-operation-tip-item">
                <span>{item.text}</span>
                {item.logo}
              </div>
            ))}
          </div>
        )}
        <Card
          id="smart-annotation-editor"
          className={classNames('dds-annotator-smart-container', {
            'dds-annotator-smart-container-visible': isVisible,
          })}
          title={
            <div className="dds-annotator-smart-container-title">
              <div className="dds-annotator-smart-container-title-icon">
                <Icon
                  component={EDITOR_TOOL_ICON[EActionToolItem.SmartAnnotation]}
                />
                <div>{titleMap[selectedTool].name}</div>
              </div>
              <Button
                ghost
                className="dds-annotator-smart-container-btn"
                icon={<CloseOutlined />}
                shape="circle"
                size="small"
                onClick={() => {
                  onExitAIAnnotation();
                  forceChangeTool(selectedTool, ESubToolItem.PenAdd);
                }}
              ></Button>
            </div>
          }
        >
          <div className="dds-annotator-smart-container-content">
            {selectedTool === EBasicToolItem.Rectangle &&
              (isBatchEditing ? (
                <div className="dds-annotator-smart-container-content-column-item">
                  <div className="dds-annotator-smart-container-content-param-controls">
                    <div className="dds-annotator-smart-container-content-param-item">
                      <div className="dds-annotator-smart-container-content-param-item-title">
                        {localeText('DDSAnnotator.smart.detection.confidence')}:
                      </div>
                      <Slider
                        className="dds-annotator-smart-container-content-param-item-slider"
                        defaultValue={limitConf}
                        min={0}
                        max={1}
                        step={0.01}
                        onAfterChange={onChangeLimitConf}
                        railStyle={{
                          background: '#99bdff',
                        }}
                        trackStyle={{
                          background: '#edf0f3',
                        }}
                      />
                    </div>
                  </div>
                  <div className="dds-annotator-smart-container-content-tip-text">
                    <span>{localeText('DDSAnnotator.smart.tip')}: </span>
                    {localeText('DDSAnnotator.smart.tip.ctrl')}
                  </div>
                  <div style={{ alignSelf: 'flex-end' }}>
                    <Button
                      style={{ marginRight: '10px' }}
                      onClick={onCancelBatchEdit}
                    >
                      {localeText('DDSAnnotator.smart.back')}
                    </Button>
                    <Button type="primary" onClick={onAcceptValidObjects}>
                      {localeText('DDSAnnotator.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="dds-annotator-smart-container-content-item">
                  <Select
                    style={{ width: 250 }}
                    placeholder={localeText(
                      'DDSAnnotator.smart.detection.input',
                    )}
                    showArrow={true}
                    value={aiLabels}
                    onChange={(values) =>
                      Array.isArray(values)
                        ? setAiLabels(values)
                        : setAiLabels([values])
                    }
                    onInputKeyDown={(e) => {
                      if (e.code !== 'Enter') {
                        e.stopPropagation();
                      }
                    }}
                    // @ts-ignore
                    getPopupContainer={() =>
                      document.getElementById('smart-annotation-editor')
                    }
                    mode={'multiple'}
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        {
                          <CategoryCreator
                            onAdd={(value) => {
                              onCreateCategory(value);
                              setAiLabels([...aiLabels, value]);
                            }}
                          />
                        }
                      </>
                    )}
                  >
                    {labelOptions}
                  </Select>
                  <Button
                    type="primary"
                    onClick={() => onAiAnnotation({ aiLabels })}
                  >
                    {localeText('DDSAnnotator.smart.annotate')}
                  </Button>
                </div>
              ))}
            {selectedTool === EBasicToolItem.Skeleton &&
              (isBatchEditing ? (
                <>
                  <div className="dds-annotator-smart-container-content-param-controls">
                    <div className="dds-annotator-smart-container-content-param-item">
                      <div className="dds-annotator-smart-container-content-param-item-title">
                        {localeText('DDSAnnotator.confidence')}
                      </div>
                      <Slider
                        className="dds-annotator-smart-container-content-param-item-slider"
                        range
                        defaultValue={[0, 100]}
                        onAfterChange={(range) =>
                          onChangeConfidenceRange([
                            range[0] / 100,
                            range[1] / 100,
                          ])
                        }
                        tooltip={{
                          formatter: (value?: number) => {
                            return <>{`${value! / 100}`}</>;
                          },
                          //@ts-ignore
                          getPopupContainer: () =>
                            document.getElementById('conf-slider'),
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    style={{ alignSelf: 'flex-end' }}
                    type="primary"
                    onClick={onAcceptValidObjects}
                  >
                    {localeText('DDSAnnotator.save')}
                  </Button>
                </>
              ) : (
                <>
                  <div className="dds-annotator-smart-container-content-param-controls">
                    <div className="dds-annotator-smart-container-content-param-item">
                      <div className="dds-annotator-smart-container-content-param-item-title">
                        {localeText('DDSAnnotator.smart.modelTyle')}
                      </div>
                      <Select
                        className="dds-annotator-smart-container-content-param-item-select"
                        placeholder={localeText(
                          'DDSAnnotator.smart.pose.input',
                        )}
                        showArrow={true}
                        value={aiLabels}
                        onChange={(values) =>
                          Array.isArray(values)
                            ? setAiLabels(values)
                            : setAiLabels([values])
                        }
                        onInputKeyDown={(e) => {
                          if (e.code !== 'Enter') {
                            e.stopPropagation();
                          }
                        }}
                        // @ts-ignore
                        getPopupContainer={() =>
                          document.getElementById('smart-annotation-editor')
                        }
                      >
                        {labelOptions}
                      </Select>
                    </div>
                  </div>
                  <Button
                    style={{ alignSelf: 'flex-end' }}
                    type="primary"
                    onClick={() => onAiAnnotation({ aiLabels })}
                  >
                    {localeText('DDSAnnotator.smart.annotate')}
                  </Button>
                </>
              ))}
            {selectedTool === EBasicToolItem.Polygon && (
              <>
                <div className="dds-annotator-smart-container-content-instruction">
                  {hasPolygonPreds
                    ? localeText('DDSAnnotator.smart.segmentation.tipsNext')
                    : localeText('DDSAnnotator.smart.segmentation.tipsInitial')}
                </div>
                {hasPolygonPreds && (
                  <div className="dds-annotator-smart-container-content-actions">
                    <Button danger onClick={onCancelAIPolygon}>
                      {localeText('DDSAnnotator.delete')}
                    </Button>
                    <Button type="primary" onClick={onSaveAIPolygon}>
                      {localeText('DDSAnnotator.save')}
                    </Button>
                  </div>
                )}
              </>
            )}
            {selectedTool === EBasicToolItem.Mask &&
              selectedSubTool === ESubToolItem.AutoSegmentEverything && (
                <>
                  <div
                    id={'param-controls'}
                    className="dds-annotator-smart-container-content-param-controls"
                  >
                    <div className="dds-annotator-smart-container-content-param-item">
                      <div className="dds-annotator-smart-container-content-param-item-title">
                        {localeText('DDSAnnotator.smart.iouThres')}
                      </div>
                      <Slider
                        className="dds-annotator-smart-container-content-param-item-slider"
                        value={1 - samParams.predIouThresh!}
                        onChange={(val) =>
                          setSamParams((s) => {
                            s.predIouThresh = 1 - val;
                          })
                        }
                        min={0}
                        max={0.99}
                        step={0.01}
                        reverse
                        tooltip={{
                          formatter: (val) =>
                            `${Math.floor((1 - val!) * 100)}%`,
                          //@ts-ignore
                          getPopupContainer: () =>
                            document.getElementById('param-controls'),
                        }}
                      />
                    </div>
                    <div className="dds-annotator-smart-container-content-param-item">
                      <div className="dds-annotator-smart-container-content-param-item-title">
                        {localeText('DDSAnnotator.smart.minArea')}
                      </div>
                      <Slider
                        className="dds-annotator-smart-container-content-param-item-slider"
                        value={samParams.minMaskRegionArea! / imageArea}
                        onChange={(val) =>
                          setSamParams((s) => {
                            s.minMaskRegionArea = val * imageArea;
                          })
                        }
                        min={0.01}
                        max={0.3}
                        step={0.01}
                        tooltip={{
                          formatter: (val) => `${Math.ceil(val! * 100)}%`,
                          //@ts-ignore
                          getPopupContainer: () =>
                            document.getElementById('param-controls'),
                        }}
                      />
                    </div>
                  </div>
                  {isBatchEditing ? (
                    <Space
                      className="dds-annotator-smart-container-content-actions"
                      style={{ justifyContent: 'flex-end' }}
                    >
                      <Button
                        onClick={() =>
                          onAiAnnotation({
                            segmentEverythingParams: samParams,
                          })
                        }
                      >
                        {localeText('DDSAnnotator.smart.retry')}
                      </Button>
                      <Button type="primary" onClick={onApplyCurrMaskObjs}>
                        {localeText('DDSAnnotator.annotsEditor.finish')}
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      style={{ alignSelf: 'flex-end' }}
                      type="primary"
                      onClick={() =>
                        onAiAnnotation({
                          segmentEverythingParams: samParams,
                        })
                      }
                    >
                      {localeText('DDSAnnotator.smart.annotate')}
                    </Button>
                  )}
                </>
              )}
          </div>
        </Card>
      </FloatWrapper>
    );
  },
);

export default SmartAnnotationControl;
