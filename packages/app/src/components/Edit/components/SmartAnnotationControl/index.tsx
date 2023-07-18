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
import { Button, Card, Select, Slider } from 'antd';
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

interface IProps {
  drawData: DrawData;
  aiLabels: string[];
  categories: DATA.Category[];
  setAiLabels: (labels: string[]) => void;
  onCreateCategory: (name: string) => void;
  onExitAIAnnotation: () => void;
  onAiAnnotation: OnAiAnnotationFunc;
  onSaveCurrCreate: () => void;
  onCancelCurrCreate: () => void;
  onChangeConfidenceRange: (range: [number, number]) => void;
  onAcceptValidObjects: () => void;
}

const SmartAnnotationControl: React.FC<IProps> = ({
  drawData,
  aiLabels,
  categories,
  setAiLabels,
  onCreateCategory,
  onExitAIAnnotation,
  onAiAnnotation,
  onSaveCurrCreate,
  onCancelCurrCreate,
  onChangeConfidenceRange,
  onAcceptValidObjects,
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
    // TODO
    if (
      drawData.selectedTool !== EBasicToolItem.Skeleton &&
      drawData.selectedTool !== EBasicToolItem.Mask
    ) {
      event.stopPropagation();
    } else {
      event.preventDefault();
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

    return true;
  }, [drawData.selectedTool, drawData.selectedSubTool, drawData.AIAnnotation]);

  const onApplyCurrMaskObjs = () => {
    onAcceptValidObjects();
  };

  return (
    <FloatWrapper eventHandler={mouseEventHandler}>
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
              onClick={onExitAIAnnotation}
            ></Button>
          </div>
        }
      >
        <div className={styles.content}>
          {drawData.selectedTool === EBasicToolItem.Rectangle && (
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
          )}
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
                  <div className={styles.paramItem}>
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
                  </div>
                  <div className={styles.paramItem}>
                    <div className={styles.title}>{'IoU阈值'}</div>
                    <Slider
                      className={styles.slider}
                      value={samParams.predIouThresh}
                      onChange={(val) =>
                        setSamParams((s) => {
                          s.predIouThresh = val;
                        })
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      tooltip={{
                        //@ts-ignore
                        getPopupContainer: () =>
                          document.getElementById('param-controls'),
                      }}
                    />
                  </div>
                  <div className={styles.paramItem}>
                    <div className={styles.title}>{'最小分割面积'}</div>
                    <Slider
                      className={styles.slider}
                      value={samParams.minMaskRegionArea}
                      onChange={(val) =>
                        setSamParams((s) => {
                          s.minMaskRegionArea = val;
                        })
                      }
                      min={10}
                      max={1000}
                      tooltip={{
                        //@ts-ignore
                        getPopupContainer: () =>
                          document.getElementById('param-controls'),
                      }}
                    />
                  </div>
                </div>
                {drawData.isBatchEditing ? (
                  <div className={styles.actions}>
                    <Button
                      onClick={() =>
                        onAiAnnotation({
                          drawData,
                          segmentEverythingParams: samParams,
                        })
                      }
                    >
                      {localeText('smartAnnotation.annotate')}
                    </Button>
                    <Button type="primary" onClick={onApplyCurrMaskObjs}>
                      {localeText('editor.annotsEditor.finish')}
                    </Button>
                  </div>
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
