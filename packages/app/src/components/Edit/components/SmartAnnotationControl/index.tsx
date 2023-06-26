import {
  OBJECT_ICON,
  EBasicToolItem,
  EObjectType,
  EDITOR_TOOL_ICON,
  EActionToolItem,
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
import { DATA } from '@/services/type';

interface IProps {
  drawData: DrawData;
  aiLabels: string[];
  categories: DATA.Category[];
  setAiLabels: (labels: string[]) => void;
  onCreateCategory: (name: string) => void;
  onExitAIAnnotation: () => void;
  onAiAnnotation: () => void;
  onSaveCurrCreate: () => void;
  onCancelCurrCreate: () => void;
  onChangeConfidenceRange: (range: [number, number]) => void;
  onApplyCurVisibleObjects: () => void;
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
  onApplyCurVisibleObjects,
}) => {
  const { localeText } = useLocale();

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
    if (drawData.selectedTool !== EBasicToolItem.Skeleton) {
      event.stopPropagation();
    } else {
      event.preventDefault();
    }
  };

  const isVisible = useMemo(() => {
    return (
      drawData.AIAnnotation && drawData.selectedTool !== EBasicToolItem.Drag
    );
  }, [drawData.selectedTool, drawData.AIAnnotation]);

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
              <Button className={styles.action} onClick={onAiAnnotation}>
                {localeText('smartAnnotation.annotate')}
              </Button>
            </div>
          )}
          {drawData.selectedTool === EBasicToolItem.Skeleton && (
            <div className={styles.item}>
              <Select
                style={{ width: 250 }}
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
              <Button className={styles.action} onClick={onAiAnnotation}>
                {localeText('smartAnnotation.annotate')}
              </Button>
            </div>
          )}
          {drawData.selectedTool === EBasicToolItem.Skeleton &&
            drawData.objectList.filter(
              (obj) => obj.type === EObjectType.Skeleton,
            ).length > 0 && (
              <div
                id="conf-slider"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <div style={{ alignSelf: 'flex-start' }}>
                  {localeText('editor.confidence')}
                </div>
                <div className={styles.item}>
                  <Slider
                    style={{
                      width: '220px',
                    }}
                    range
                    defaultValue={[0, 100]}
                    onAfterChange={(range) =>
                      onChangeConfidenceRange([range[0] / 100, range[1] / 100])
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
                  <Button type="primary" onClick={onApplyCurVisibleObjects}>
                    {localeText('smartAnnotation.pose.apply')}
                  </Button>
                </div>
              </div>
            )}
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
        </div>
      </Card>
    </FloatWrapper>
  );
};

export default SmartAnnotationControl;
