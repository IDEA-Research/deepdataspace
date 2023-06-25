import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Button, Divider, message } from 'antd';
import {
  EObjectType,
  EElementType,
  EBasicToolItem,
  KEYPOINTS_VISIBLE_TYPE,
  LABELS_STROKE_DASH,
  EToolType,
  BODY_TEMPLATE,
  ESubToolItem,
} from '@/constants';
import { Updater, useImmer } from 'use-immer';
import { useKeyPress } from 'ahooks';
import {
  clearCanvas,
  drawCircleWithFill,
  drawImage,
  drawLine,
  drawPolygonWithFill,
  drawRect,
  resizeSmoothCanvas,
} from '@/utils/draw';
import {
  getAnchorFixRectPoint,
  getAnchorUnderMouseByRect,
  getRectFromPoints,
  getRectWithCenterAndSize,
  isInCanvas,
  judgeFocusOnElement,
  mapRectToAnchors,
  moveRect,
  RectAnchor,
  resizeRect,
  setRectBetweenPixels,
  translatePointZoom,
  translateRectZoom,
  translatePointsToPointObjs,
  movePoint,
  getKeypointsFromRect,
  judgeFocusOnObject,
  getFocusPartInPolygonGroup,
  movePolygon,
  getLinesFromPolygon,
  getMidPointFromTwoPoints,
  isPointOnPoint,
  getReferencePointsFromRect,
  getInnerPolygonIndexFromGroup,
  translateAnnotCoord,
  translatePointCoord,
  translateRectCoord,
  Direction,
} from '@/utils/compute';
import { DATA } from '@/services/type';
import TopTools from '@/components/TopTools';
import useLabels from './hooks/useLabels';
import styles from './index.less';
import useActions from './hooks/useActions';
import PopoverMenu from './components/PopoverMenu';
import ObjectList from './components/ObjectList';
import { MainToolBar } from './components/MainToolBar';
import { changeRgbaOpacity, hexToRgba } from '@/utils/color';
import SmartAnnotationControl from './components/SmartAnnotationControl';
import { ScaleToolBar } from './components/ScaleToolBar';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { TopPagination } from './components/TopPagination';
import { EQaAction } from '@/pages/Project/constants';
import AnnotationEditor from './components/AnnotationEditor';
import { EDITOR_SHORTCUTS, EShortcuts } from './constants/shortcuts';
import { ShortcutsInfo } from './components/ShortcutsInfo';
import {
  ANNO_FILL_ALPHA,
  ANNO_FILL_COLOR,
  ANNO_STROKE_ALPHA,
  ANNO_STROKE_COLOR,
} from './constants/render';
import useAnnotations from './hooks/useAnnotations';
import useHistory from './hooks/useHistory';
import useObjects from './hooks/useObjects';
import { cloneDeep } from 'lodash';
import { Modal } from 'antd';
import { useLocale } from '@/locales/helper';
import { usePreviousState } from '@/hooks/usePreviousState';
import useCanvasContainer from '@/hooks/useCanvasContainer';
import { SubToolBar } from './components/SubToolBar';
import { objectToRle, renderMask, rleToImage } from './tools/mask';

export interface IAnnotationObject {
  type: EObjectType;
  label: string;
  hidden: boolean;
  rect?: IElement<IRect>;
  polygon?: IElement<IPolygonGroup>;
  keypoints?: {
    points: IElement<IPoint>[];
    lines: number[];
  };
  maskRle?: number[];
  maskImage?: any;
  conf?: number;
}

export interface ICreatingMaskStep {
  tool:
    | ESubToolItem.BrushAdd
    | ESubToolItem.BrushErase
    | ESubToolItem.PenAdd
    | ESubToolItem.PenErase;
  /** Add / Erase an area for Mask */
  positive: boolean;
  /** The points stroked by Pen Tool or Brush Tool */
  points: IPoint[];
  radius?: number;
}

export interface ICreatingObject extends IAnnotationObject {
  /** To determine Which polygon corresponds to the creation of a new polygon */
  currIndex?: number;
  /** Starting stretching point when creating a new Rect/Skeleton object */
  startPoint?: IPoint;
  /** Currently drawing path creating by Pen Tool or Brush Tool */
  maskStep?: ICreatingMaskStep;
  /** Steps for creating mask object */
  tempMaskSteps?: ICreatingMaskStep[];
  /** editing mask image */
  basicMaskImage?: any;
}

export interface DrawData {
  selectedTool: EToolType;
  selectedSubTool: ESubToolItem;
  AIAnnotation: boolean;
  initialized: boolean;
  changed: boolean;
  objectList: IAnnotationObject[];
  startRectResizeAnchor?: RectAnchor;
  startElementMovePoint?: {
    topLeftPoint: IPoint;
    mousePoint: IPoint;
    initPoint?: IPoint;
  };
  activeClassName: string;
  activeObjectIndex: number;
  focusObjectIndex: number;
  focusEleType: EElementType;
  focusEleIndex: number;
  latestLabel: string;
  focusPolygonInfo: {
    index: number;
    pointIndex: number;
    lineIndex: number;
  };
  creatingObject?: ICreatingObject;
  segmentationClicks?: {
    point: IPoint;
    isPositive: boolean;
  }[];
  segmentationMask?: string;
}

export const enum EditorMode {
  View,
  Edit,
  Review,
}
export interface EditImageData extends DATA.BaseImage {
  objects: DATA.BaseObject[];
}
export interface PreviewProps {
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

const Edit: React.FC<PreviewProps> = (props) => {
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

  const [isRequiring, setIsRequiring] = useImmer(false);

  const [annotations, setAnnotations] = useImmer<DATA.BaseObject[]>([]);

  const [drawData, setDrawData] = useImmer<DrawData>({
    initialized: false,
    changed: false,
    objectList: [],
    selectedTool: EBasicToolItem.Drag,
    selectedSubTool: ESubToolItem.PenAdd,
    AIAnnotation: false,
    focusObjectIndex: -1,
    activeObjectIndex: -1,
    focusEleType: EElementType.Rect,
    focusEleIndex: -1,
    latestLabel: '',
    focusPolygonInfo: {
      index: -1,
      pointIndex: -1,
      lineIndex: -1,
    },
    creatingObject: undefined,
    activeClassName: '',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const isDragToolActive = useMemo(() => {
    return drawData.selectedTool === EBasicToolItem.Drag;
  }, [drawData.selectedTool]);

  const isAIPoseEstimation = useMemo(() => {
    return (
      drawData.AIAnnotation && drawData.selectedTool === EBasicToolItem.Skeleton
    );
  }, [drawData.AIAnnotation, drawData.selectedTool]);

  useEffect(() => {
    if (drawData.selectedTool !== EBasicToolItem.Drag) {
      setDrawData((s) => {
        s.activeObjectIndex = -1;
      });
    }
  }, [drawData.selectedTool]);

  const [allowMove, setAllowMove] = useImmer(false);

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
    allowMove,
    visible,
    isRequiring,
    showMouseAim: true,
    minPadding: {
      top: 30,
      left: 30,
    },
  });

  const [preClientSize, clearPreClientSize] =
    usePreviousState<ISize>(clientSize);

  const { undo, redo, updateHistory, clearHistory } = useHistory(annotations);

  const {
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    updateAllAnnotation,
  } = useAnnotations({
    annotations,
    setAnnotations,
    clientSize,
    naturalSize,
    mode,
    updateHistory,
    onAutoSave,
  });

  const {
    addObject,
    removeObject,
    initObjectList,
    updateAllObject,
    updateObject,
  } = useObjects({
    annotations,
    setAnnotations,
    clientSize,
    naturalSize,
    drawData,
    setDrawData,
    mode,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    updateAllAnnotation,
  });

  const { onAiAnnotation, onSaveAnnotations, onCancelAnnotations } = useActions(
    {
      list,
      current,
      setDrawData,
      isRequiring,
      setIsRequiring,
      naturalSize,
      clientSize,
      onCancel,
      onSave,
      updateAllObject,
    },
  );

  const {
    aiLabels,
    setAiLabels,
    labelColors,
    onChangeObjectLabel,
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
    updateObject,
  });

