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
  BODY_TEMPLATE,
  ESubToolItem,
  EBasicToolTypeMap,
} from '@/constants';
import { Updater, useImmer } from 'use-immer';
import { useKeyPress } from 'ahooks';
import {
  clearCanvas,
  drawCircleWithFill,
  drawImage,
  drawLine,
  drawPolygonWithFill,
  drawQuadraticPath,
  drawRect,
  resizeSmoothCanvas,
  setCanvasGlobalAlpha,
  shadeEverythingButRect,
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
  translateObjectsToAnnotations,
  translatePolygonCoord,
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
  ANNO_MASK_ALPHA,
  ANNO_STROKE_ALPHA,
  ANNO_STROKE_COLOR,
} from './constants/render';
import useHistory, { HistoryItem } from './hooks/useHistory';
import useObjects from './hooks/useObjects';
import { cloneDeep } from 'lodash';
import { Modal } from 'antd';
import { useLocale } from '@/locales/helper';
import { usePreviousState } from '@/hooks/usePreviousState';
import useCanvasContainer from '@/hooks/useCanvasContainer';
import { SubToolBar } from './components/SubToolBar';
import { objectToRle, renderMask, rleToCanvas } from './tools/mask';
import {
  DEFAULT_DRAW_DATA,
  DEFAULT_EDIT_STATE,
  DrawData,
  EditImageData,
  EditState,
  EditorMode,
  IAnnotationObject,
  ICreatingObject,
  PromptItem,
  EMaskPromptType,
} from './type';

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

  const [isRequiring, setIsRequiring] = useImmer(false);

  const [annotations, setAnnotations] = useImmer<DATA.BaseObject[]>([]);

  const [allowMove, setAllowMove] = useImmer(false);

  const [editState, setEditState] = useImmer<EditState>(
    cloneDeep(DEFAULT_EDIT_STATE),
  );

  const [drawData, setDrawData] = useImmer<DrawData>(
    cloneDeep(DEFAULT_DRAW_DATA),
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const isDragToolActive = useMemo(() => {
    return drawData.selectedTool === EBasicToolItem.Drag;
  }, [drawData.selectedTool]);

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

  const autoSave = (item: HistoryItem) => {
    const annotations = translateObjectsToAnnotations(
      item.drawData.objectList,
      naturalSize,
      item.clientSize,
    );
    onAutoSave?.(annotations);
  };

  const {
    undo,
    redo,
    clearHistory,
    hadChangeRecord,
    updateHistory,
    setDrawDataWithHistory,
  } = useHistory({
    clientSize,
    setDrawData,
    onAutoSave: autoSave,
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
    setDrawDataWithHistory,
    setEditState,
    mode,
  });

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
    editState,
    setEditState,
    updateObject,
  });

  const { onAiAnnotation, onSaveAnnotations, onCancelAnnotations } = useActions(
    {
      list,
      current,
      setDrawData,
      editState,
      setEditState,
      isRequiring,
      setIsRequiring,
      naturalSize,
      clientSize,
      onCancel,
      onSave,
      updateAllObject,
      hadChangeRecord,
      latestLabel: editState.latestLabel,
      labelColors,
    },
  );

  /** =================================================================================================================
  /** States related to hovering and selection
  /** ================================================================================================================= */

  const updateFocusInfoWhenMouseMove = () => {
    const focusObjectIndex = judgeFocusOnObject(
      clientSize,
      contentMouse,
      drawData.activeObjectIndex,
      drawData.objectList,
    );
    /** If focus in active object */
    if (
      focusObjectIndex > -1 &&
      focusObjectIndex === drawData.activeObjectIndex
    ) {
      setEditState((s) => {
        s.focusObjectIndex = focusObjectIndex;
      });
      /** Update focus element index & mouse style */
      const activeObject = drawData.objectList[drawData.activeObjectIndex];
      const { focusEleIndex, focusEleType } = judgeFocusOnElement(
        contentMouse,
        activeObject,
      );
      setEditState((s) => {
        s.focusEleIndex = focusEleIndex;
        s.focusEleType = focusEleType;
      });
      if (activeObject.polygon) {
        const hoverDetail = getFocusPartInPolygonGroup(
          activeObject.polygon,
          contentMouse,
        );
        setEditState((s) => {
          s.focusPolygonInfo = hoverDetail;
        });
      }
    } else if (isDragToolActive) {
      setEditState((s) => {
        s.focusObjectIndex = focusObjectIndex;
        s.focusEleIndex = -1;
        s.focusEleType = EElementType.Rect;
      });
    } else {
      setEditState((s) => {
        s.focusObjectIndex = -1;
        s.focusEleIndex = -1;
        s.focusEleType = EElementType.Rect;
      });
    }
  };

  const setCurrSelectedObject = (index = editState.focusObjectIndex) => {
    if (index < 0) return;
    setDrawData((s) => {
      s.activeObjectIndex = index;
      s.creatingObject = {
        ...drawData.objectList[index],
        currIndex: undefined,
        startPoint: undefined,
        tempMaskSteps: [],
        maskStep: undefined,
      };

      if (
        s.selectedTool !== EBasicToolItem.Drag &&
        s.objectList[index] &&
        EBasicToolTypeMap[s.selectedTool] !== s.objectList[index].type
      ) {
        s.selectedTool = EBasicToolItem.Drag;
      }

      // TODO: support edit mask in drag tool
      if (s.objectList[index].type === EObjectType.Mask) {
        s.selectedTool = EBasicToolItem.Mask;
      }
    });
  };

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

  // =================================================================================================================
  // Render
  // =================================================================================================================

  const renderRect = (
    canvas: HTMLCanvasElement,
    rect: IElement<IRect>,
    color: string,
    strokeAlpha: number,
    fillAlpha: number,
  ) => {
    drawRect(
      canvas,
      rect,
      hexToRgba(color, strokeAlpha),
      2,
      LABELS_STROKE_DASH[0],
      hexToRgba(color, fillAlpha),
    );
  };

  const renderRectActive = (
    canvas: HTMLCanvasElement,
    rect: IElement<IRect>,
  ) => {
    const handleCenters: IPoint[] = mapRectToAnchors(rect).map(
      (rectAnchor) => rectAnchor.position,
    );
    handleCenters.forEach((center: IPoint) => {
      const handleRect: IRect = getRectWithCenterAndSize(center, {
        width: 10,
        height: 10,
      });
      const handleRectBetweenPixels: IRect = setRectBetweenPixels(handleRect);
      drawRect(
        canvas,
        handleRectBetweenPixels,
        'rgba(0, 0, 0, 0.8)',
        3,
        LABELS_STROKE_DASH[0],
        '#fff',
      );
    });
  };

  const renderKeypoints = (
    canvas: HTMLCanvasElement,
    keypoints: {
      points: IElement<IPoint>[];
      lines: number[];
    },
    color: string,
    strokeAlpha: number,
  ) => {
    const { lines, points } = keypoints;

    // draw line
    for (let i = 0; i * 2 < lines.length; i++) {
      const [index1, index2] = [lines[i * 2], lines[i * 2 + 1]];
      if (
        points[index1].visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible &&
        points[index2].visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible
      ) {
        drawLine(
          canvas,
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
        drawCircleWithFill(canvas, { x, y }, 4, fillColor, 2, strokeColor);
      }
    });
  };

  const renderPolygon = (
    canvas: HTMLCanvasElement,
    polygon: IElement<IPolygonGroup>,
    color: string,
    strokeAlpha: number,
    fillAlpha: number,
  ) => {
    if (polygon && polygon.visible) {
      polygon?.group.forEach((polygon) => {
        drawPolygonWithFill(
          canvas,
          polygon,
          hexToRgba(color, fillAlpha),
          hexToRgba(color, strokeAlpha),
          2,
          LABELS_STROKE_DASH[0],
        );
      });
    }
  };

  const updateCreatingRender = (creatingObject: ICreatingObject) => {
    const color = labelColors[creatingObject.label] || '#fff';
    const strokeColor = ANNO_STROKE_COLOR.CREATING;
    const fillColor = ANNO_FILL_COLOR.CREATING;

    switch (creatingObject.type) {
      case EObjectType.Rectangle: {
        const { startPoint } = creatingObject;
        if (startPoint) {
          // creating
          const rect = getRectFromPoints(
            startPoint,
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
            activeCanvasRef.current,
            canvasCoordRect,
            strokeColor,
            2,
            LABELS_STROKE_DASH[0],
            fillColor,
          );
        }
        break;
      }
      case EObjectType.Polygon: {
        // draw unfinished points and lines
        const { currIndex } = creatingObject;
        const annotObject = translateAnnotCoord(creatingObject, {
          x: -imagePos.current.x,
          y: -imagePos.current.y,
        });
        const { polygon } = annotObject;
        if (polygon && polygon.visible) {
          const innerPolygonIdx = getInnerPolygonIndexFromGroup(polygon.group);
          // draw creating polygon
          polygon.group.forEach((polygon, polygonIdx) => {
            if (currIndex === polygonIdx) {
              polygon.forEach((point, pointIdx) => {
                // draw points
                drawCircleWithFill(
                  activeCanvasRef.current!,
                  point,
                  pointIdx === 0 ? 6 : 4,
                  strokeColor,
                  3,
                  '#1f4dd8',
                );
                // draw lines
                if (polygon.length > 1 && pointIdx < polygon.length - 1) {
                  drawLine(
                    activeCanvasRef.current!,
                    polygon[pointIdx],
                    polygon[pointIdx + 1],
                    hexToRgba(strokeColor, ANNO_STROKE_ALPHA.CREATING),
                    2.5,
                    LABELS_STROKE_DASH[0],
                  );
                } else if (pointIdx === polygon.length - 1) {
                  drawLine(
                    activeCanvasRef.current!,
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
                  activeCanvasRef.current,
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
              activeCanvasRef.current,
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
        const { startPoint } = creatingObject;
        if (startPoint) {
          // creating
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
          drawRect(activeCanvasRef.current, canvasCoordRect, strokeColor, 2);

          // draw circles
          updatedKeypoints.forEach((p) => {
            drawCircleWithFill(
              activeCanvasRef.current!,
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
              activeCanvasRef.current!,
              updatedKeypoints[index1],
              updatedKeypoints[index2],
              strokeColor,
              2.5,
              LABELS_STROKE_DASH[0],
            );
          }
        }
        break;
      }
      case EObjectType.Mask: {
        renderMask(
          activeCanvasRef.current!,
          creatingObject,
          imagePos.current,
          color,
          {
            x: containerMouse.elementX,
            y: containerMouse.elementY,
          },
          clientSize,
          naturalSize,
        );
        break;
      }
      default:
        break;
    }
  };

  const updateEditingRender = (creatingObject: ICreatingObject) => {
    // draw currently annotated objects
    const canvasCoordObject = translateAnnotCoord(creatingObject, {
      x: -imagePos.current.x,
      y: -imagePos.current.y,
    });
    const { rect, keypoints, polygon, label } = canvasCoordObject;

    const color = labelColors[label] || '#fff';
    const isFocus = editState.focusObjectIndex === drawData.activeObjectIndex;
    const [fillAlpha, strokeAlpha] = isFocus
      ? [ANNO_FILL_ALPHA.FOCUS, ANNO_STROKE_ALPHA.FOCUS]
      : [ANNO_FILL_ALPHA.CREATING, ANNO_STROKE_ALPHA.CREATING];

    switch (creatingObject.type) {
      case EObjectType.Rectangle: {
        if (rect && rect.visible) {
          renderRect(
            activeCanvasRef.current!,
            rect,
            color,
            strokeAlpha,
            fillAlpha,
          );
          renderRectActive(activeCanvasRef.current!, rect);
        }
        break;
      }
      case EObjectType.Polygon: {
        if (polygon && polygon.visible) {
          const innerPolygonIdx = getInnerPolygonIndexFromGroup(polygon.group);
          const isFocusOnPolygon =
            isFocus &&
            editState.focusEleType === EElementType.Polygon &&
            editState.focusEleIndex === 0;

          polygon.group.forEach((polygon, index) => {
            if (!innerPolygonIdx.includes(index)) {
              const fillColor = isFocusOnPolygon
                ? hexToRgba(color, 0.2)
                : 'transparent';
              drawPolygonWithFill(
                activeCanvasRef.current,
                polygon,
                fillColor,
                hexToRgba(color, strokeAlpha),
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
              activeCanvasRef.current,
              polygon.group[index],
              fillColor,
              hexToRgba(color, strokeAlpha),
              2,
              LABELS_STROKE_DASH[0],
            );
          });

          // draw points when actived
          polygon.group.forEach((points) => {
            points.forEach((point) => {
              drawCircleWithFill(
                activeCanvasRef.current!,
                point,
                4,
                color,
                2,
                '#fff',
              );
            });
          });

          // drawHighlight point when foucs
          const { index, pointIndex, lineIndex } = editState.focusPolygonInfo;
          if (index > -1 && pointIndex > -1) {
            const focusPoint = polygon.group[index][pointIndex];
            if (focusPoint) {
              drawCircleWithFill(
                activeCanvasRef.current!,
                focusPoint,
                4,
                '#fff',
                5,
                color,
              );
            }
          } else if (index > -1 && lineIndex > -1) {
            const lines = getLinesFromPolygon(polygon.group[index]);
            if (lines[lineIndex]) {
              const { start, end } = lines[lineIndex];
              const midPoint = getMidPointFromTwoPoints(start, end);
              if (midPoint) {
                drawCircleWithFill(
                  activeCanvasRef.current!,
                  midPoint,
                  4,
                  '#fff',
                  5,
                  color,
                );
              }
            }
          }
        }
        break;
      }
      case EObjectType.Skeleton: {
        if (rect && rect.visible) {
          // editing
          renderRect(
            activeCanvasRef.current!,
            rect,
            color,
            strokeAlpha,
            fillAlpha,
          );
          renderRectActive(activeCanvasRef.current!, rect);
        }
        if (keypoints) {
          renderKeypoints(
            activeCanvasRef.current!,
            keypoints,
            color,
            strokeAlpha,
          );

          // draw hightlight circle
          if (
            isFocus &&
            editState.focusEleType === EElementType.Circle &&
            keypoints.points[editState.focusEleIndex]
          ) {
            const { x, y, visible, color } =
              keypoints.points[editState.focusEleIndex];
            if (visible === KEYPOINTS_VISIBLE_TYPE.labeledVisible) {
              drawCircleWithFill(
                activeCanvasRef.current!,
                { x, y },
                4,
                color,
                5,
                '#fff',
              );
            }
          }
        }
        break;
      }
      case EObjectType.Mask: {
        renderMask(
          activeCanvasRef.current!,
          creatingObject,
          imagePos.current,
          color,
          {
            x: containerMouse.elementX,
            y: containerMouse.elementY,
          },
          clientSize,
          naturalSize,
        );
        break;
      }
      default:
        break;
    }
  };

  const updateCreatingPromptRender = (theDrawData: DrawData) => {
    // draw creating prompt
    if (theDrawData.creatingPrompt) {
      const strokeColor = ANNO_STROKE_COLOR.CREATING;
      const fillColor = ANNO_FILL_COLOR.CREATING;
      switch (theDrawData.creatingPrompt.type) {
        case EMaskPromptType.Rect: {
          const { startPoint } = theDrawData.creatingPrompt;
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
            activeCanvasRef.current,
            canvasCoordRect,
            strokeColor,
            2,
            LABELS_STROKE_DASH[0],
            fillColor,
          );
          break;
        }
        case EMaskPromptType.EdgeStitch:
        case EMaskPromptType.Stroke: {
          if (!theDrawData.creatingPrompt.stroke) break;
          const canvasCoordStroke = translatePolygonCoord(
            theDrawData.creatingPrompt.stroke,
            {
              x: -imagePos.current.x,
              y: -imagePos.current.y,
            },
          );
          drawQuadraticPath(
            activeCanvasRef.current!,
            canvasCoordStroke,
            hexToRgba(strokeColor, ANNO_MASK_ALPHA.CREATING),
            (theDrawData.creatingPrompt.radius! * clientSize.width) /
              naturalSize.width,
          );
          break;
        }
        default:
          break;
      }

      // draw segmentation reference points
      if (theDrawData.segmentationClicks) {
        theDrawData.segmentationClicks.forEach((click) => {
          const canvasCoordPoint = translatePointCoord(click.point, {
            x: -imagePos.current.x,
            y: -imagePos.current.y,
          });
          drawCircleWithFill(
            activeCanvasRef.current!,
            canvasCoordPoint,
            3,
            click.isPositive ? 'green' : 'red',
            0,
            '#fff',
          );
        });
      }

      // draw propmt while using mask tools
      if (theDrawData.prompt && theDrawData.prompt.length > 0) {
        const latestPrompt = theDrawData.prompt[theDrawData.prompt.length - 1];
        if (
          latestPrompt &&
          latestPrompt.type === EMaskPromptType.Point &&
          latestPrompt.point &&
          isRequiring
        ) {
          const canvasCoordPoint = translatePointCoord(latestPrompt.point, {
            x: -imagePos.current.x,
            y: -imagePos.current.y,
          });
          drawCircleWithFill(
            activeCanvasRef.current!,
            canvasCoordPoint,
            5,
            latestPrompt.isPositive ? 'green' : 'red',
            3,
            '#fff',
          );
        }
      }

      // draw active area while loading ai annotations
      if (isRequiring && theDrawData.activeRectWhileLoading) {
        const canvasCoordRect = translateRectCoord(
          theDrawData.activeRectWhileLoading,
          {
            x: -imagePos.current.x,
            y: -imagePos.current.y,
          },
        );
        shadeEverythingButRect(activeCanvasRef.current!, canvasCoordRect);
      }
    }
  };

  const updateRenderActiveCanvas = (updateDrawData?: DrawData) => {
    if (!visible || !activeCanvasRef.current) return;

    resizeSmoothCanvas(activeCanvasRef.current, {
      width: containerMouse.elementW,
      height: containerMouse.elementH,
    });
    activeCanvasRef.current.getContext('2d')!.imageSmoothingEnabled = false;
    clearCanvas(activeCanvasRef.current);

    const theDrawData = updateDrawData || drawData;
    if (!theDrawData.creatingObject) return;

    if (theDrawData.activeObjectIndex > -1) {
      updateEditingRender(theDrawData.creatingObject);
    } else {
      updateCreatingRender(theDrawData.creatingObject);
    }
    updateCreatingPromptRender(theDrawData);
  };

  const updateRender = (updateDrawData?: DrawData) => {
    if (!visible || !canvasRef.current || !imgRef.current) return;

    resizeSmoothCanvas(canvasRef.current, {
      width: containerMouse.elementW,
      height: containerMouse.elementH,
    });
    canvasRef.current.getContext('2d')!.imageSmoothingEnabled = false;
    clearCanvas(canvasRef.current);

    drawImage(canvasRef.current, imgRef.current, {
      x: imagePos.current.x,
      y: imagePos.current.y,
      width: clientSize.width,
      height: clientSize.height,
    });

    const theDrawData = updateDrawData || drawData;

    // draw esisting objects
    theDrawData.objectList.forEach((obj, index) => {
      if (obj.hidden || index === theDrawData.activeObjectIndex) return;

      const canvasCoordObject = translateAnnotCoord(obj, {
        x: -imagePos.current.x,
        y: -imagePos.current.y,
      });
      const { rect, keypoints, polygon, maskCanvasElement, label } =
        canvasCoordObject;
      const isFocus = editState.focusObjectIndex === index;

      // Color styles
      const color = labelColors[label] || '#fff';
      const [fillAlpha, strokeAlpha, maskAlpha] = isFocus
        ? [
            ANNO_FILL_ALPHA.FOCUS,
            ANNO_STROKE_ALPHA.FOCUS,
            ANNO_MASK_ALPHA.FOCUS,
          ]
        : [
            ANNO_FILL_ALPHA.DEFAULT,
            ANNO_STROKE_ALPHA.DEFAULT,
            ANNO_MASK_ALPHA.DEFAULT,
          ];

      // Change globalAlpha when creating / editing object
      setCanvasGlobalAlpha(
        canvasRef.current!,
        drawData.creatingObject ? 0.3 : 1,
      );

      // draw rect
      if (rect && rect.visible) {
        renderRect(canvasRef.current!, rect, color, strokeAlpha, fillAlpha);
      }

      // draw keypoints
      if (keypoints) {
        renderKeypoints(canvasRef.current!, keypoints, color, strokeAlpha);
      }

      // draw polygon
      if (polygon && polygon.visible) {
        renderPolygon(
          canvasRef.current!,
          polygon,
          color,
          strokeAlpha,
          fillAlpha,
        );
      }

      // draw mask
      if (maskCanvasElement && theDrawData.activeObjectIndex !== index) {
        const ctx = canvasRef.current!.getContext(
          '2d',
        ) as CanvasRenderingContext2D;
        const tempAlpha = ctx.globalAlpha;
        ctx.globalAlpha = ctx.globalAlpha * maskAlpha;
        drawImage(canvasRef.current!, maskCanvasElement, {
          x: imagePos.current.x,
          y: imagePos.current.y,
          width: clientSize.width,
          height: clientSize.height,
        });
        // restore
        ctx.globalAlpha = tempAlpha;
      }
    });

    // draw creating object
    updateRenderActiveCanvas(updateDrawData);
  };

  /** =================================================================================================================
  /** update mouse style 
  /** ================================================================================================================= */

  const updateMouseCursor = useCallback(
    (value: string, position?: Direction) => {
      if (!activeCanvasRef.current) return;

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
      if (cursor !== activeCanvasRef.current.style.cursor) {
        activeCanvasRef.current.style.cursor = cursor;
      }
    },
    [activeCanvasRef.current],
  );

  const updateMouseWhenMouseMove = () => {
    if (
      editState.focusObjectIndex > -1 &&
      editState.focusObjectIndex === drawData.activeObjectIndex
    ) {
      switch (editState.focusEleType) {
        case EElementType.Rect: {
          if (drawData.activeObjectIndex > -1) {
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
          }
          break;
        }
        case EElementType.Polygon:
        case EElementType.Circle:
        default: {
          updateMouseCursor('pointer');
          break;
        }
      }
    } else if (editState.focusObjectIndex > 0) {
      updateMouseCursor('pointer');
    } else if (!isDragToolActive) {
      updateMouseCursor('crosshair');
    } else {
      updateMouseCursor('grab');
    }
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
      s.activeObjectIndex = -1;
    });
    const point = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    const basic = {
      hidden: false,
      label: editState.latestLabel || categories[0].name,
    };
    switch (drawData.selectedTool) {
      case EBasicToolItem.Rectangle: {
        setDrawData((s) => {
          s.creatingObject = {
            type: EObjectType.Rectangle,
            startPoint: point,
            ...basic,
          };
        });
        break;
      }
      case EBasicToolItem.Polygon: {
        setDrawData((s) => {
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
            updateHistory(
              cloneDeep({
                drawData: s,
                clientSize,
              }),
            );
          }
        });
        break;
      }
      case EBasicToolItem.Skeleton: {
        setDrawData((s) => {
          s.creatingObject = {
            type: EObjectType.Skeleton,
            startPoint: point,
            ...basic,
          };
        });
        break;
      }
      case EBasicToolItem.Mask: {
        setDrawData((s) => {
          switch (s.selectedSubTool) {
            case ESubToolItem.PenAdd:
            case ESubToolItem.PenErase:
            case ESubToolItem.BrushAdd:
            case ESubToolItem.BrushErase:
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
                  radius: s.brushSize,
                },
                tempMaskSteps: [],
              };
              s.segmentationMask = undefined;
              break;
            case ESubToolItem.AutoSegmentByBox:
              s.creatingPrompt = {
                type: EMaskPromptType.Rect,
                startPoint: point,
                isPositive: true,
              };
              break;
            case ESubToolItem.AutoSegmentByClick:
              s.creatingPrompt = {
                type: EMaskPromptType.Point,
                startPoint: point,
                point: point,
                isPositive: true,
              };
              break;
            case ESubToolItem.AutoSegmentByStroke:
              s.creatingPrompt = {
                type: EMaskPromptType.Stroke,
                startPoint: point,
                stroke: [point],
                radius: s.brushSize,
                isPositive: true,
              };
              break;
            case ESubToolItem.AutoEdgeStitching:
              s.creatingPrompt = {
                type: EMaskPromptType.EdgeStitch,
                startPoint: point,
                stroke: [point],
                radius: s.brushSize,
                isPositive: true,
              };
              break;
            default:
              break;
          }
        });
        break;
      }
    }
  };

  const updateMaskCreatingOrEditingWhenMouseDown = () => {
    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    setDrawData((s) => {
      switch (s.selectedSubTool) {
        case ESubToolItem.PenAdd:
        case ESubToolItem.PenErase:
        case ESubToolItem.BrushAdd:
        case ESubToolItem.BrushErase:
          if (s.creatingObject) {
            if (s.creatingObject.maskStep) {
              // add points for currently path
              s.creatingObject.maskStep.points.push(mouse);
              // judege to close path
              if (
                [ESubToolItem.PenAdd, ESubToolItem.PenErase].includes(
                  s.selectedSubTool,
                ) &&
                isPointOnPoint(
                  s.creatingObject.maskStep.points[0],
                  contentMouse,
                )
              ) {
                s.creatingObject.tempMaskSteps?.push(s.creatingObject.maskStep);
                s.creatingObject.maskStep = undefined;
              }
            } else {
              // init new step for creating points
              s.creatingObject.maskStep = {
                tool: s.selectedSubTool,
                positive:
                  s.selectedSubTool === ESubToolItem.PenAdd ||
                  s.selectedSubTool === ESubToolItem.BrushAdd,
                points: [mouse],
                radius: s.brushSize,
              };
            }
            if (
              ![ESubToolItem.BrushAdd, ESubToolItem.BrushErase].includes(
                s.selectedSubTool,
              )
            ) {
              // Brush tool need not push history when mousedown
              updateHistory(
                cloneDeep({
                  drawData: s,
                  clientSize,
                }),
              );
            }
          }
          s.segmentationMask = undefined;
          break;
        case ESubToolItem.AutoSegmentByBox:
          s.creatingPrompt = {
            type: EMaskPromptType.Rect,
            startPoint: mouse,
            isPositive: true,
          };
          break;
        case ESubToolItem.AutoSegmentByClick:
          s.creatingPrompt = {
            type: EMaskPromptType.Point,
            startPoint: mouse,
            point: mouse,
            isPositive: true,
          };
          break;
        case ESubToolItem.AutoSegmentByStroke:
          s.creatingPrompt = {
            type: EMaskPromptType.Stroke,
            startPoint: mouse,
            stroke: [mouse],
            radius: s.brushSize,
            isPositive: true,
          };
          break;
        case ESubToolItem.AutoEdgeStitching:
          s.creatingPrompt = {
            type: EMaskPromptType.EdgeStitch,
            startPoint: mouse,
            stroke: [mouse],
            radius: s.brushSize,
            isPositive: true,
          };
        default:
          break;
      }
    });
  };

  const finishMaskCreatingOrEditingWhenMouseUp = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (!drawData.creatingObject && !drawData.creatingPrompt) return;
    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    switch (drawData.selectedSubTool) {
      case ESubToolItem.BrushAdd:
      case ESubToolItem.BrushErase:
      case ESubToolItem.PenAdd:
      case ESubToolItem.PenErase: {
        setDrawDataWithHistory((s) => {
          if (
            s.creatingObject &&
            s.creatingObject.tempMaskSteps &&
            s.creatingObject.maskStep &&
            s.creatingObject.maskStep.points.length > 1
          ) {
            if (
              [ESubToolItem.BrushAdd, ESubToolItem.BrushErase].includes(
                s.selectedSubTool,
              ) ||
              ([ESubToolItem.PenAdd, ESubToolItem.PenErase].includes(
                s.selectedSubTool,
              ) &&
                isPointOnPoint(
                  s.creatingObject.maskStep.points[0],
                  contentMouse,
                ))
            ) {
              s.creatingObject.tempMaskSteps?.push(s.creatingObject.maskStep);
              s.creatingObject.maskStep = undefined;
            }
          }
          s.segmentationMask = undefined;
        });
        break;
      }
      case ESubToolItem.AutoSegmentByBox: {
        if (!drawData.creatingPrompt?.startPoint) break;
        if (
          mouse.x === drawData.creatingPrompt.startPoint?.x ||
          mouse.y === drawData.creatingPrompt.startPoint?.y
        ) {
          setDrawData((s) => (s.creatingPrompt = undefined));
          break;
        }
        const rect = getRectFromPoints(
          drawData.creatingPrompt.startPoint as IPoint,
          mouse,
          {
            width: contentMouse.elementW,
            height: contentMouse.elementH,
          },
        );
        const promptItem: PromptItem = {
          type: EMaskPromptType.Rect,
          isPositive: true,
          rect,
        };
        const prompt = drawData.prompt
          ? [...drawData.prompt, promptItem]
          : [promptItem];
        setDrawDataWithHistory((s) => {
          s.prompt = prompt;
          s.activeRectWhileLoading = rect;
          s.creatingPrompt = undefined;
        });
        onAiAnnotation({ ...drawData, prompt }, []);
        break;
      }
      case ESubToolItem.AutoSegmentByClick: {
        if (!isInCanvas(contentMouse) || !drawData.creatingPrompt?.point) break;
        const promptItem: PromptItem = {
          type: EMaskPromptType.Point,
          isPositive: event.button === 0 ? true : false,
          point: mouse,
        };
        const prompt = drawData.prompt
          ? [...drawData.prompt, promptItem]
          : [promptItem];
        setDrawDataWithHistory((s) => {
          s.prompt = prompt;
          s.creatingPrompt = undefined;
        });
        onAiAnnotation({ ...drawData, prompt }, []);
        break;
      }
      case ESubToolItem.AutoSegmentByStroke: {
        if (!drawData.creatingPrompt?.stroke) break;
        const promptItem: PromptItem = {
          type: EMaskPromptType.Stroke,
          isPositive: true,
          stroke: drawData.creatingPrompt.stroke,
          radius: drawData.brushSize,
        };
        const prompt = drawData.prompt
          ? [...drawData.prompt, promptItem]
          : [promptItem];
        setDrawDataWithHistory((s) => {
          s.prompt = prompt;
          s.creatingPrompt = undefined;
        });
        onAiAnnotation({ ...drawData, prompt }, []);
        break;
      }
      case ESubToolItem.AutoEdgeStitching: {
        if (!drawData.creatingPrompt?.stroke) break;
        onAiAnnotation({ ...drawData }, []);
        setDrawDataWithHistory((s) => {
          s.creatingPrompt = undefined;
        });
        break;
      }
    }
  };

  const updateCreatingWhenMouseDown = () => {
    if (
      !isInCanvas(contentMouse) ||
      !drawData.creatingObject ||
      drawData.activeObjectIndex > -1
    ) {
      return false;
    }

    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    switch (drawData.creatingObject.type) {
      case EObjectType.Mask: {
        updateMaskCreatingOrEditingWhenMouseDown();
        return true;
      }
      case EObjectType.Polygon: {
        // Polygon - creating
        setDrawData((s) => {
          if (!s.creatingObject) return s;
          if (!drawData.AIAnnotation) {
            const currIndex = s.creatingObject.currIndex as number;
            const polygon = s.creatingObject.polygon as IElement<IPolygonGroup>;
            if (currIndex > -1) {
              const startPoint = polygon.group[currIndex][0];
              // finish creating polygon when click on startpoint
              if (isPointOnPoint(startPoint, contentMouse)) {
                s.creatingObject.currIndex = -1;
              } else if (s.creatingObject.polygon) {
                polygon.group[currIndex].push(mouse);
                updateHistory(
                  cloneDeep({
                    drawData: s,
                    clientSize,
                  }),
                );
              }
            } else {
              polygon.group.push([mouse]);
              s.creatingObject.currIndex = polygon.group.length - 1;
              updateHistory(
                cloneDeep({
                  drawData: s,
                  clientSize,
                }),
              );
            }
          }
        });
        return true;
      }
      case EObjectType.Rectangle:
      case EObjectType.Skeleton:
        break;
    }
    return false;
  };

  const updateCreatingWhenMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (drawData.creatingObject || drawData.creatingPrompt) {
      const allowRecordMousePath =
        drawData.selectedTool === EBasicToolItem.Mask &&
        [
          ESubToolItem.BrushAdd,
          ESubToolItem.BrushErase,
          ESubToolItem.PenAdd,
          ESubToolItem.PenErase,
          ESubToolItem.AutoSegmentByStroke,
          ESubToolItem.AutoEdgeStitching,
        ].includes(drawData.selectedSubTool);

      const isMousePress = event.buttons === 1;

      if (allowRecordMousePath && isMousePress) {
        const mouse = {
          x: contentMouse.elementX,
          y: contentMouse.elementY,
        };
        const isCreatingPrompt = [
          ESubToolItem.AutoSegmentByStroke,
          ESubToolItem.AutoEdgeStitching,
        ].includes(drawData.selectedSubTool);
        setDrawData((s) => {
          if (isCreatingPrompt) {
            s.creatingPrompt?.stroke?.push(mouse);
          } else {
            s.creatingObject?.maskStep?.points.push(mouse);
          }
        });
        updateRender();
        return true;
      }
    }
    return false;
  };

  const finishCreatingWhenMouseUp = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (drawData.activeObjectIndex > -1) {
      return false;
    }

    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };
    switch (drawData.selectedTool) {
      case EBasicToolItem.Rectangle: {
        if (!drawData.creatingObject) break;
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
        }
        return true;
      }
      case EBasicToolItem.Polygon: {
        if (!drawData.creatingObject) break;
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
          if (drawData.creatingObject.currIndex === -1) {
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
        return true;
      }
      case EBasicToolItem.Skeleton: {
        if (!drawData.creatingObject) break;
        if (drawData.creatingObject.startPoint) {
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
        return true;
      }
      case EBasicToolItem.Mask: {
        finishMaskCreatingOrEditingWhenMouseUp(event);
        return true;
      }
    }
  };

  // =================================================================================================================
  // Logics For Editing Exsiting Annotations
  // =================================================================================================================

  const startEditWhenMouseDown = () => {
    if (
      !isInCanvas(contentMouse) ||
      !drawData.creatingObject ||
      drawData.activeObjectIndex < 0
    ) {
      return false;
    }

    const mouse = {
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    };

    switch (drawData.creatingObject.type) {
      case EObjectType.Mask: {
        updateMaskCreatingOrEditingWhenMouseDown();
        return true;
      }
      case EObjectType.Polygon:
      case EObjectType.Rectangle:
      case EObjectType.Skeleton: {
        // Polygon | Rectangle | Skeleton - editing
        const focusObjIndex = judgeFocusOnObject(
          clientSize,
          contentMouse,
          drawData.activeObjectIndex,
          drawData.objectList,
        );

        if (focusObjIndex === drawData.activeObjectIndex) {
          const { focusEleIndex, focusEleType } = judgeFocusOnElement(
            contentMouse,
            drawData.creatingObject,
          );
          const { rect, keypoints, polygon } = drawData.creatingObject;
          setEditState((s) => {
            switch (focusEleType) {
              case EElementType.Rect: {
                if (rect) {
                  const anchorUnderMouse = getAnchorUnderMouseByRect(
                    rect,
                    mouse,
                  );
                  if (anchorUnderMouse) {
                    // resize
                    s.startRectResizeAnchor = {
                      type: anchorUnderMouse.type,
                      position: getAnchorFixRectPoint(
                        rect,
                        anchorUnderMouse.type,
                      ),
                    };
                  } else {
                    // move
                    s.startElementMovePoint = {
                      topLeftPoint: {
                        x: rect.x,
                        y: rect.y,
                      },
                      mousePoint: mouse,
                    };
                  }
                }
                break;
              }
              case EElementType.Circle: {
                // move circle
                if (keypoints) {
                  const point = keypoints.points[focusEleIndex];
                  s.startElementMovePoint = {
                    topLeftPoint: {
                      x: point.x,
                      y: point.y,
                    },
                    mousePoint: mouse,
                  };
                }
                break;
              }
              case EElementType.Polygon: {
                const { lineIndex, index } = s.focusPolygonInfo;
                if (polygon) {
                  // move
                  s.startElementMovePoint = {
                    topLeftPoint: {
                      x: 0,
                      y: 0,
                    },
                    mousePoint: mouse,
                    initPoint: mouse,
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
                      setDrawData((s) => {
                        const activeObject = s.objectList[s.activeObjectIndex];
                        if (activeObject.polygon) {
                          activeObject.polygon.group[index].splice(
                            lineIndex + 1,
                            0,
                            midPoint,
                          );
                        }
                        s.creatingObject = { ...activeObject };
                      });
                    }
                  }
                }
                break;
              }
            }
          });
          return true;
        }
        break;
      }
    }
    return false;
  };

  const updateEditingWhenMouseMove = () => {
    if (drawData.activeObjectIndex < 0) return false;

    const { focusEleIndex, focusEleType, startRectResizeAnchor } = editState;
    if (focusEleType === EElementType.Rect && focusEleIndex === 0) {
      // resize rectangle
      if (startRectResizeAnchor) {
        updateMouseCursor('resize', startRectResizeAnchor.type);
        setDrawData((s) => {
          const activeObject = s.objectList[s.activeObjectIndex];
          if (
            s.activeObjectIndex > -1 &&
            editState.startRectResizeAnchor &&
            activeObject &&
            activeObject.rect
          ) {
            const newRect = resizeRect(
              activeObject.rect,
              editState.startRectResizeAnchor,
              contentMouse,
            );
            activeObject.rect = { ...activeObject.rect, ...newRect };
          }
          s.creatingObject = { ...activeObject };
        });
        return true;
      }
      // move rectangle
      if (editState.startElementMovePoint) {
        updateMouseCursor('move');
        setDrawData((s) => {
          const activeObject = s.objectList[s.activeObjectIndex];
          if (
            s.activeObjectIndex > -1 &&
            editState.startElementMovePoint &&
            activeObject &&
            activeObject.rect
          ) {
            const newRect = moveRect(
              activeObject.rect,
              editState.startElementMovePoint,
              contentMouse,
            );
            activeObject.rect = { ...activeObject.rect, ...newRect };
          }
          s.creatingObject = { ...activeObject };
        });
        return true;
      }
    } else if (focusEleType === EElementType.Circle) {
      // move point
      if (editState.startElementMovePoint) {
        updateMouseCursor('move');
        setDrawData((s) => {
          const activeObject = s.objectList[s.activeObjectIndex];
          if (
            s.activeObjectIndex > -1 &&
            editState.focusEleIndex > -1 &&
            editState.startElementMovePoint &&
            activeObject?.keypoints?.points?.[editState.focusEleIndex]
          ) {
            const point =
              activeObject?.keypoints?.points?.[editState.focusEleIndex];
            const { x: newX, y: newY } = movePoint(contentMouse);
            point.x = newX;
            point.y = newY;
          }
          s.creatingObject = { ...activeObject };
        });
        return true;
      }
    } else if (focusEleType === EElementType.Polygon && focusEleIndex === 0) {
      const { index, pointIndex } = editState.focusPolygonInfo;
      if (editState.startElementMovePoint && index > -1) {
        updateMouseCursor('move');
        if (pointIndex > -1) {
          // move single point
          setDrawData((s) => {
            const activeObject = s.objectList[s.activeObjectIndex];
            if (
              s.activeObjectIndex > -1 &&
              editState.focusEleIndex > -1 &&
              editState.startElementMovePoint &&
              activeObject?.polygon?.group[index]
            ) {
              const polygon = activeObject?.polygon?.group[index];
              polygon[pointIndex] = movePoint(contentMouse);
            }
            s.creatingObject = { ...activeObject };
          });
          return true;
        } else {
          // move polygon
          setDrawData((s) => {
            const activeObject = s.objectList[s.activeObjectIndex];
            if (
              s.activeObjectIndex > -1 &&
              editState.focusEleIndex > -1 &&
              editState.startElementMovePoint &&
              activeObject?.polygon?.group[index]
            ) {
              const polygon = activeObject?.polygon?.group[index];
              const newPolygon = movePolygon(
                polygon,
                editState.startElementMovePoint,
                contentMouse,
              );
              activeObject.polygon.group[index] = newPolygon;
              // console.log(
              //   '>>> move polygon',
              //   editState.startElementMovePoint.mousePoint,
              //   'to', {
              //     x: contentMouse.elementX,
              //     y: contentMouse.elementY,
              //   }
              // );
              setEditState((s) => {
                if (s.startElementMovePoint)
                  s.startElementMovePoint.mousePoint = {
                    x: contentMouse.elementX,
                    y: contentMouse.elementY,
                  };
              });
            }
            s.creatingObject = { ...activeObject };
          });

          return true;
        }
      }
    }
    return false;
  };

  const finishEditingWhenMouseUp = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (!drawData.creatingObject || drawData.activeObjectIndex < 0) {
      return false;
    }
    switch (drawData.creatingObject.type) {
      case EObjectType.Mask: {
        finishMaskCreatingOrEditingWhenMouseUp(event);
        return true;
      }
      case EObjectType.Rectangle:
      case EObjectType.Polygon:
      case EObjectType.Skeleton: {
        const mouse = {
          x: contentMouse.elementX,
          y: contentMouse.elementY,
        };

        const isResizingOrMoving =
          editState.startRectResizeAnchor || editState.startElementMovePoint;

        const isMouseStand =
          editState.startElementMovePoint &&
          editState.startElementMovePoint.initPoint?.x === mouse.x &&
          editState.startElementMovePoint.initPoint?.y === mouse.y;

        const isRemovePolygonPoints =
          !drawData.creatingObject &&
          isMouseStand &&
          editState.focusPolygonInfo.index > -1 &&
          editState.focusPolygonInfo.pointIndex > -1;

        if (
          drawData.AIAnnotation &&
          drawData.selectedTool === EBasicToolItem.Skeleton
        ) {
          if (
            editState.startElementMovePoint &&
            (editState.startElementMovePoint.mousePoint?.x !== mouse.x ||
              editState.startElementMovePoint.mousePoint?.y !== mouse.y)
          ) {
            onAiAnnotation(drawData, aiLabels);
          }
        }

        if (isRemovePolygonPoints) {
          const object = drawData.objectList[editState.focusObjectIndex];
          const copyObject = cloneDeep(object);
          const { index, pointIndex } = editState.focusPolygonInfo;
          const polygon = copyObject.polygon?.group[index];
          if (polygon && index > -1 && pointIndex > -1 && polygon.length >= 3) {
            polygon.splice(pointIndex, 1);
          }
          updateObject(copyObject, editState.focusObjectIndex);
        } else if (isResizingOrMoving) {
          updateAllObject(drawData.objectList);
        }

        setEditState((s) => {
          s.startRectResizeAnchor = undefined;
          s.startElementMovePoint = undefined;
        });
        return true;
      }
    }
    return false;
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
      (drawData.creatingObject.maskCanvasElement ||
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
      s.prompt = undefined;
      s.activeObjectIndex = -1;
    });
  };

  const onFinishCurrCreate = async (label: string) => {
    if (currEditObject?.type === EObjectType.Mask) {
      const maskRle = objectToRle(
        clientSize,
        naturalSize,
        drawData.creatingObject?.tempMaskSteps || [],
        drawData.creatingObject?.maskCanvasElement,
      );
      if (maskRle && maskRle.length > 0) {
        const color = labelColors[label] || '#fff';
        const newObject = {
          type: EObjectType.Mask,
          label,
          hidden: false,
          maskRle,
          maskCanvasElement: rleToCanvas(maskRle, naturalSize, color),
          conf: 1,
        };
        if (drawData.activeObjectIndex > -1) {
          // edit mask object
          updateObject(newObject, drawData.activeObjectIndex);
        } else {
          // add mask object
          addObject(newObject, true);
        }
        setDrawData((s) => {
          s.creatingObject = undefined;
          s.prompt = undefined;
          s.segmentationMask = undefined;
          s.segmentationClicks = undefined;
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

    // 1. Edit object
    if (startEditWhenMouseDown()) return;

    // 2. Create object
    if (updateCreatingWhenMouseDown()) return;

    if (!isDragToolActive) {
      // 3. New object
      startCreateWhenMouseDown();
    } else {
      // 4. Active object
      if (editState.focusObjectIndex > -1) {
        setCurrSelectedObject();
        return;
      }
      // 5. Drag object
      setAllowMove(true);
    }
  };

  const onMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!visible || !canvasRef.current || isRequiring || allowMove) return;

    if (mode !== EditorMode.Edit) return;

    /** 1. Edit object */
    if (updateEditingWhenMouseMove()) return;

    /** 2. Create Object */
    if (updateCreatingWhenMouseMove(event)) return;

    /** 3. Updata focus info */
    updateFocusInfoWhenMouseMove();
    updateMouseWhenMouseMove();
    updateRender();
  };

  const onMouseUp: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!visible || !canvasRef.current || isRequiring) return;

    if (allowMove) {
      setAllowMove(false);
      return;
    }

    /** 1. Edit object */
    if (finishEditingWhenMouseUp(event)) return;

    /** 2. Create Object */
    if (finishCreatingWhenMouseUp(event)) return;
  };

  // =================================================================================================================
  // Effects
  // =================================================================================================================

  const scaleObject = (
    obj: IAnnotationObject,
    preSize: ISize,
    curSize: ISize,
  ) => {
    const newObj = { ...obj };

    if (newObj.rect) {
      const newRect = translateRectZoom(newObj.rect, preSize, curSize);
      newObj.rect = { ...newObj.rect, ...newRect };
    }
    if (newObj.keypoints) {
      const { points, lines } = newObj.keypoints;
      const newPoints = points.map((point) => {
        const newPoint = translatePointZoom(point, preSize, curSize);
        return { ...point, ...newPoint };
      });
      newObj.keypoints = { points: newPoints, lines };
    }
    if (newObj.polygon) {
      const newGroups = newObj.polygon.group.map((polygon) => {
        return polygon.map((point) => {
          return translatePointZoom(point, preSize, curSize);
        });
      });
      newObj.polygon = { ...newObj.polygon, group: newGroups };
    }
    return newObj;
  };

  /**
   * Scale draw data
   * @param preSize
   * @param curSize
   */
  const scaleDrawData = (
    theDrawData: DrawData,
    preSize: ISize,
    curSize: ISize,
  ) => {
    const updateDrawData = { ...theDrawData };
    updateDrawData.objectList = updateDrawData.objectList.map((obj) => {
      return scaleObject(obj, preSize, curSize);
    });

    if (updateDrawData.creatingObject) {
      updateDrawData.creatingObject = scaleObject(
        updateDrawData.creatingObject,
        preSize,
        curSize,
      );
      if (updateDrawData.creatingObject.maskStep) {
        const newPoints = updateDrawData.creatingObject.maskStep.points.map(
          (point) => {
            return translatePointZoom(point, preSize, curSize);
          },
        );
        updateDrawData.creatingObject = {
          ...updateDrawData.creatingObject,
          maskStep: {
            ...updateDrawData.creatingObject.maskStep,
            points: newPoints,
          },
        };
      }
      if (updateDrawData.creatingObject.tempMaskSteps) {
        const newSteps = updateDrawData.creatingObject.tempMaskSteps.map(
          (step) => {
            return {
              ...step,
              points: step.points.map((point) =>
                translatePointZoom(point, preSize, curSize),
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

    if (updateDrawData.segmentationClicks) {
      updateDrawData.segmentationClicks = updateDrawData.segmentationClicks.map(
        (click) => {
          if (click.point) {
            const newPoint = translatePointZoom(click.point, preSize, curSize);
            return {
              ...click,
              point: newPoint,
            };
          }
          return click;
        },
      );
    }

    if (updateDrawData.prompt) {
      updateDrawData.prompt = updateDrawData.prompt.map((item) => {
        if (item.type === EMaskPromptType.Point && item.point) {
          return {
            ...item,
            point: translatePointZoom(item.point, preSize, curSize),
          };
        }
        return item;
      });
    }

    setDrawData(updateDrawData);
    updateRender(updateDrawData);
  };

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
    } else if (preClientSize) {
      // scale change
      scaleDrawData(drawData, preClientSize, clientSize);
      clearPreClientSize();
    }
  };

  /** Update canvas while data changing */
  useEffect(() => {
    updateRender();
  }, [drawData, editState]);

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
    setDrawData({
      ...cloneDeep(DEFAULT_DRAW_DATA),
      brushSize: drawData.brushSize,
      selectedTool: drawData.selectedTool,
    });
    setEditState(cloneDeep(DEFAULT_EDIT_STATE));
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
      rebuildDrawData(true);
    }
  }, [annotations]);

  const onRedo = () => {
    const record = redo();
    if (record) {
      scaleDrawData(record.drawData, record.clientSize, clientSize);
    }
  };

  const onUndo = () => {
    const record = undo();
    if (record) {
      scaleDrawData(record.drawData, record.clientSize, clientSize);
    }
  };

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
    if (mode !== EditorMode.Edit || tool === drawData.selectedTool) return;
    setDrawData((s) => {
      s.selectedTool = tool;
      if (tool === EBasicToolItem.Mask) {
        s.selectedSubTool = s.AIAnnotation
          ? ESubToolItem.AutoSegmentByBox
          : ESubToolItem.PenAdd;
      }
      s.activeObjectIndex = -1;
      s.creatingObject = undefined;
    });
  };

  const selectSubTool = (tool: ESubToolItem) => {
    if (mode !== EditorMode.Edit) return;
    setDrawData((s) => {
      s.selectedSubTool = tool;
    });
  };

  const setBrushSize = (size: number) => {
    if (mode !== EditorMode.Edit) return;
    setDrawData((s) => {
      s.brushSize = size;
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
              s.creatingObject?.maskStep?.points?.length &&
              s.creatingObject?.tempMaskSteps?.length
            ) {
              // Creating single Mask
              s.creatingObject.maskStep = undefined;
            } else {
              s.creatingObject = undefined;
              s.activeObjectIndex = -1;
            }
            if (s.AIAnnotation) {
              s.segmentationClicks = undefined;
              s.segmentationMask = undefined;
              s.activeRectWhileLoading = undefined;
              s.prompt = undefined;
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
            {mode === EditorMode.Edit &&
              !(
                drawData.selectedTool === EBasicToolItem.Skeleton &&
                drawData.AIAnnotation
              ) && (
                <AnnotationEditor
                  hideTitle={currEditObject?.type === EObjectType.Mask}
                  allowAddCategory={isSeperate}
                  latestLabel={editState.latestLabel}
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
                  s.prompt = undefined;
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
                  s.prompt = undefined;
                });
              }}
              onCancelCurrCreate={() => {
                setDrawData((s) => {
                  s.creatingObject = undefined;
                  s.activeObjectIndex = -1;
                  s.segmentationClicks = undefined;
                  s.segmentationMask = undefined;
                  s.prompt = undefined;
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
            objects={drawData.objectList}
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
              setCurrSelectedObject(index);
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
