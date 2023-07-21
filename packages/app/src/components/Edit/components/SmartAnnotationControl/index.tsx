import {
  OBJECT_ICON,
  EBasicToolItem,
  EObjectType,
  EDITOR_TOOL_ICON,
  EActionToolItem,
  ESubToolItem,
} from '@/constants';
import { CloseOutlined } from '@ant-design/icons';
import Icon from '@ant-design/icons/lib/components/Icon';
import { Button, Card, Select, Slider, Space } from 'antd';
import classNames from 'classnames';
import { useMemo } from 'react';
import { DrawData } from '../../type';
import styles from './index.less';
import { FloatWrapper } from '@/components/FloatWrapper';
import { ReactComponent as DragToolIcon } from '@/assets/svg/drag.svg';
import { useLocale } from '@/locales/helper';
import CategoryCreator from '../CategoryCreator';
import { DATA, SegmentEverythingParams } from '@/services/type';
import { OnAiAnnotationFunc } from '../../hooks/useActions';
import { useImmer } from 'use-immer';
import { ReactComponent as MouseLeftIcon } from '@/assets/svg/mouse-left.svg';
import { ReactComponent as MouseRightIcon } from '@/assets/svg/mouse-right.svg';

interface IProps {
  drawData: DrawData;
  isCtrlPressed: boolean;
  naturalSize: ISize;
  aiLabels: string[];
  categories: DATA.Category[];
  setAiLabels: (labels: string[]) => void;
  forceChangeTool: (tool: EBasicToolItem, subtool: ESubToolItem) => void;
  onCreateCategory: (name: string) => void;
  onExitAIAnnotation: () => void;
  onAiAnnotation: OnAiAnnotationFunc;
  onSaveCurrCreate: () => void;
  onCancelCurrCreate: () => void;
  onChangeConfidenceRange: (range: [number, number]) => void;
  onChangeLimitConf: (value: number) => void;
  onAcceptValidObjects: () => void;
  onCancelBatchEdit: () => void;
}