  const onRedo = () => {
    const record = redo();
    if (record) {
      setAnnotations(record);
      initObjectList(record, labelColors);
      setDrawData((s) => {
        if (!s.objectList[s.activeObjectIndex]) {
          s.activeObjectIndex = -1;
        }
      });
    }
  };

  const onUndo = () => {
    const record = undo();
    if (record) {
      setAnnotations(record);
      initObjectList(record, labelColors);
      setDrawData((s) => {
        if (!s.objectList[s.activeObjectIndex]) {
          s.activeObjectIndex = -1;
        }
      });
    }
  };

  /** =================================================================================================================
  /** States related to hovering and selection
  /** ================================================================================================================= */

  const hoverAnyObject = useMemo(() => {
    return (
      drawData.focusObjectIndex > -1 &&
      drawData.objectList[drawData.focusObjectIndex]
    );
  }, [drawData.objectList, drawData.focusObjectIndex]);

  const selectedAnyObject = useMemo(() => {
    return (
      drawData.activeObjectIndex > -1 &&
      drawData.objectList[drawData.activeObjectIndex]
    );
  }, [drawData.objectList, drawData.activeObjectIndex]);

  const hoverSelectedObject = useMemo(() => {
    return (
      drawData.focusObjectIndex > -1 &&
      drawData.focusObjectIndex === drawData.activeObjectIndex
    );
  }, [drawData.activeObjectIndex, drawData.focusObjectIndex]);

  const updateFocusObjectWhenHover = () => {
    const focusObjectIndex = judgeFocusOnObject(
      contentMouse,
      drawData.objectList,
    );
    setDrawData((s) => {
      s.focusObjectIndex = focusObjectIndex;
    });
  };

  const updateFocusElementInfoWhenHover = (object: IAnnotationObject) => {
    const { focusEleIndex, focusEleType } = judgeFocusOnElement(
      contentMouse,
      object,
    );
    setDrawData((s) => {
      s.focusEleIndex = focusEleIndex;
      s.focusEleType = focusEleType;
    });
  };

  const setCurrSelectedObject = (index = drawData.focusObjectIndex) => {
    setDrawData((s) => {
      s.activeObjectIndex = index;
    });
  };

  const renderPopoverMenu = () => {
    if (
      drawData.focusObjectIndex > -1 &&
      drawData.objectList[drawData.focusObjectIndex] &&
      !drawData.objectList[drawData.focusObjectIndex].hidden &&
      drawData.focusEleIndex > -1 &&
      drawData.focusEleType === EElementType.Circle
    ) {
      const target =
        drawData.objectList[drawData.focusObjectIndex].keypoints?.points?.[
          drawData.focusEleIndex
        ];
      if (target) {
        return (
          <PopoverMenu
            index={drawData.focusEleIndex}
            targetElement={target!}
            imagePos={imagePos.current}
          />
        );
      }
    }
    return <></>;
  };

