import { MouseEventHandler, useState } from 'react';
import { CursorState } from 'ahooks/lib/useMouse';
import {
  DrawData,
  EMaskPromptType,
  EditState,
  EditorMode,
  IAnnotationObject,
  PromptItem,
} from '../type';
import {
  Direction,
  getAnchorFixRectPoint,
  getAnchorUnderMouseByRect,
  getFocusPartInPolygonGroup,
  getKeypointsFromRect,
  getLinesFromPolygon,
  getMidPointFromTwoPoints,
  getRectFromPoints,
  getReferencePointsFromRect,
  isInCanvas,
  isPointOnPoint,
  judgeFocusOnElement,
  judgeFocusOnObject,
  movePoint,
  movePolygon,
  moveRect,
  resizeRect,
  translatePointsToPointObjs,
} from '@/utils/compute';
import {
  BODY_TEMPLATE,
  EBasicToolItem,
  EElementType,
  EObjectType,
  ESubToolItem,
} from '@/constants';
import { cloneDeep } from 'lodash';
import { Updater } from 'use-immer';
import { HistoryItem } from './useHistory';
import { DATA } from '@/services/type';

interface IProps {
  visible: boolean;
  mode: EditorMode;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  clientSize: ISize;
  naturalSize: ISize;
  contentMouse: CursorState;
  isDragToolActive: boolean;
  isAIPoseEstimation: boolean;
  updateHistory: (item: HistoryItem) => void;
  categories: DATA.Category[];
  aiLabels: string[];
  onAiAnnotation: (
    drawData: DrawData,
    aiLabels: string[],
    bbox?: IBoundingBox,
  ) => Promise<void>;
  updateRender: (updateDrawData?: DrawData) => void;
  addObject: (object: IAnnotationObject, notActive?: boolean) => void;
  updateObject: (object: IAnnotationObject, index: number) => void;
  updateMouseCursor: (value: string, position?: Direction) => void;
  updateMouseCursorWhenMouseMove: () => void;
  setCurrSelectedObject: (index?: number) => void;
}