const SmartAnnotationControl: React.FC<IProps> = ({
  drawData,
  isCtrlPressed,
  aiLabels,
  categories,
  naturalSize,
  setAiLabels,
  onCreateCategory,
  onExitAIAnnotation,
  onAiAnnotation,
  onSaveCurrCreate,
  onCancelCurrCreate,
  onChangeConfidenceRange,
  onChangeLimitConf,
  onAcceptValidObjects,
  onCancelBatchEdit,
  forceChangeTool,
}) => {
  const { localeText } = useLocale();

  /** Parameters for requesting segmemt everything API */
  const [samParams, setSamParams] = useImmer<SegmentEverythingParams>({
    predIouThresh: 0.89,
    pointsPerSide: 32,
    minMaskRegionArea: 300,
  });

  const titleMap = {
    [EBasicToolItem.Drag]: {
      name: localeText('editor.shortcuts.tools.drag'),
      icon: DragToolIcon,
    },
    [EBasicToolItem.Rectangle]: {
      name: localeText('smartAnnotation.detection.name'),
      icon: OBJECT_ICON[EObjectType.Rectangle],
    },
    [EBasicToolItem.Polygon]: {
      name: localeText('smartAnnotation.segmentation.name'),
      icon: OBJECT_ICON[EObjectType.Polygon],
    },
    [EBasicToolItem.Skeleton]: {
      name: localeText('smartAnnotation.pose.name'),
      icon: OBJECT_ICON[EObjectType.Skeleton],
    },
    [EBasicToolItem.Mask]: {
      name: localeText('smartAnnotation.mask.name'),
      icon: OBJECT_ICON[EObjectType.Mask],
    },
  };

  const labelOptions = useMemo(() => {
    if (drawData.selectedTool === EBasicToolItem.Rectangle) {
      return categories?.map((category) => (
        <Select.Option key={category.id} value={category.name}>
          {category.name}
        </Select.Option>
      ));
    } else if (drawData.selectedTool === EBasicToolItem.Polygon) {
      return [];
    } else if (drawData.selectedTool === EBasicToolItem.Skeleton) {
      return ['person'].map((label) => (
        <Select.Option key={label} value={label}>
          {label}
        </Select.Option>
      ));
    }
  }, [drawData.selectedTool, categories]);

  const mouseEventHandler = (event: React.MouseEvent) => {
    if (event.type === 'mouseup' && 
      (
        drawData.selectedTool === EBasicToolItem.Skeleton ||
        (drawData.selectedTool === EBasicToolItem.Mask && drawData.selectedSubTool === ESubToolItem.AutoSegmentEverything) ||
        (drawData.selectedTool === EBasicToolItem.Rectangle) 
      )
    ) {
      event.preventDefault();
      return;
    } else {
      event.stopPropagation();
    }
  };

  const isVisible = useMemo(() => {
    if (!drawData.AIAnnotation || drawData.selectedTool === EBasicToolItem.Drag)
      return false;

    if (
      drawData.selectedTool === EBasicToolItem.Mask &&
      drawData.selectedSubTool !== ESubToolItem.AutoSegmentEverything
    )
      return false;

    if (
      drawData.selectedTool === EBasicToolItem.Rectangle &&
      drawData.isBatchEditing &&
      isCtrlPressed
    )
      return false;

    return true;
  }, [
    drawData.selectedTool,
    drawData.selectedSubTool,
    drawData.AIAnnotation,
    drawData.isBatchEditing,
    isCtrlPressed,
  ]);

  const onApplyCurrMaskObjs = () => {
    onAcceptValidObjects();
    forceChangeTool(EBasicToolItem.Drag, ESubToolItem.PenAdd);
  };

  const aiDetectionTip = useMemo(() => {
    if (drawData.isBatchEditing && isCtrlPressed) {
      return [
        {
          text: localeText('smartAnnotation.tip.recover'),
          logo: <MouseLeftIcon />,
        },
        {
          text: localeText('smartAnnotation.tip.overlayobject'),
          logo: <MouseRightIcon />,
        },
      ];
    }
    return [];
  }, [drawData.isBatchEditing, isCtrlPressed]);
  const imageArea = useMemo(() => {
    return naturalSize.width * naturalSize.height;
  }, [naturalSize]);

  return (
    <FloatWrapper eventHandler={mouseEventHandler}>
      {aiDetectionTip.length > 0 && (
        <div className={styles.operationTip}>
          {aiDetectionTip.map((item) => (
            <div key={item.text} className={styles.tipItem}>
              <span>{item.text}</span>
              {item.logo}
            </div>
          ))}
        </div>
      )}
      <Card
        id="smart-annotation-editor"
        className={classNames(styles.container, {
          [styles.containedVisible]: isVisible,
        })}
        title={
          <div className={styles.title}>
            <div className={styles.iconTitle}>
              <Icon
                component={EDITOR_TOOL_ICON[EActionToolItem.SmartAnnotation]}
              />
              <div className={styles.text}>
                {titleMap[drawData.selectedTool].name}
              </div>
            </div>
            <Button
              ghost
              className={styles.btn}
              icon={<CloseOutlined />}
              shape="circle"
              size="small"
              onClick={() => {
                onExitAIAnnotation();
                forceChangeTool(drawData.selectedTool, ESubToolItem.PenAdd);
              }}
            ></Button>
          </div>
        }
      >
        <div className={styles.content}>
          {drawData.selectedTool === EBasicToolItem.Rectangle &&
            (drawData.isBatchEditing ? (
              <div className={styles.columnItem}>
                <div className={styles.paramControls}>
                  <div className={styles.paramItem}>
                    <div className={styles.title}>
                      {localeText('smartAnnotation.detection.confidence')}:
                    </div>
                    <Slider
                      className={styles.slider}
                      defaultValue={drawData.limitConf}
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
                <div className={styles.tipText}>
                  <span>{localeText('smartAnnotation.tip')}: </span>
                  {localeText('smartAnnotation.tip.ctrl')}
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <Button
                    style={{ marginRight: '10px' }}
                    onClick={onCancelBatchEdit}
                  >
                    {localeText('smartAnnotation.back')}
                  </Button>
                  <Button type="primary" onClick={onAcceptValidObjects}>
                    {localeText('editor.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.item}>
                <Select
                  style={{ width: 250 }}
                  placeholder={localeText('smartAnnotation.detection.input')}
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
                  className={styles.action}
                  onClick={() => onAiAnnotation({ drawData, aiLabels })}
                >
                  {localeText('smartAnnotation.annotate')}
                </Button>
              </div>
            ))}
          {drawData.selectedTool === EBasicToolItem.Skeleton &&
            (drawData.isBatchEditing ? (
              <>
                <div className={styles.paramControls}>
                  <div className={styles.paramItem}>
                    <div className={styles.title}>
                      {localeText('editor.confidence')}
                    </div>
                    <Slider
                      className={styles.slider}
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
                  {localeText('editor.save')}
                </Button>
              </>
            ) : (
              <>
                <div className={styles.paramControls}>
                  <div className={styles.paramItem}>
                    <div className={styles.title}>
                      {localeText('smartAnnotation.modelTyle')}
                    </div>
                    <Select
                      className={styles.select}
                      placeholder={localeText('smartAnnotation.pose.input')}
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
                  onClick={() => onAiAnnotation({ drawData, aiLabels })}
                >
                  {localeText('smartAnnotation.annotate')}
                </Button>
              </>
            ))}
          {drawData.selectedTool === EBasicToolItem.Polygon && (
            <>
              <div className={styles.instruction}>
                {drawData.creatingObject?.polygon
                  ? localeText('smartAnnotation.segmentation.tipsNext')
                  : localeText('smartAnnotation.segmentation.tipsInitial')}
              </div>
              {drawData.creatingObject?.polygon && (
                <div className={styles.actions}>
                  <Button danger onClick={onCancelCurrCreate}>
                    {localeText('editor.delete')}
                  </Button>
                  <Button type="primary" onClick={onSaveCurrCreate}>
                    {localeText('editor.save')}
                  </Button>
                </div>
              )}
            </>
          )}
          {drawData.selectedTool === EBasicToolItem.Mask &&
            drawData.selectedSubTool === ESubToolItem.AutoSegmentEverything && (
              <>
                <div id={'param-controls'} className={styles.paramControls}>
                  {/* <div className={styles.paramItem}>
                    <div className={styles.title}>{'虚拟点击密度'}</div>
                    <Slider
                      className={styles.slider}
                      value={samParams.pointsPerSide}
                      onChange={(val) =>
                        setSamParams((s) => {
                          s.pointsPerSide = val;
                        })
                      }
                      min={16}
                      max={64}
                      tooltip={{
                        //@ts-ignore
                        getPopupContainer: () =>
                          document.getElementById('param-controls'),
                      }}
                    />
                  </div> */}
                  <div className={styles.paramItem}>
                    <div className={styles.title}>
                      {localeText('smartAnnotation.iouThres')}
                    </div>
                    <Slider
                      className={styles.slider}
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
                        formatter: (val) => `${Math.floor((1 - val!) * 100)}%`,
                        //@ts-ignore
                        getPopupContainer: () =>
                          document.getElementById('param-controls'),
                      }}
                    />
                  </div>
                  <div className={styles.paramItem}>
                    <div className={styles.title}>
                      {localeText('smartAnnotation.minArea')}
                    </div>
                    <Slider
                      className={styles.slider}
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
                {drawData.isBatchEditing ? (
                  <Space
                    className={styles.actions}
                    style={{ justifyContent: 'flex-end' }}
                  >
                    <Button
                      onClick={() =>
                        onAiAnnotation({
                          drawData,
                          segmentEverythingParams: samParams,
                        })
                      }
                    >
                      {localeText('smartAnnotation.retry')}
                    </Button>
                    <Button type="primary" onClick={onApplyCurrMaskObjs}>
                      {localeText('editor.annotsEditor.finish')}
                    </Button>
                  </Space>
                ) : (
                  <Button
                    style={{ alignSelf: 'flex-end' }}
                    type="primary"
                    onClick={() =>
                      onAiAnnotation({
                        drawData,
                        segmentEverythingParams: samParams,
                      })
                    }
                  >
                    {localeText('smartAnnotation.annotate')}
                  </Button>
                )}
              </>
            )}
        </div>
      </Card>
    </FloatWrapper>
  );
};

export default SmartAnnotationControl;