  const updateRender = (updateDrawData?: DrawData) => {
    if (!visible || !canvasRef.current || !imgRef.current) return;

    resizeSmoothCanvas(canvasRef.current, {
      width: containerMouse.elementW,
      height: containerMouse.elementH,
    });
    canvasRef.current.getContext('2d')!.imageSmoothingEnabled = false;
    clearCanvas(canvasRef.current);

    if (maskCanvasRef.current) {
      resizeSmoothCanvas(maskCanvasRef.current, {
        width: containerMouse.elementW,
        height: containerMouse.elementH,
      });
      maskCanvasRef.current.getContext('2d')!.imageSmoothingEnabled = false;
      clearCanvas(maskCanvasRef.current);
    }

    drawImage(canvasRef.current, imgRef.current, {
      x: imagePos.current.x,
      y: imagePos.current.y,
      width: clientSize.width,
      height: clientSize.height,
    });

    const theDrawData = updateDrawData || drawData;

    // draw currently annotated objects
    if (theDrawData.creatingObject) {
      const strokeColor = ANNO_STROKE_COLOR.CREATING;
      const fillColor = ANNO_FILL_COLOR.CREATING;
      switch (theDrawData.creatingObject.type) {
        case EObjectType.Rectangle: {
          const { startPoint } = theDrawData.creatingObject;
          const rect = getRectFromPoints(
            startPoint!,
            {
              x: contentMouse.elementX,
              y: contentMouse.elementY,
            },
            {
              width: contentMouse.elementW,
              height: contentMouse.elementH,
            },
          );
          const canvasCoordRect = translateRectCoord(rect, {
            x: -imagePos.current.x,
            y: -imagePos.current.y,
          });
          drawRect(
            canvasRef.current,
            canvasCoordRect,
            strokeColor,
            2,
            LABELS_STROKE_DASH[0],
            fillColor,
          );
          break;
        }
        case EObjectType.Polygon: {
          // draw unfinished points and lines
          const { currIndex } = theDrawData.creatingObject;
          const annotObject = translateAnnotCoord(theDrawData.creatingObject, {
            x: -imagePos.current.x,
            y: -imagePos.current.y,
          });
          const { polygon } = annotObject;
          if (polygon) {
            const innerPolygonIdx = getInnerPolygonIndexFromGroup(
              polygon.group,
            );

            polygon.group.forEach((polygon, polygonIdx) => {
              if (currIndex === polygonIdx) {
                polygon.forEach((point, pointIdx) => {
                  // draw points
                  drawCircleWithFill(
                    canvasRef.current!,
                    point,
                    pointIdx === 0 ? 6 : 4,
                    strokeColor,
                    3,
                    '#1f4dd8',
                  );
                  // draw lines
                  if (polygon.length > 1 && pointIdx < polygon.length - 1) {
                    drawLine(
                      canvasRef.current!,
                      polygon[pointIdx],
                      polygon[pointIdx + 1],
                      hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING),
                      2.5,
                      LABELS_STROKE_DASH[0],
                    );
                  } else if (pointIdx === polygon.length - 1) {
                    drawLine(
                      canvasRef.current!,
                      polygon[pointIdx],
                      {
                        x: containerMouse.elementX,
                        y: containerMouse.elementY,
                      },
                      hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING_LINE),
                      2.5,
                      LABELS_STROKE_DASH[2],
                    );
                  }
                });
              } else {
                if (!innerPolygonIdx.includes(polygonIdx)) {
                  drawPolygonWithFill(
                    canvasRef.current,
                    polygon,
                    hexToRgba('#1f4dd8', 0.5),
                    '#1f4dd8',
                    2,
                    LABELS_STROKE_DASH[0],
                  );
                }
              }
            });
            innerPolygonIdx.forEach((index) => {
              drawPolygonWithFill(
                canvasRef.current,
                polygon.group[index],
                'rgba(255, 255, 255, 0.8)',
                '#1f4dd8',
                2,
                LABELS_STROKE_DASH[0],
              );
            });
          }
          break;
        }
        case EObjectType.Skeleton: {
          const { startPoint } = theDrawData.creatingObject;
          const rect = getRectFromPoints(
            startPoint!,
            {
              x: contentMouse.elementX,
              y: contentMouse.elementY,
            },
            {
              width: contentMouse.elementW,
              height: contentMouse.elementH,
            },
          );
          const canvasCoordRect = translateRectCoord(rect, {
            x: -imagePos.current.x,
            y: -imagePos.current.y,
          });
          const { points, lines, pointColors, pointNames } = BODY_TEMPLATE;
          const pointObjs = translatePointsToPointObjs(
            points,
            pointNames,
            pointColors,
            naturalSize,
            clientSize,
          );
          const updatedKeypoints = getKeypointsFromRect(
            pointObjs,
            canvasCoordRect,
          );

          // draw rect
          drawRect(canvasRef.current, canvasCoordRect, strokeColor, 2);

          // draw circles
          updatedKeypoints.forEach((p) => {
            drawCircleWithFill(
              canvasRef.current!,
              { x: p.x, y: p.y },
              4,
              strokeColor,
              3,
              '#1f4dd8',
            );
          });

          // draw lines
          for (let i = 0; i * 2 < lines.length; i++) {
            const [index1, index2] = [lines[i * 2], lines[i * 2 + 1]];
            drawLine(
              canvasRef.current!,
              updatedKeypoints[index1],
              updatedKeypoints[index2],
              strokeColor,
              2.5,
              LABELS_STROKE_DASH[0],
            );
          }
          break;
        }
        case EObjectType.Mask: {
          const color =
            theDrawData.activeObjectIndex >= 0
              ? labelColors[theDrawData.creatingObject.label]
              : strokeColor;
          if (maskCanvasRef.current)
            renderMask(
              maskCanvasRef.current,
              theDrawData.creatingObject,
              imagePos.current,
              color,
              {
                x: containerMouse.elementX,
                y: containerMouse.elementY,
              },
              clientSize,
            );
          break;
        }
        default:
          break;
      }
    }

    // draw esisting objects
    theDrawData.objectList.forEach((obj, index) => {
      if (obj.hidden) return;

      const isActive = drawData.activeObjectIndex === index;
      const isFocus = drawData.focusObjectIndex === index;

      let fillAlpha = ANNO_FILL_ALPHA.DEFAULT;
      let strokeAlpha = ANNO_STROKE_ALPHA.DEFAULT;

      if (selectedAnyObject) {
        if (isActive) {
          fillAlpha = ANNO_FILL_ALPHA.ACTIVE;
          strokeAlpha = ANNO_STROKE_ALPHA.ACTIVE;
        } else {
          if (isDragToolActive && hoverAnyObject && isFocus) {
            fillAlpha = ANNO_FILL_ALPHA.FOCUS;
            strokeAlpha = ANNO_STROKE_ALPHA.FOCUS;
          } else {
            fillAlpha = ANNO_FILL_ALPHA.OTHER;
            strokeAlpha = ANNO_STROKE_ALPHA.OTHER;
          }
        }
      } else {
        if (theDrawData.creatingObject) {
          fillAlpha = ANNO_FILL_ALPHA.OTHER;
          strokeAlpha = ANNO_STROKE_ALPHA.OTHER;
        } else {
          if (hoverAnyObject && isFocus) {
            fillAlpha = ANNO_FILL_ALPHA.FOCUS;
            strokeAlpha = ANNO_STROKE_ALPHA.FOCUS;
          }
        }
      }

      const canvasCoordObject = translateAnnotCoord(obj, {
        x: -imagePos.current.x,
        y: -imagePos.current.y,
      });

      const { rect, keypoints, polygon, maskImage, label, type } =
        canvasCoordObject;

      switch (type) {
        case EObjectType.Custom:
        case EObjectType.Skeleton:
        case EObjectType.Rectangle: {
          if (rect && rect.visible) {
            const color = labelColors[label] || '#fff';
            drawRect(
              canvasRef.current,
              rect,
              hexToRgba(color, strokeAlpha),
              2,
              LABELS_STROKE_DASH[0],
              hexToRgba(color, fillAlpha),
            );
          }
          break;
        }
        case EObjectType.Polygon: {
          const color = labelColors[label] || '#fff';
          if (polygon && polygon.visible) {
            polygon?.group.forEach((polygon) => {
              drawPolygonWithFill(
                canvasRef.current,
                polygon,
                hexToRgba(color, fillAlpha),
                hexToRgba(color, strokeAlpha),
                2,
                LABELS_STROKE_DASH[0],
              );
            });
          }
          break;
        }
        default:
          break;
      }

      // draw rect
      if (rect && rect.visible) {
        if (isActive) {
          const handleCenters: IPoint[] = mapRectToAnchors(rect).map(
            (rectAnchor) => rectAnchor.position,
          );
          handleCenters.forEach((center: IPoint) => {
            const handleRect: IRect = getRectWithCenterAndSize(center, {
              width: 10,
              height: 10,
            });
            const handleRectBetweenPixels: IRect =
              setRectBetweenPixels(handleRect);
            drawRect(
              canvasRef.current,
              handleRectBetweenPixels,
              'rgba(0, 0, 0, 0.8)',
              3,
              LABELS_STROKE_DASH[0],
              '#fff',
            );
          });
        }
      }

      // draw keypoints
      if (keypoints) {
        const color = labelColors[label] || '#fff';
        const { lines, points } = keypoints;

        // draw line
        for (let i = 0; i * 2 < lines.length; i++) {
          const [index1, index2] = [lines[i * 2], lines[i * 2 + 1]];
          if (
            points[index1].visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible &&
            points[index2].visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible
          ) {
            drawLine(
              canvasRef.current!,
              points[index1],
              points[index2],
              hexToRgba(color, strokeAlpha),
              2,
              LABELS_STROKE_DASH[0],
            );
          }
        }

        // draw circle
        points.forEach((point) => {
          const { x, y, visible, color } = point;
          const fillColor = changeRgbaOpacity(
            color || 'rgba(255, 255, 255, 1)',
            strokeAlpha,
          );
          const strokeColor = `rgba(0, 0, 0, ${strokeAlpha})`;
          if (visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible) {
            drawCircleWithFill(
              canvasRef.current!,
              { x, y },
              4,
              fillColor,
              2,
              strokeColor,
            );
          }
        });

        // draw hightlight circle
        if (
          isFocus &&
          drawData.focusEleType === EElementType.Circle &&
          keypoints.points[drawData.focusEleIndex]
        ) {
          const { x, y, visible, color } =
            keypoints.points[drawData.focusEleIndex];
          if (visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible) {
            drawCircleWithFill(
              canvasRef.current!,
              { x, y },
              4,
              color,
              5,
              '#fff',
            );
          }
        }
      }

      // draw polygon
      if (polygon && polygon.visible) {
        const isFocusOnPolygon =
          isFocus &&
          drawData.focusEleType === EElementType.Polygon &&
          drawData.focusEleIndex === 0;
        const labelColor = labelColors[label] || '#fff';
        const innerPolygonIdx = getInnerPolygonIndexFromGroup(polygon.group);

        polygon.group.forEach((polygon, index) => {
          if (!innerPolygonIdx.includes(index)) {
            const fillColor = isFocusOnPolygon
              ? hexToRgba(labelColor, 0.2)
              : 'transparent';
            drawPolygonWithFill(
              canvasRef.current,
              polygon,
              fillColor,
              hexToRgba(labelColor, strokeAlpha),
              2,
              LABELS_STROKE_DASH[0],
            );
          }
        });

        innerPolygonIdx.forEach((index) => {
          const fillColor = isFocusOnPolygon
            ? 'rgba(255, 255, 255, 0.8)'
            : 'transparent';
          drawPolygonWithFill(
            canvasRef.current,
            polygon.group[index],
            fillColor,
            hexToRgba(labelColor, strokeAlpha),
            2,
            LABELS_STROKE_DASH[0],
          );
        });

        // draw points when actived
        if (isActive) {
          polygon.group.forEach((points) => {
            points.forEach((point) => {
              drawCircleWithFill(
                canvasRef.current!,
                point,
                4,
                labelColor,
                2,
                '#fff',
              );
            });
          });
        }

        // drawHighlight point when foucs
        const { index, pointIndex, lineIndex } = drawData.focusPolygonInfo;
        if (isActive && index > -1 && pointIndex > -1) {
          const focusPoint = polygon.group[index][pointIndex];
          if (focusPoint) {
            drawCircleWithFill(
              canvasRef.current!,
              focusPoint,
              4,
              '#fff',
              5,
              labelColor,
            );
          }
        } else if (isActive && index > -1 && lineIndex > -1) {
          const lines = getLinesFromPolygon(polygon.group[index]);
          if (lines[lineIndex]) {
            const { start, end } = lines[lineIndex];
            const midPoint = getMidPointFromTwoPoints(start, end);
            if (midPoint) {
              drawCircleWithFill(
                canvasRef.current!,
                midPoint,
                4,
                '#fff',
                5,
                labelColor,
              );
            }
          }
        }
      }

      // draw mask
      if (maskImage && theDrawData.activeObjectIndex !== index) {
        const ctx = canvasRef.current!.getContext(
          '2d',
        ) as CanvasRenderingContext2D;
        ctx.globalAlpha = 0.35;
        if (theDrawData.creatingObject) {
          ctx.globalAlpha = 0.2;
        } else if (theDrawData.focusObjectIndex === index) {
          ctx.globalAlpha = 0.8;
        }
        drawImage(canvasRef.current!, maskImage, {
          x: imagePos.current.x,
          y: imagePos.current.y,
          width: clientSize.width,
          height: clientSize.height,
        });
        ctx.globalAlpha = 1;
      }
    });

    // draw segmentation reference points
    if (theDrawData.segmentationClicks) {
      theDrawData.segmentationClicks.forEach((click) => {
        const canvasCoordPoint = translatePointCoord(click.point, {
          x: -imagePos.current.x,
          y: -imagePos.current.y,
        });
        drawCircleWithFill(
          canvasRef.current!,
          canvasCoordPoint,
          3,
          click.isPositive ? 'green' : 'red',
          0,
          '#fff',
        );
      });
    }
  };

  /** =================================================================================================================
  /** update mouse style 
  /** ================================================================================================================= */

  const updateMouseCursor = useCallback(
    (value: string, position?: Direction) => {
      if (!maskCanvasRef.current) return;

      let cursor = value;
      if (position) {
        switch (position) {
          case Direction.TOP:
          case Direction.BOTTOM:
            cursor = 'ns-resize';
            break;
          case Direction.TOP_LEFT:
          case Direction.BOTTOM_RIGHT:
            cursor = 'nwse-resize';
            break;
          case Direction.BOTTOM_LEFT:
          case Direction.TOP_RIGHT:
            cursor = 'nesw-resize';
            break;
          default:
            cursor = 'ew-resize';
        }
      }
      if (cursor !== maskCanvasRef.current.style.cursor) {
        maskCanvasRef.current.style.cursor = cursor;
      }
    },
    [maskCanvasRef.current],
  );

  const updateMouseWhenHoverObject = () => {
    if (drawData.focusObjectIndex > -1) {
      updateMouseCursor('pointer');
    } else {
      updateMouseCursor('grab');
    }
  };

  const updateMouseWhenHoverElement = (focusEleType: EElementType) => {
    switch (focusEleType) {
      case EElementType.Rect: {
        const { rect } = drawData.objectList[drawData.activeObjectIndex];
        if (rect) {
          const anchorUnderMouse = getAnchorUnderMouseByRect(rect!, {
            x: contentMouse.elementX,
            y: contentMouse.elementY,
          });
          // focus on the resize point
          if (anchorUnderMouse) {
            updateMouseCursor('resize', anchorUnderMouse.type);
          } else {
            updateMouseCursor('move');
          }
        }
        break;
      }
      case EElementType.Polygon: {
        updateMouseCursor('pointer');
        break;
      }
      case EElementType.Circle: {
        updateMouseCursor('pointer');
        break;
      }
    }
  };

  const updateMouseWhenCreating = () => {
    updateMouseCursor('crosshair');
  };

  useEffect(() => {
    if (allowMove) {
      updateMouseCursor('grabbing');
    } else {
      if (drawData.selectedTool === EBasicToolItem.Drag) {
        updateMouseCursor('grab');
      } else {
        updateMouseCursor('crosshair');
      }
    }
  }, [allowMove]);

  // =================================================================================================================
  // Logics For Creating Annotations
  // =================================================================================================================

  const startCreateWhenMouseDown = () => {
    if (!isInCanvas(contentMouse)) return;

    setDrawData((s) => {
      const point = {
        x: contentMouse.elementX,
        y: contentMouse.elementY,
      };
      s.activeObjectIndex = -1;
      const basic = {
        hidden: false,
        label: drawData.latestLabel || categories[0].name,
      };
      switch (s.selectedTool) {
        case EBasicToolItem.Polygon: {
          if (s.AIAnnotation) {
            // by drawing rectangle under AI mode
            s.creatingObject = {
              type: EObjectType.Rectangle,
              startPoint: point,
              ...basic,
            };
          } else {
            // create a new polygon manually
            s.creatingObject = {
              type: EObjectType.Polygon,
              polygon: {
                visible: true,
                group: [[point]],
              },
              currIndex: 0,
              ...basic,
            };
          }
          break;
        }
        case EBasicToolItem.Rectangle: {
          s.creatingObject = {
            type: EObjectType.Rectangle,
            startPoint: point,
            ...basic,
          };
          break;
        }
        case EBasicToolItem.Skeleton: {
          s.creatingObject = {
            type: EObjectType.Skeleton,
            startPoint: point,
            ...basic,
          };
          break;
        }
        case EBasicToolItem.Mask: {
          s.creatingObject = {
            ...basic,
            type: EObjectType.Mask,
            startPoint: point,
            maskStep: {
              tool: s.selectedSubTool,
              positive:
                s.selectedSubTool === ESubToolItem.PenAdd ||
                s.selectedSubTool === ESubToolItem.BrushAdd,
              points: [point],
              radius: 25,
            },
            tempMaskSteps: [],
          };
        }
      }
    });
  };

  const updateCreatingWhenMouseDown = () => {
    if (!isInCanvas(contentMouse)) return;

    /** Edit instance being created */
    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    switch (drawData.selectedTool) {
      case EBasicToolItem.Polygon: {
        setDrawData((s) => {
          if (s.creatingObject) {
            if (drawData.AIAnnotation) {
            } else {
              const currIndex = s.creatingObject.currIndex as number;
              const polygon = s.creatingObject
                .polygon as IElement<IPolygonGroup>;
              if (currIndex > -1) {
                const startPoint = polygon.group[currIndex][0];
                // finish creating polygon when click on startpoint
                if (isPointOnPoint(startPoint, contentMouse)) {
                  s.creatingObject.currIndex = -1;
                } else {
                  if (s.creatingObject.polygon) {
                    polygon.group[currIndex].push(mouse);
                  }
                }
              } else {
                polygon.group.push([mouse]);
                s.creatingObject.currIndex = polygon.group.length - 1;
              }
            }
          }
        });
        break;
      }
      case EBasicToolItem.Mask: {
        setDrawData((s) => {
          if (s.creatingObject) {
            if (s.creatingObject.maskStep) {
              // add points for currently path
              s.creatingObject.maskStep.points.push(mouse);
            } else {
              // init new step for creating points
              s.creatingObject.maskStep = {
                tool: s.selectedSubTool,
                positive:
                  s.selectedSubTool === ESubToolItem.PenAdd ||
                  s.selectedSubTool === ESubToolItem.BrushAdd,
                points: [mouse],
              };
            }
          }
        });
        break;
      }
      case EBasicToolItem.Rectangle: {
        break;
      }
      case EBasicToolItem.Skeleton: {
        break;
      }
    }
  };

  const updateCreatingWhenMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (drawData.creatingObject) {
      if (drawData.selectedTool === EBasicToolItem.Mask) {
        const mouse = {
          x: contentMouse.elementX,
          y: contentMouse.elementY,
        };
        setDrawData((s) => {
          switch (s.selectedSubTool) {
            case ESubToolItem.PenAdd:
            case ESubToolItem.PenErase: {
              if (event.buttons === 1) {
                s.creatingObject?.maskStep?.points.push(mouse);
              }
            }
            case ESubToolItem.BrushAdd:
            case ESubToolItem.BrushErase: {
              if (event.buttons === 1) {
                s.creatingObject?.maskStep?.points.push(mouse);
              }
            }
            default: {
              break;
            }
          }
        });
      }
      updateRender();
    }
  };

  const finishCreatingWhenMouseUp = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (!drawData.creatingObject) return;

    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };

    switch (drawData.selectedTool) {
      case EBasicToolItem.Rectangle: {
        if (drawData.creatingObject.startPoint) {
          // Need to check if it can form a rectangle
          if (
            contentMouse.elementX === drawData.creatingObject.startPoint?.x ||
            contentMouse.elementY === drawData.creatingObject.startPoint?.y
          ) {
            setDrawData((s) => (s.creatingObject = undefined));
            break;
          }
          const newRect = getRectFromPoints(
            drawData.creatingObject.startPoint,
            { x: contentMouse.elementX, y: contentMouse.elementY },
            {
              width: contentMouse.elementW,
              height: contentMouse.elementH,
            },
          );
          const newObject = {
            type: EObjectType.Rectangle,
            label: drawData.creatingObject.label,
            hidden: false,
            rect: { visible: true, ...newRect },
            conf: 1,
          };
          addObject(newObject);
          break;
        }
      }
      case EBasicToolItem.Polygon: {
        if (drawData.AIAnnotation) {
          if (drawData.creatingObject.type === EObjectType.Polygon) {
            if (!isInCanvas(contentMouse)) break;
            // add reference points
            const click = {
              isPositive: event.button === 0 ? true : false,
              point: mouse,
            };
            const existClicks = drawData.segmentationClicks || [];
            setDrawData((s) => {
              s.segmentationClicks = [...existClicks, click];
            });
            onAiAnnotation(
              {
                ...drawData,
                segmentationClicks: [...existClicks, click],
              },
              [drawData.creatingObject.label],
            );
          } else {
            // first click
            if (
              contentMouse.elementX === drawData.creatingObject.startPoint?.x &&
              contentMouse.elementY === drawData.creatingObject.startPoint?.y
            ) {
              if (!isInCanvas(contentMouse)) break;
              // draw point
              const firstClick = {
                isPositive: true,
                point: mouse,
              };
              setDrawData((s) => {
                s.segmentationClicks = [firstClick];
              });
              onAiAnnotation(
                { ...drawData, segmentationClicks: [firstClick] },
                [],
              );
            } else {
              // draw bbox
              const rect = getRectFromPoints(
                drawData.creatingObject.startPoint as IPoint,
                mouse,
                {
                  width: contentMouse.elementW,
                  height: contentMouse.elementH,
                },
              );
              const points = getReferencePointsFromRect(rect);
              const bbox = {
                xmin: rect.x,
                ymin: rect.y,
                xmax: rect.x + rect.width,
                ymax: rect.y + rect.height,
              };
              const clicks = points.map((point, index) => {
                return {
                  // Only the center point is positive
                  isPositive: index === points.length - 1 ? true : false,
                  point,
                };
              });
              setDrawData((s) => {
                s.segmentationClicks = [...clicks];
              });
              onAiAnnotation(
                { ...drawData, segmentationClicks: clicks },
                [],
                bbox,
              );
            }
            setDrawData((s) => (s.creatingObject = undefined));
          }
        } else {
          if (drawData.creatingObject?.currIndex === -1) {
            const { polygon, type, hidden, label } = drawData.creatingObject;
            const newObject = {
              polygon,
              type,
              hidden,
              label,
            };
            addObject(newObject);
          }
        }
        break;
      }
      case EBasicToolItem.Skeleton: {
        if (drawData.creatingObject?.startPoint) {
          if (
            contentMouse.elementX === drawData.creatingObject.startPoint?.x ||
            contentMouse.elementY === drawData.creatingObject.startPoint?.y
          ) {
            setDrawData((s) => (s.creatingObject = undefined));
            break;
          }
          const newRect = getRectFromPoints(
            drawData.creatingObject.startPoint,
            { x: contentMouse.elementX, y: contentMouse.elementY },
            {
              width: contentMouse.elementW,
              height: contentMouse.elementH,
            },
          );
          const { points, lines, pointColors, pointNames } = BODY_TEMPLATE;
          const pointObjs = translatePointsToPointObjs(
            points,
            pointNames,
            pointColors,
            naturalSize,
            clientSize,
          );
          const updatedObjs = getKeypointsFromRect(pointObjs, newRect);
          const newObject = {
            type: EObjectType.Skeleton,
            label: drawData.creatingObject.label,
            hidden: false,
            rect: { visible: true, ...newRect },
            keypoints: {
              points: updatedObjs,
              lines: lines,
            },
            conf: 1,
          };
          addObject(newObject);
        }
        break;
      }
      case EBasicToolItem.Mask: {
        if (drawData.creatingObject) {
          setDrawData((s) => {
            switch (s.selectedSubTool) {
              case ESubToolItem.PenAdd:
              case ESubToolItem.PenErase: {
                // finish mask element
                if (
                  s.creatingObject &&
                  s.creatingObject.tempMaskSteps &&
                  s.creatingObject.maskStep &&
                  s.creatingObject.maskStep.points.length > 1 &&
                  isPointOnPoint(
                    s.creatingObject.maskStep.points[0],
                    contentMouse,
                  )
                ) {
                  s.creatingObject.tempMaskSteps?.push(
                    s.creatingObject.maskStep,
                  );
                  s.creatingObject.maskStep = undefined;
                }
                break;
              }
              case ESubToolItem.BrushAdd:
              case ESubToolItem.BrushErase: {
                if (
                  s.creatingObject &&
                  s.creatingObject.tempMaskSteps &&
                  s.creatingObject.maskStep &&
                  s.creatingObject.maskStep.points.length > 1
                ) {
                  s.creatingObject.tempMaskSteps?.push(
                    s.creatingObject.maskStep,
                  );
                  s.creatingObject.maskStep = undefined;
                }
                break;
              }
              default: {
                break;
              }
            }
          });
          break;
        }
      }
    }
  };

  // =================================================================================================================
  // Logics For Editing Exsiting Annotations
  // =================================================================================================================

  const startEditingWhenMouseDown = () => {
    const focusObjIndex = judgeFocusOnObject(contentMouse, drawData.objectList);
    if (drawData.objectList[focusObjIndex]) {
      const { focusEleIndex, focusEleType } = judgeFocusOnElement(
        contentMouse,
        drawData.objectList[focusObjIndex],
      );
      setDrawData((s) => {
        s.focusEleType = focusEleType;
        s.focusEleIndex = focusEleIndex;
        s.activeObjectIndex = focusObjIndex;
        switch (focusEleType) {
          case EElementType.Rect: {
            const { rect } = s.objectList[focusObjIndex];
            if (rect) {
              const anchorUnderMouse = getAnchorUnderMouseByRect(rect, {
                x: contentMouse.elementX,
                y: contentMouse.elementY,
              });
              if (anchorUnderMouse) {
                // resize
                s.startRectResizeAnchor = {
                  type: anchorUnderMouse.type,
                  position: getAnchorFixRectPoint(rect, anchorUnderMouse.type),
                };
              } else {
                // move
                s.startElementMovePoint = {
                  topLeftPoint: {
                    x: rect.x,
                    y: rect.y,
                  },
                  mousePoint: {
                    x: contentMouse.elementX,
                    y: contentMouse.elementY,
                  },
                };
              }
            }
            break;
          }
          case EElementType.Circle: {
            // move circle
            const { keypoints } = s.objectList[focusObjIndex];
            if (keypoints) {
              const point = keypoints.points[focusEleIndex];
              s.startElementMovePoint = {
                topLeftPoint: {
                  x: point.x,
                  y: point.y,
                },
                mousePoint: {
                  x: contentMouse.elementX,
                  y: contentMouse.elementY,
                },
              };
            }
            break;
          }
          case EElementType.Polygon: {
            const { polygon } = s.objectList[focusObjIndex];
            const { lineIndex, index } = drawData.focusPolygonInfo;
            if (polygon) {
              // move
              s.startElementMovePoint = {
                topLeftPoint: {
                  x: 0,
                  y: 0,
                },
                mousePoint: {
                  x: contentMouse.elementX,
                  y: contentMouse.elementY,
                },
                initPoint: {
                  x: contentMouse.elementX,
                  y: contentMouse.elementY,
                },
              };

              // add point
              if (lineIndex > -1) {
                const line = getLinesFromPolygon(polygon.group[index])[
                  lineIndex
                ];
                if (line) {
                  const midPoint = getMidPointFromTwoPoints(
                    line.start,
                    line.end,
                  );
                  polygon.group[index].splice(lineIndex + 1, 0, midPoint);
                }
              }
            }
            break;
          }
        }
      });
    }
  };

  const updateEditingWhenMouseMove = () => {
    let exit = true;
    const { focusEleIndex, focusEleType } = drawData;
    if (focusEleType === EElementType.Rect && focusEleIndex === 0) {
      // resize rectangle
      if (drawData.startRectResizeAnchor) {
        updateMouseCursor('resize', drawData.startRectResizeAnchor.type);
        setDrawData((s) => {
          const activeObject = s.objectList[s.activeObjectIndex];
          if (
            s.activeObjectIndex > -1 &&
            s.startRectResizeAnchor &&
            activeObject &&
            activeObject.rect
          ) {
            const newRect = resizeRect(
              activeObject.rect,
              s.startRectResizeAnchor,
              contentMouse,
            );
            activeObject.rect = { ...activeObject.rect, ...newRect };
          }
        });
        return exit;
      }
      // move rectangle
      if (drawData.startElementMovePoint) {
        updateMouseCursor('move');
        setDrawData((s) => {
          const activeObject = s.objectList[s.activeObjectIndex];
          if (
            s.activeObjectIndex > -1 &&
            s.startElementMovePoint &&
            activeObject &&
            activeObject.rect
          ) {
            const newRect = moveRect(
              activeObject.rect,
              s.startElementMovePoint,
              contentMouse,
            );
            activeObject.rect = { ...activeObject.rect, ...newRect };
          }
        });
        return exit;
      }
    } else if (focusEleType === EElementType.Circle) {
      // move point
      if (drawData.startElementMovePoint) {
        updateMouseCursor('move');
        setDrawData((s) => {
          const activeObject = s.objectList[s.activeObjectIndex];
          if (
            s.activeObjectIndex > -1 &&
            s.focusEleIndex > -1 &&
            s.startElementMovePoint &&
            activeObject?.keypoints?.points?.[s.focusEleIndex]
          ) {
            const point = activeObject?.keypoints?.points?.[s.focusEleIndex];
            const { x: newX, y: newY } = movePoint(contentMouse);
            point.x = newX;
            point.y = newY;
          }
        });
        return exit;
      }
    } else if (focusEleType === EElementType.Polygon && focusEleIndex === 0) {
      const { index, pointIndex } = drawData.focusPolygonInfo;
      if (drawData.startElementMovePoint && index > -1) {
        updateMouseCursor('move');
        if (pointIndex > -1) {
          // move single point
          setDrawData((s) => {
            const activeObject = s.objectList[s.activeObjectIndex];
            if (
              s.activeObjectIndex > -1 &&
              s.focusEleIndex > -1 &&
              s.startElementMovePoint &&
              activeObject?.polygon?.group[index]
            ) {
              const polygon = activeObject?.polygon?.group[index];
              polygon[pointIndex] = movePoint(contentMouse);
            }
          });
          return exit;
        } else {
          // move polygon
          setDrawData((s) => {
            const activeObject = s.objectList[s.activeObjectIndex];
            if (
              s.activeObjectIndex > -1 &&
              s.focusEleIndex > -1 &&
              s.startElementMovePoint &&
              activeObject?.polygon?.group[index]
            ) {
              const polygon = activeObject?.polygon?.group[index];
              const newPolygon = movePolygon(
                polygon,
                s.startElementMovePoint,
                contentMouse,
              );
              s.startElementMovePoint.mousePoint = {
                x: contentMouse.elementX,
                y: contentMouse.elementY,
              };
              activeObject.polygon.group[index] = newPolygon;
            }
          });
          return exit;
        }
      }
    }
    return !exit;
  };

  const finishEditingWhenMouseUp = () => {
    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };

    const isResizingOrMoving =
      drawData.startRectResizeAnchor || drawData.startElementMovePoint;

    const isMouseStand =
      drawData.startElementMovePoint &&
      drawData.startElementMovePoint.initPoint?.x === mouse.x &&
      drawData.startElementMovePoint.initPoint?.y === mouse.y;

    const isRemovePolygonPoints =
      !drawData.creatingObject &&
      isMouseStand &&
      drawData.focusPolygonInfo.index > -1 &&
      drawData.focusPolygonInfo.pointIndex > -1;

    if (
      drawData.AIAnnotation &&
      drawData.selectedTool === EBasicToolItem.Skeleton
    ) {
      if (
        drawData.startElementMovePoint &&
        (drawData.startElementMovePoint.mousePoint?.x !== mouse.x ||
          drawData.startElementMovePoint.mousePoint?.y !== mouse.y)
      ) {
        onAiAnnotation(drawData, aiLabels);
      }
    }

    if (isRemovePolygonPoints) {
      const object = drawData.objectList[drawData.focusObjectIndex];
      const copyObject = cloneDeep(object);
      const { index, pointIndex } = drawData.focusPolygonInfo;
      const polygon = copyObject.polygon?.group[index];
      if (polygon && index > -1 && pointIndex > -1 && polygon.length >= 3) {
        polygon.splice(pointIndex, 1);
      }
      updateObject(copyObject, drawData.focusObjectIndex);
    } else if (isResizingOrMoving) {
      updateAllObject(drawData.objectList);
    }

    setDrawData((s) => {
      s.startRectResizeAnchor = undefined;
      s.startElementMovePoint = undefined;
    });
  };

  // =================================================================================================================
  // Annotation Eidtor
  // =================================================================================================================

  const currEditObject = useMemo(() => {
    if (drawData.activeObjectIndex > -1) {
      // Edit object
      return drawData.objectList[drawData.activeObjectIndex];
    } else if (
      drawData.creatingObject &&
      drawData.creatingObject.type === EObjectType.Mask &&
      (drawData.creatingObject.maskImage ||
        drawData.creatingObject.tempMaskSteps?.length)
    ) {
      // New mask
      return drawData.creatingObject;
    }
    return undefined;
  }, [drawData]);

  const onDeleteCurrObject = () => {
    if (drawData.activeObjectIndex > -1) {
      removeObject(drawData.activeObjectIndex);
    }
    setDrawData((s) => {
      s.creatingObject = undefined;
      s.activeObjectIndex = -1;
    });
  };

  const onFinishCurrCreate = async (label: string) => {
    if (currEditObject?.type === EObjectType.Mask) {
      const maskRle = await objectToRle(
        clientSize,
        naturalSize,
        drawData.creatingObject?.tempMaskSteps,
        drawData.creatingObject?.maskImage,
      );
      if (maskRle && maskRle.length > 0) {
        const color = labelColors[label] || '#fff';
        const newObject = {
          type: EObjectType.Mask,
          label,
          hidden: false,
          maskRle,
          maskImage: rleToImage(maskRle, naturalSize, color),
          conf: 1,
        };
        if (drawData.activeObjectIndex < 0) {
          // add mask object
          addObject(newObject, true);
        } else {
          // edit mask object
          updateObject(newObject, drawData.activeObjectIndex);
        }
        setDrawData((s) => {
          s.creatingObject = undefined;
          s.activeObjectIndex = -1;
        });
      } else if (maskRle) {
        // Empty mask
        message.warning(localeText('editor.anno.mask.emptyWarning'));
      } else {
        // Other error
        message.error(localeText('editor.anno.mask.translateToRleError'));
      }
    } else {
      onChangeObjectLabel(drawData.activeObjectIndex, label);
      setDrawData((s) => {
        s.creatingObject = undefined;
        s.activeObjectIndex = -1;
      });
    }
  };

  const onCloseAnnotationEditor = () => {
    setDrawData((s) => {
      s.creatingObject = undefined;
      s.activeObjectIndex = -1;
    });
  };

  // =================================================================================================================
  // Register Mouse Event
  // =================================================================================================================

  const onMouseDown: MouseEventHandler<HTMLDivElement> = () => {
    if (!visible || allowMove || isRequiring) return;

    if (selectedAnyObject) {
      if (hoverAnyObject && hoverSelectedObject && mode === EditorMode.Edit) {
        startEditingWhenMouseDown();
      } else {
        if (isDragToolActive || isAIPoseEstimation) {
          setCurrSelectedObject();
          if (!hoverAnyObject) {
            setAllowMove(true);
          }
        } else {
          if (drawData.creatingObject) {
            updateCreatingWhenMouseDown();
          } else {
            startCreateWhenMouseDown();
          }
        }
      }
    } else {
      if (isDragToolActive || isAIPoseEstimation) {
        setCurrSelectedObject();
        if (!hoverAnyObject) {
          setAllowMove(true);
        }
      } else {
        if (drawData.creatingObject) {
          updateCreatingWhenMouseDown();
        } else {
          startCreateWhenMouseDown();
        }
      }
    }
  };

  const onMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!visible || !canvasRef.current || isRequiring || allowMove) return;

    /** Edit currently hovered element */
    if (mode === EditorMode.Edit && drawData.activeObjectIndex > -1) {
      const exit = updateEditingWhenMouseMove();
      if (exit) return;
    }

    /** Update hovered instance */
    updateFocusObjectWhenHover();

    /** Determine if there is currently a selected instance */
    if (selectedAnyObject) {
      /** Determine if hovering over the selected instance */
      if (hoverAnyObject && hoverSelectedObject) {
        /** Update hover info */
        const object = drawData.objectList[drawData.activeObjectIndex];
        updateFocusElementInfoWhenHover(object);

        /** When the instance contains a polygon, it is necessary to determine whether hovering over a point or a line */
        if (object.polygon) {
          const hoverDetail = getFocusPartInPolygonGroup(
            object.polygon,
            contentMouse,
          );
          setDrawData((s) => {
            s.focusPolygonInfo = hoverDetail;
          });
        }

        /** Update mouse based on current hover coordinates and element type */
        updateMouseWhenHoverElement(drawData.focusEleType);
      } else {
        /** Different instances for hovered and selected */
        if (isDragToolActive || isAIPoseEstimation) {
          /** Drag mode: Update hovered instance and mouse state */
          updateMouseWhenHoverObject();
        } else {
          /** Create mode: Refresh canvas and mouse state */
          updateCreatingWhenMouseMove(event);
          updateMouseWhenCreating();
        }
      }
    } else {
      /** No selected instance */
      if (isDragToolActive || isAIPoseEstimation) {
        /** Drag mode: Update hovered instance and mouse state */
        updateMouseWhenHoverObject();
      } else {
        /** Create mode: Refresh canvas and mouse state */
        updateCreatingWhenMouseMove(event);
        updateMouseWhenCreating();
      }
    }
  };

  const onMouseUp: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!visible || !canvasRef.current || isRequiring) return;

    if (allowMove) {
      setAllowMove(false);
      return;
    }

    if (selectedAnyObject) {
      if (hoverAnyObject && hoverSelectedObject && mode === EditorMode.Edit) {
        finishEditingWhenMouseUp();
      } else {
        if (!isDragToolActive && drawData.creatingObject) {
          finishCreatingWhenMouseUp(event);
        }
      }
    } else {
      if (!isDragToolActive && drawData.creatingObject) {
        finishCreatingWhenMouseUp(event);
      }
    }
  };

  /** Update canvas while data changing */
  useEffect(() => {
    updateRender();
  }, [drawData]);

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
    } else {
      // Non-initialization
      const updateDrawData = { ...drawData };
      updateDrawData.objectList = updateDrawData.objectList.map((obj) => {
        const newObj = { ...obj };
        if (!preClientSize) return newObj;

        if (newObj.rect) {
          const newRect = translateRectZoom(
            newObj.rect,
            preClientSize,
            clientSize,
          );
          newObj.rect = { ...newObj.rect, ...newRect };
        }
        if (newObj.keypoints) {
          const { points, lines } = newObj.keypoints;
          const newPoints = points.map((point) => {
            const newPoint = translatePointZoom(
              point,
              preClientSize,
              clientSize,
            );
            return { ...point, ...newPoint };
          });
          newObj.keypoints = { points: newPoints, lines };
        }
        if (newObj.polygon) {
          const newGroups = newObj.polygon.group.map((polygon) => {
            return polygon.map((point) => {
              return translatePointZoom(point, preClientSize, clientSize);
            });
          });
          newObj.polygon = { ...newObj.polygon, group: newGroups };
        }
        return newObj;
      });

      if (updateDrawData.creatingObject && preClientSize) {
        if (updateDrawData.creatingObject.polygon) {
          const newGroups = updateDrawData.creatingObject.polygon.group.map(
            (polygon) => {
              return polygon.map((point) => {
                return translatePointZoom(point, preClientSize, clientSize);
              });
            },
          );
          updateDrawData.creatingObject = {
            ...updateDrawData.creatingObject,
            polygon: { visible: true, group: newGroups },
          };
        }
        if (updateDrawData.creatingObject.maskStep) {
          const newPoints = updateDrawData.creatingObject.maskStep.points.map(
            (point) => {
              return translatePointZoom(point, preClientSize, clientSize);
            },
          );
          updateDrawData.creatingObject.maskStep = {
            ...updateDrawData.creatingObject.maskStep,
            points: newPoints,
          };
        }
        if (updateDrawData.creatingObject.tempMaskSteps) {
          const newSteps = updateDrawData.creatingObject.tempMaskSteps.map(
            (step) => {
              return {
                ...step,
                points: step.points.map((point) =>
                  translatePointZoom(point, preClientSize, clientSize),
                ),
              };
            },
          );
          updateDrawData.creatingObject = {
            ...updateDrawData.creatingObject,
            tempMaskSteps: newSteps,
          };
        }
      }

      if (updateDrawData.segmentationClicks && preClientSize) {
        updateDrawData.segmentationClicks =
          updateDrawData.segmentationClicks.map((click) => {
            if (click.point) {
              const newPoint = translatePointZoom(
                click.point,
                preClientSize,
                clientSize,
              );
              return {
                ...click,
                point: newPoint,
              };
            }
            return click;
          });
      }
      clearPreClientSize();
      setDrawData(updateDrawData);
      updateRender(updateDrawData);
    }
  };

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
    setDrawData((s) => {
      s.initialized = false;
      s.changed = false;
      s.objectList = [];
      s.activeObjectIndex = -1;
      s.focusObjectIndex = -1;
      s.focusEleIndex = -1;
      s.focusEleType = EElementType.Rect;
      s.focusPolygonInfo = {
        index: -1,
        pointIndex: -1,
        lineIndex: -1,
      };
      s.creatingObject = undefined;
      s.segmentationClicks = undefined;
      s.segmentationMask = undefined;
      s.selectedTool = EBasicToolItem.Drag;
      s.activeClassName = '';
      s.latestLabel = '';
    });
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
      updateHistory(annotations);
      rebuildDrawData(true);
    }
  }, [annotations]);

  const onReject = () => {
    if (mode === EditorMode.Review && onReviewResult) {
      onReviewResult(list[current]?.id || '', EQaAction.Reject);
    }
  };

  const onAccept = () => {
    if (mode === EditorMode.Review && onReviewResult) {
      onReviewResult(list[current]?.id || '', EQaAction.Accept);
    }
  };

  const selectTool = (tool: EBasicToolItem) => {
    if (mode !== EditorMode.Edit) return;
    setDrawData((s) => {
      s.selectedTool = tool;
    });
  };

  const selectSubTool = (tool: ESubToolItem) => {
    if (mode !== EditorMode.Edit) return;
    setDrawData((s) => {
      s.selectedSubTool = tool;
    });
  };

  const displayAIModeUnavailableModal = () => {
    Modal.info({
      centered: true,
      closable: true,
      title: localeText('smartAnnotation.infoModal.title'),
      content: localeText('smartAnnotation.infoModal.content'),
      okText: localeText('smartAnnotation.infoModal.action'),
      onOk: () => {
        window.open('https://deepdataspace.com', '_blank');
      },
    });
  };

  const activeAIAnnotation = useCallback(
    (active: boolean) => {
      if (!process.env.MODEL_API_PATH && active) {
        displayAIModeUnavailableModal();
        return;
      }
      if (mode !== EditorMode.Edit) return;
      setDrawData((s) => {
        s.AIAnnotation = active;
      });
    },
    [mode],
  );

  const activeMaskObject = (index: number) => {
    // Enter mask edit
    selectTool(EBasicToolItem.Mask);
    setAiLabels([]);
    setDrawData((s) => {
      s.creatingObject = {
        hidden: false,
        label: drawData.objectList[index].label,
        type: EObjectType.Mask,
        maskStep: undefined,
        tempMaskSteps: [],
        maskImage: drawData.objectList[index].maskImage,
      };
    });
  };

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

  /** =================================================================================================================
  /** Register editor shortcut keys
  /** =================================================================================================================

  /** Save Results */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.Save].shortcut,
    (event: KeyboardEvent) => {
      event.preventDefault();
      if (mode === EditorMode.Edit) {
        onSaveAnnotations(drawData);
      }
    },
    {
      exactMatch: true,
    },
  );

  /** Accept Results */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.Accept].shortcut,
    (event: KeyboardEvent) => {
      event.preventDefault();
      onAccept();
    },
    {
      exactMatch: true,
    },
  );

  /** Reject Results */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.Reject].shortcut,
    (event: KeyboardEvent) => {
      event.preventDefault();
      onReject();
    },
    {
      exactMatch: true,
    },
  );

  /** Pan Image */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.PanImage].shortcut,
    (event: KeyboardEvent) => {
      if (!visible) return;
      event.preventDefault();
      if (event.type === 'keydown') {
        setAllowMove(true);
      } else if (event.type === 'keyup') {
        setAllowMove(false);
      }
    },
    {
      events: ['keydown', 'keyup'],
    },
  );

  /** Cancel Current Selected Object or Creaing Object */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.CancelCurrObject].shortcut,
    (event: KeyboardEvent) => {
      if (!visible) return;
      if (event.type === 'keyup') {
        if (drawData.creatingObject) {
          setDrawData((s) => {
            if (
              s.creatingObject?.type === EObjectType.Mask &&
              s.creatingObject?.maskStep?.points?.length
            ) {
              // Creating single Mask
              s.creatingObject.maskStep = undefined;
            } else {
              s.creatingObject = undefined;
              if (s.AIAnnotation) {
                s.segmentationClicks = undefined;
                s.segmentationMask = undefined;
              }
              s.activeObjectIndex = -1;
            }
          });
        } else {
          setDrawData((s) => {
            s.activeObjectIndex = -1;
          });
        }
      }
    },
    { events: ['keydown', 'keyup'] },
  );

  /** Hide Current Selected Object */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.HideCurrObject].shortcut,
    (event) => {
      if (drawData.activeObjectIndex === -1) return;
      event.preventDefault();
      onChangeObjectHidden(
        drawData.activeObjectIndex,
        !drawData.objectList[drawData.activeObjectIndex].hidden,
      );
    },
    {
      exactMatch: true,
    },
  );

  /** Hide the Category of Current Object */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.HideCurrCategory].shortcut,
    (event) => {
      if (drawData.activeObjectIndex === -1) return;
      event.preventDefault();
      const { label, hidden } = drawData.objectList[drawData.activeObjectIndex];
      onChangeCategoryHidden(label, !hidden);
    },
    {
      exactMatch: true,
    },
  );

  /** Delete Current Selected Object */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.DeleteCurrObject].shortcut,
    (event) => {
      if (!visible || mode !== EditorMode.Edit) return;
      if (['Delete', 'Backspace'].includes(event.key)) {
        if (drawData.activeObjectIndex > -1) {
          removeObject(drawData.activeObjectIndex);
        }
      }
    },
    { events: ['keyup'] },
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
                    onClick: () => onCancelAnnotations(drawData),
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
                    ref={maskCanvasRef}
                    onContextMenu={(
                      event: React.MouseEvent<HTMLCanvasElement>,
                    ) => event.preventDefault()}
                    draggable={false}
                  />
                  {renderPopoverMenu()}
                </>
              ),
            })}
            {mode === EditorMode.Edit &&
              !(
                drawData.selectedTool === EBasicToolItem.Skeleton &&
                drawData.AIAnnotation
              ) && (
                <AnnotationEditor
                  hideTitle={currEditObject?.type === EObjectType.Mask}
                  allowAddCategory={isSeperate}
                  drawData={drawData}
                  categories={categories}
                  currEditObject={currEditObject}
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
                  s.segmentationClicks = undefined;
                  s.segmentationMask = undefined;
                });
              }}
              onAiAnnotation={() => onAiAnnotation(drawData, aiLabels)}
              onSaveCurrCreate={() => {
                addObject({
                  type: EObjectType.Polygon,
                  polygon: drawData.creatingObject?.polygon,
                  label: drawData.creatingObject?.label || '',
                  hidden: false,
                });
                setDrawData((s) => {
                  s.activeObjectIndex = s.objectList.length - 1;
                  s.segmentationClicks = undefined;
                  s.segmentationMask = undefined;
                  s.creatingObject = undefined;
                });
              }}
              onCancelCurrCreate={() => {
                setDrawData((s) => {
                  s.creatingObject = undefined;
                  s.activeObjectIndex = -1;
                  s.segmentationClicks = undefined;
                  s.segmentationMask = undefined;
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
                  undo={onUndo}
                  redo={onRedo}
                />
                {drawData.selectedTool === EBasicToolItem.Mask && (
                  <SubToolBar
                    selectedSubTool={drawData.selectedSubTool}
                    isAIAnnotationActive={drawData.AIAnnotation}
                    onChangeSubTool={(type) => {
                      selectSubTool(type);
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
            focusObjectIndex={drawData.focusObjectIndex}
            activeObjectIndex={drawData.activeObjectIndex}
            focusEleIndex={drawData.focusEleIndex}
            focusEleType={drawData.focusEleType}
            isMovingElement={!!drawData.startElementMovePoint}
            activeClassName={drawData.activeClassName}
            onFocusObject={(index) =>
              setDrawData((s) => {
                s.focusObjectIndex = index;
              })
            }
            onActiveObject={(index) => {
              setDrawData((s) => {
                s.selectedTool = EBasicToolItem.Drag;
                s.activeObjectIndex = index;
              });
              // Mask object active
              if (drawData.objectList[index].type === EObjectType.Mask) {
                activeMaskObject(index);
              }
            }}
            onFocusElement={(index) =>
              setDrawData((s) => {
                s.focusEleIndex = index;
              })
            }
            onChangeFocusEleType={(type) => {
              setDrawData((s) => {
                s.focusEleType = type;
              });
            }}
            onCancelMovingStatus={() => {
              setDrawData((s) => {
                s.startElementMovePoint = undefined;
              });
            }}
            onChangeObjectHidden={onChangeObjectHidden}
            onChangeCategoryHidden={onChangeCategoryHidden}
            onDeleteObject={removeObject}
            onChangeEleVisible={onChangeElementVisible}
            onChangePointVisible={onChangePointVisible}
            onConvertPolygonToAIMode={(objIndex) => {
              if (!process.env.MODEL_API_PATH) {
                displayAIModeUnavailableModal();
                return;
              }
              setDrawData((s) => {
                s.AIAnnotation = true;
                s.selectedTool = EBasicToolItem.Polygon;
                s.creatingObject = {
                  type: EObjectType.Polygon,
                  label: drawData.objectList[objIndex].label,
                  hidden: false,
                  polygon: {
                    visible: true,
                    group: drawData.objectList[objIndex].polygon?.group || [],
                  },
                };
                s.activeObjectIndex = -1;
                const objectList = [...s.objectList];
                objectList.splice(objIndex, 1);
                s.objectList = [...objectList];
              });
            }}
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