const useMouseEvents = ({
  visible,
  mode,
  drawData,
  setDrawData,
  setDrawDataWithHistory,
  editState,
  setEditState,
  clientSize,
  naturalSize,
  contentMouse,
  isDragToolActive,
  isAIPoseEstimation,
  updateHistory,
  categories,
  aiLabels,
  onAiAnnotation,
  updateRender,
  addObject,
  updateObject,
  updateMouseCursor,
  updateMouseCursorWhenMouseMove,
  setCurrSelectedObject,
}: IProps) => {
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
    } else if (isDragToolActive || isAIPoseEstimation) {
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

  const getPromptBoolean = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): boolean => {
    // Right Mouse Click / Lift Mouse Click + (Alt/Option) -> false
    if (event.button === 2 || (event.button === 0 && event.altKey))
      return false;
    return true;
  };

  const startCreateWhenMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
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
                isPositive: getPromptBoolean(event),
              };
              break;
            case ESubToolItem.AutoSegmentByStroke:
              s.creatingPrompt = {
                type: EMaskPromptType.Stroke,
                startPoint: point,
                stroke: [point],
                radius: s.brushSize,
                isPositive: getPromptBoolean(event),
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

  const updateMaskCreatingOrEditingWhenMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
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
            isPositive: getPromptBoolean(event),
          };
          break;
        case ESubToolItem.AutoSegmentByStroke:
          s.creatingPrompt = {
            type: EMaskPromptType.Stroke,
            startPoint: mouse,
            stroke: [mouse],
            radius: s.brushSize,
            isPositive: getPromptBoolean(event),
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

  const finishMaskCreatingOrEditingWhenMouseUp = async () => {
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
          s.activeRectWhileLoading = rect;
        });
        onAiAnnotation({ ...drawData, prompt }, []);
        break;
      }
      case ESubToolItem.AutoSegmentByClick: {
        if (!isInCanvas(contentMouse) || !drawData.creatingPrompt?.point) break;
        const promptItem: PromptItem = {
          type: EMaskPromptType.Point,
          isPositive: drawData.creatingPrompt.isPositive,
          point: drawData.creatingPrompt.point,
        };
        const prompt = drawData.prompt
          ? [...drawData.prompt, promptItem]
          : [promptItem];
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
        onAiAnnotation({ ...drawData, prompt }, []);
        break;
      }
      case ESubToolItem.AutoEdgeStitching: {
        if (!drawData.creatingPrompt?.stroke) break;
        onAiAnnotation({ ...drawData }, []);
        break;
      }
    }
  };

  const updateCreatingWhenMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
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
        updateMaskCreatingOrEditingWhenMouseDown(event);
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

      // Left/Right button is pressed while mousemove
      const isMousePress = event.buttons === 1 || event.buttons === 2;

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
              isPositive: getPromptBoolean(event),
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
        finishMaskCreatingOrEditingWhenMouseUp();
        return true;
      }
    }
  };

  // =================================================================================================================
  // Logics For Editing Exsiting Annotations
  // =================================================================================================================

  const startEditWhenMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
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
        updateMaskCreatingOrEditingWhenMouseDown(event);
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
    if (!drawData.creatingObject || drawData.activeObjectIndex < 0)
      return false;

    const { focusEleIndex, focusEleType, startRectResizeAnchor } = editState;
    if (focusEleType === EElementType.Rect && focusEleIndex === 0) {
      // resize rectangle
      if (startRectResizeAnchor) {
        updateMouseCursor('resize', startRectResizeAnchor.type);
        setDrawData((s) => {
          if (
            s.activeObjectIndex > -1 &&
            editState.startRectResizeAnchor &&
            s.creatingObject &&
            s.creatingObject.rect
          ) {
            const newRect = resizeRect(
              s.creatingObject.rect,
              editState.startRectResizeAnchor,
              contentMouse,
            );
            s.creatingObject.rect = { ...s.creatingObject.rect, ...newRect };
          }
        });
        return true;
      }
      // move rectangle
      if (editState.startElementMovePoint) {
        updateMouseCursor('move');
        setDrawData((s) => {
          if (
            s.activeObjectIndex > -1 &&
            editState.startElementMovePoint &&
            s.creatingObject &&
            s.creatingObject.rect
          ) {
            const newRect = moveRect(
              s.creatingObject.rect,
              editState.startElementMovePoint,
              contentMouse,
            );
            s.creatingObject.rect = { ...s.creatingObject.rect, ...newRect };
          }
        });
        return true;
      }
    } else if (focusEleType === EElementType.Circle) {
      // move point
      if (editState.startElementMovePoint) {
        updateMouseCursor('move');
        setDrawData((s) => {
          if (
            s.activeObjectIndex > -1 &&
            editState.focusEleIndex > -1 &&
            editState.startElementMovePoint &&
            s.creatingObject?.keypoints?.points?.[editState.focusEleIndex]
          ) {
            const point =
              s.creatingObject?.keypoints?.points?.[editState.focusEleIndex];
            const { x: newX, y: newY } = movePoint(contentMouse);
            point.x = newX;
            point.y = newY;
          }
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
            if (
              s.activeObjectIndex > -1 &&
              editState.focusEleIndex > -1 &&
              editState.startElementMovePoint &&
              s.creatingObject?.polygon?.group[index]
            ) {
              const polygon = s.creatingObject?.polygon?.group[index];
              polygon[pointIndex] = movePoint(contentMouse);
            }
          });
          return true;
        } else {
          // move polygon
          setDrawData((s) => {
            if (
              s.activeObjectIndex > -1 &&
              editState.focusEleIndex > -1 &&
              editState.startElementMovePoint &&
              s.creatingObject?.polygon?.group[index]
            ) {
              const polygon = s.creatingObject?.polygon?.group[index];
              const newPolygon = movePolygon(
                polygon,
                editState.startElementMovePoint,
                contentMouse,
              );
              s.creatingObject.polygon.group[index] = newPolygon;
              // TODO: fix move offset
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
          });
          return true;
        }
      }
    }
    return false;
  };

  const finishEditingWhenMouseUp = () => {
    if (!drawData.creatingObject || drawData.activeObjectIndex < 0) {
      return false;
    }
    switch (drawData.creatingObject.type) {
      case EObjectType.Mask: {
        finishMaskCreatingOrEditingWhenMouseUp();
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
          isMouseStand &&
          editState.focusPolygonInfo.index > -1 &&
          editState.focusPolygonInfo.pointIndex > -1;

        if (isRemovePolygonPoints) {
          const copyObject = cloneDeep(drawData.creatingObject);
          const { index, pointIndex } = editState.focusPolygonInfo;
          const polygon = copyObject.polygon?.group[index];
          if (polygon && index > -1 && pointIndex > -1 && polygon.length >= 3) {
            polygon.splice(pointIndex, 1);
          }
          updateObject(copyObject, drawData.activeObjectIndex);
        } else if (isResizingOrMoving) {
          updateObject(drawData.creatingObject, drawData.activeObjectIndex);
        }

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

        setEditState((s) => {
          s.startRectResizeAnchor = undefined;
          s.startElementMovePoint = undefined;
        });
        return true;
      }
    }
    return false;
  };

  const [isMousePress, setMousePress] = useState(false);

  // =================================================================================================================
  // Register Mouse Event
  // =================================================================================================================

  const onMouseDown: MouseEventHandler<HTMLDivElement> = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    setMousePress(true);

    if (!visible || editState.allowMove || editState.isRequiring) return;

    // 1. Edit object
    if (startEditWhenMouseDown(event)) return;

    // 2. Create object
    if (updateCreatingWhenMouseDown(event)) return;

    if (isDragToolActive || isAIPoseEstimation) {
      if (editState.focusObjectIndex > -1) {
        // 3. Active object
        setCurrSelectedObject();
      } else {
        // 4. Drag object
        setEditState((s) => {
          s.allowMove = true;
        });
      }
    } else {
      // 5. New object
      startCreateWhenMouseDown(event);
    }
  };

  const onMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!visible || editState.isRequiring || editState.allowMove) return;

    if (mode !== EditorMode.Edit) return;

    /** 1. Edit object */
    if (updateEditingWhenMouseMove()) return;

    /** 2. Create Object */
    if (updateCreatingWhenMouseMove(event)) return;

    /** 3. Updata focus info */
    updateFocusInfoWhenMouseMove();
    updateMouseCursorWhenMouseMove();
    updateRender();
  };

  const onMouseUp: MouseEventHandler<HTMLDivElement> = (event) => {
    setMousePress(false);

    if (!visible || editState.isRequiring) return;

    if (editState.allowMove) {
      setEditState((s) => {
        s.allowMove = false;
      });
      return;
    }

    /** 1. Edit object */
    if (finishEditingWhenMouseUp()) return;

    /** 2. Create Object */
    if (finishCreatingWhenMouseUp(event)) return;
  };

  return {
    getPromptBoolean,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    isMousePress,
  };
};

export default useMouseEvents;
