import { useModel } from '@umijs/max';
import { message } from 'antd';
import { useLocale } from 'dds-utils/locale';
import { useCallback } from 'react';
import { Updater } from 'use-immer';

import {
  BODY_TEMPLATE,
  EBasicToolTypeMap,
  EnumModelType,
  EObjectType,
  ESubToolItem,
} from '../constants';
import { NsApiAnnotator, fetchModelResults } from '../sevices';
import { rleToCanvas } from '../tools/useMask';
import {
  DrawData,
  AnnoItem,
  EditState,
  IAnnotationObject,
  PromptItem,
  EObjectStatus,
  EPromptType,
  ReqPromptItem,
  IMask,
} from '../type';
import { getServerAddressableUrl } from '../utils/base64';
import {
  translateRectToAbsBbox,
  getCanvasPoint,
  getNaturalPoint,
  translateRectZoom,
  translateAbsBBoxToRect,
  translatePointsToRect,
  translateRectToPointsArray,
  newTranslatePointsToPointObjs,
  newTranslatePointObjsToPointAttrs,
} from '../utils/compute';

interface IProps {
  currImageItem?: AnnoItem;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  naturalSize: ISize;
  clientSize: ISize;
  getAnnotColor: (category: string, forceColorByCategory?: boolean) => string;
}

export type OnAiAnnotationFunc = ({
  type,
  drawData,
  text,
  bbox,
  promptsQueue,
  segmentationClicks,
  segmentEverythingParams,
}: {
  type?: EObjectType;
  drawData?: DrawData;
  text?: string;
  bbox?: IBoundingBox;
  promptsQueue?: PromptItem[];
  segmentationClicks?: {
    point: IPoint;
    isPositive: boolean;
  }[];
  segmentEverythingParams?: NsApiAnnotator.FetchSegmentEverythingReq;
}) => Promise<void>;

const useAiModels = ({
  currImageItem,
  drawData: editorDrawData,
  setDrawData,
  setDrawDataWithHistory,
  editState,
  setEditState,
  naturalSize,
  clientSize,
  getAnnotColor,
}: IProps) => {
  const { localeText } = useLocale();
  const { setLoading } = useModel('global');

  const fetchCommonReqParams = async <T extends object>(
    drawData: DrawData,
    reqParams: T,
  ): Promise<T> => {
    if (drawData.prompt.sessionId) {
      Object.assign(reqParams, { sessionId: drawData.prompt.sessionId });
    } else if (currImageItem) {
      Object.assign(reqParams, {
        image: await getServerAddressableUrl(currImageItem.url),
      });
    }
    return reqParams;
  };

  const convertPromptFormat = (prompt: PromptItem[]): ReqPromptItem[] => {
    const newPromptArr = prompt.map((item) => {
      const { type, isPositive, point, rect, stroke, radius, polygons } = item;

      const newItem = { type, isPositive };

      if (rect) {
        const { xmax, xmin, ymax, ymin } = translateRectToAbsBbox(rect);
        const topleftPoint = getNaturalPoint(
          [xmin, ymin],
          naturalSize,
          clientSize,
        );
        const bottomRightPoint = getNaturalPoint(
          [xmax, ymax],
          naturalSize,
          clientSize,
        );
        Object.assign(newItem, {
          rect: [
            topleftPoint.x,
            topleftPoint.y,
            bottomRightPoint.x,
            bottomRightPoint.y,
          ],
        });
      }

      if (point) {
        const naturalPoint = getNaturalPoint(
          [point.x, point.y],
          naturalSize,
          clientSize,
        );
        Object.assign(newItem, {
          point: [naturalPoint.x, naturalPoint.y],
        });
      }

      if (stroke) {
        const points = stroke.reduce((acc: number[], point: IPoint) => {
          const { x, y } = point;
          const naturalPoint = getNaturalPoint([x, y], naturalSize, clientSize);
          return acc.concat([naturalPoint.x, naturalPoint.y]);
        }, []);
        Object.assign(newItem, {
          stroke: points,
          radius,
        });
      }

      if (polygons) {
        const transformedPolygons = polygons.map((polygon) => {
          const res = [];
          for (let i = 0; i < polygon.length; i += 2) {
            const transformedPoint = getNaturalPoint(
              [polygon[i], polygon[i + 1]],
              naturalSize,
              clientSize,
            );
            res.push(transformedPoint.x, transformedPoint.y);
          }
          return res;
        });
        Object.assign(newItem, {
          polygons: transformedPolygons,
        });
      }

      return newItem;
    });

    return newPromptArr;
  };

  const requestAiDetection = async (drawData: DrawData, text: string) => {
    if (!text) {
      message.warning(localeText('DDSAnnotator.smart.msg.labelRequired'));
      return;
    }

    const reqParams = await fetchCommonReqParams(drawData, {
      prompts: [
        {
          type: EPromptType.Text,
          text,
        },
      ],
    });

    const { result, sessionId } =
      await fetchModelResults<EnumModelType.Detection>(
        EnumModelType.Detection,
        reqParams,
      );

    if (result) {
      const { objects, suggestThreshold } = result;
      const limitConf = suggestThreshold || 0;
      const maxScore = objects.reduce(
        (max, item) => (item.score > max ? item.score : max),
        objects[0]?.score || 0,
      );
      const newObjects: IAnnotationObject[] = objects
        .map((item) => {
          // mouse.elementW is not necessarily identical to the size during initialization transformation
          const rect = {
            ...translatePointsToRect(item.bbox, naturalSize, clientSize),
          };
          const conf = item.score / maxScore;
          return {
            rect: { ...rect, visible: true },
            labelId: editState.latestLabelId,
            type: EObjectType.Rectangle,
            hidden: false,
            status:
              conf >= limitConf
                ? EObjectStatus.Checked
                : EObjectStatus.Unchecked,
            conf,
            color: getAnnotColor(editState.latestLabelId, true),
          };
        })
        .reverse();
      setDrawDataWithHistory((s) => {
        s.isBatchEditing = true;
        s.limitConf = limitConf;
        const commitedObjects = s.objectList.filter(
          (obj) => obj?.status === EObjectStatus.Commited,
        );
        s.objectList = [...commitedObjects, ...newObjects];
        if (s.creatingObject && s.objectList[s.activeObjectIndex]) {
          s.creatingObject = { ...s.objectList[s.activeObjectIndex] };
        }
        s.prompt.sessionId = sessionId;
      });
      return true;
    }
  };

  const requestIvpDetection = async (
    drawData: DrawData,
    promptsQueue?: PromptItem[],
  ) => {
    if (!currImageItem || !promptsQueue) return;

    const reqParams = {
      prompts: convertPromptFormat(promptsQueue || []),
      labelTypes: ['bbox'],
    };
    if (drawData.prompt.sessionId) {
      Object.assign(reqParams, { sessionId: drawData.prompt.sessionId });
    } else {
      const url = await getServerAddressableUrl(currImageItem.url);
      Object.assign(reqParams, {
        promptImage: url,
        inferImage: url,
      });
    }

    const { result, sessionId } = await fetchModelResults<EnumModelType.IVP>(
      EnumModelType.IVP,
      reqParams,
    );

    if (result) {
      const { objects } = result;
      const limitConf = 0.3;
      const newObjects: IAnnotationObject[] = objects
        .filter((item) => {
          return item.bbox;
        })
        .map((item) => {
          const [xmin, ymin, xmax, ymax] = item.bbox!;
          const rect = translateRectZoom(
            translateAbsBBoxToRect({ xmin, ymin, xmax, ymax }),
            naturalSize,
            clientSize,
          );
          return {
            rect: { ...rect, visible: true },
            labelId: editState.latestLabelId,
            type: EObjectType.Rectangle,
            hidden: false,
            status:
              item.score >= limitConf
                ? EObjectStatus.Checked
                : EObjectStatus.Unchecked,
            conf: item.score,
            color: getAnnotColor(editState.latestLabelId, true),
          };
        })
        .reverse();

      setDrawDataWithHistory((s) => {
        s.isBatchEditing = true;
        s.limitConf = limitConf;
        const commitedObjects = s.objectList.filter(
          (obj) => obj.status === EObjectStatus.Commited,
        );
        s.objectList = [...commitedObjects, ...newObjects];
        if (s.creatingObject && s.objectList[s.activeObjectIndex]) {
          s.creatingObject = { ...s.objectList[s.activeObjectIndex] };
        }
        s.prompt.promptsQueue = promptsQueue;
        s.prompt.sessionId = sessionId;
        s.prompt.creatingPrompt = undefined;
      });
      return true;
    }
  };

  const requestIvpMask = async (
    drawData: DrawData,
    promptsQueue?: PromptItem[],
  ) => {
    if (!currImageItem || !promptsQueue) return;

    const reqParams = {
      prompts: convertPromptFormat(promptsQueue || []),
      labelTypes: ['mask'],
    };
    if (drawData.prompt.sessionId) {
      Object.assign(reqParams, { sessionId: drawData.prompt.sessionId });
    } else {
      const url = await getServerAddressableUrl(currImageItem.url);
      Object.assign(reqParams, {
        promptImage: url,
        inferImage: url,
      });
    }

    const { result, sessionId } = await fetchModelResults<EnumModelType.IVP>(
      EnumModelType.IVP,
      reqParams,
    );

    if (result) {
      // Display mask in different color
      setEditState((s) => {
        s.annotsDisplayOptions.colorByCategory = false;
      });

      const { objects } = result;
      const newObjects: IAnnotationObject[] = objects
        .filter((item) => !!item.mask)
        .map((item) => {
          const color = getAnnotColor(editState.latestLabelId);
          const maskRleStr = item.mask?.counts || '';
          return {
            type: EObjectType.Mask,
            hidden: false,
            labelId: editState.latestLabelId,
            maskRle: maskRleStr,
            maskCanvasElement: rleToCanvas(maskRleStr, naturalSize, color),
            status: EObjectStatus.Checked,
            conf: item.score,
            color: getAnnotColor(editState.latestLabelId, true),
          };
        });

      setDrawDataWithHistory((s) => {
        s.isBatchEditing = true;
        const commitedObjects = s.objectList.filter(
          (obj) => obj.status === EObjectStatus.Commited,
        );
        s.objectList = [...commitedObjects, ...newObjects];
        if (s.creatingObject && s.objectList[s.activeObjectIndex]) {
          s.creatingObject = { ...s.objectList[s.activeObjectIndex] };
        }
        s.prompt.promptsQueue = promptsQueue;
        s.prompt.sessionId = sessionId;
        s.prompt.creatingPrompt = undefined;
      });
      return true;
    }
  };

  const requestAiSegmentByPolygon = async (
    drawData: DrawData,
    promptsQueue?: PromptItem[],
  ) => {
    if (!promptsQueue) return;

    const reqParams = await fetchCommonReqParams(drawData, {
      density: drawData.pointResolution,
      prompts: convertPromptFormat(promptsQueue || []),
    });

    const { result, sessionId } =
      await fetchModelResults<EnumModelType.SegmentByPolygon>(
        EnumModelType.SegmentByPolygon,
        reqParams,
      );
    if (result) {
      const { polygons } = result;

      if (polygons && polygons.length > 0) {
        const predictPolygons = polygons
          .filter((item) => {
            return item.length >= 6;
          })
          .map((item) => {
            const result: IPolygon = [];
            for (let i = 0; i < item.length; i += 2) {
              const x = item[i];
              const y = item[i + 1];
              const canvasPoint = getCanvasPoint(
                [x, y],
                naturalSize,
                clientSize,
              );
              result.push(canvasPoint);
            }
            return result;
          });

        const creatingObj = {
          type: EObjectType.Polygon,
          hidden: false,
          labelId: editState.latestLabelId,
          color:
            drawData.creatingObject?.color ||
            getAnnotColor(editState.latestLabelId),
          currIndex: -1,
          polygon: {
            visible: true,
            group: predictPolygons,
          },
          status: EObjectStatus.Checked,
        };

        setDrawDataWithHistory((s) => {
          s.creatingObject = creatingObj;
          s.prompt.promptsQueue = promptsQueue;
          s.prompt.sessionId = sessionId;
          s.prompt.creatingPrompt = undefined;
        });
        return true;
      }
    }
  };

  const requestAiSegmentByMask = async (
    drawData: DrawData,
    promptsQueue?: PromptItem[],
  ) => {
    if (!promptsQueue) return;

    const reqParams = await fetchCommonReqParams(drawData, {
      prompts: convertPromptFormat(promptsQueue || []),
    });

    const { result, sessionId } =
      await fetchModelResults<EnumModelType.SegmentByMask>(
        EnumModelType.SegmentByMask,
        reqParams,
      );
    if (result) {
      const { mask } = result;
      const color =
        drawData.creatingObject?.color ||
        getAnnotColor(editState.latestLabelId);
      const maskRleStr = mask.counts || '';
      const creatingObj = {
        type: EObjectType.Mask,
        hidden: false,
        labelId: editState.latestLabelId,
        currIndex: -1,
        maskCanvasElement: rleToCanvas(maskRleStr, naturalSize, color),
        maskRle: maskRleStr,
        status: EObjectStatus.Checked,
        color,
      };
      setDrawDataWithHistory((s) => {
        s.creatingObject = creatingObj;
        s.prompt.promptsQueue = promptsQueue;
        s.prompt.sessionId = sessionId;
        s.prompt.creatingPrompt = undefined;
      });
      return true;
    }
  };

  const requestAiPoseEstimation = async (drawData: DrawData) => {
    // TODO: Integrate custom templates
    const { lines, pointNames, pointColors } = BODY_TEMPLATE;
    const reqParams = await fetchCommonReqParams(drawData, {});
    if (drawData.isBatchEditing) {
      const objectList = [...drawData.objectList];
      if (
        drawData.activeObjectIndex > -1 &&
        objectList[drawData.activeObjectIndex] &&
        drawData.creatingObject
      ) {
        // update creating object
        objectList[drawData.activeObjectIndex] = {
          ...objectList[drawData.activeObjectIndex],
          ...drawData.creatingObject,
        };
      }
      const skeletonObjs = objectList.filter(
        (obj) =>
          obj.type === EObjectType.Skeleton &&
          obj.status === EObjectStatus.Checked,
      );
      if (skeletonObjs.length > 0) {
        const objects = skeletonObjs.map((item) => {
          return {
            keypoints: item.keypoints
              ? newTranslatePointObjsToPointAttrs(
                  item.keypoints.points,
                  naturalSize,
                  clientSize,
                ).points
              : undefined,
            bbox: item.rect
              ? translateRectToPointsArray(item.rect, clientSize, naturalSize)
              : undefined,
          };
        });
        Object.assign(reqParams, { objects });
      }
    }

    const { result, sessionId } = await fetchModelResults<EnumModelType.Pose>(
      EnumModelType.Pose,
      reqParams,
    );

    if (result) {
      const { objects } = result;
      if (objects && objects.length > 0) {
        const skeletonObjs = objects.map((obj) => {
          let { bbox, keypoints, score } = obj;
          const newObj: IAnnotationObject = {
            labelId: editState.latestLabelId,
            color: getAnnotColor(editState.latestLabelId),
            type: EObjectType.Skeleton,
            hidden: false,
            conf: score,
            status: EObjectStatus.Checked,
          };
          if (bbox) {
            const rect = translatePointsToRect(bbox, naturalSize, clientSize);
            Object.assign(newObj, { rect: { visible: true, ...rect } });
          }
          if (keypoints && lines && pointColors && pointNames) {
            const pointObjs = newTranslatePointsToPointObjs(
              keypoints,
              pointNames,
              pointColors,
              naturalSize,
              clientSize,
            );
            Object.assign(newObj, {
              keypoints: {
                points: pointObjs,
                lines,
              },
            });
          }
          return newObj;
        });

        setDrawDataWithHistory((s) => {
          if (!s.isBatchEditing) {
            s.isBatchEditing = true;
          }
          const commitedObjects = s.objectList.filter(
            (obj) => obj.status === EObjectStatus.Commited,
          );
          s.objectList = [...commitedObjects, ...skeletonObjs];
          if (s.creatingObject && s.objectList[s.activeObjectIndex]) {
            s.creatingObject = { ...s.objectList[s.activeObjectIndex] };
          }
          s.prompt.sessionId = sessionId;
        });
        return true;
      }
    }
  };

  const requestEdgeStitchingForMask = async (drawData: DrawData) => {
    if (
      !drawData.prompt.creatingPrompt?.stroke ||
      !drawData.prompt.creatingPrompt?.radius
    )
      return;

    const { stroke, radius } = drawData.prompt.creatingPrompt;

    const maskObjects = drawData.objectList.filter(
      (item) => item.type === EObjectType.Mask,
    );

    if (maskObjects.length < 2) {
      message.error(localeText('DDSAnnotator.smart.tip.edgeStitchError'));
      setDrawData((s) => {
        s.prompt.creatingPrompt = undefined;
      });
      return;
    }

    const masks: IMask[] = maskObjects.map((item) => ({
      counts: item.maskRle || '',
      size: [naturalSize.height, naturalSize.width],
    }));

    const points = stroke.reduce((acc: number[], point: IPoint) => {
      const { x, y } = point;
      const naturalPoint = getNaturalPoint([x, y], naturalSize, clientSize);
      return acc.concat([naturalPoint.x, naturalPoint.y]);
    }, []);

    const reqParams = await fetchCommonReqParams(drawData, {
      masks,
      prompts: [
        {
          type: EPromptType.Stroke,
          stroke: points,
          radius,
        },
      ],
    });

    const { result, sessionId } =
      await fetchModelResults<EnumModelType.MaskEdgeStitching>(
        EnumModelType.MaskEdgeStitching,
        reqParams,
      );
    if (result && result.masks?.length > 0) {
      const newMaskObjects = maskObjects.map((item, index) => {
        const maskRleStr = result.masks?.[index]?.counts || '';
        return {
          ...item,
          maskRle: maskRleStr,
          maskCanvasElement: rleToCanvas(maskRleStr, naturalSize, item.color),
        };
      });

      // Replace all instances of the mask type
      const leftObjs = drawData.objectList.filter(
        (obj) => obj.type !== EObjectType.Mask,
      );

      setDrawDataWithHistory((s) => {
        s.objectList = [...leftObjs, ...newMaskObjects];
        s.prompt.creatingPrompt = undefined;
        s.prompt.sessionId = sessionId;
      });
      return true;
    }
  };

  const requestSegmentEverything = async (
    params?: NsApiAnnotator.FetchSegmentEverythingReq,
  ) => {
    if (!currImageItem) return;

    const reqParams = {
      image: await getServerAddressableUrl(currImageItem.url),
      ...params,
    };

    const { result } = await fetchModelResults<EnumModelType.SegmentEverything>(
      EnumModelType.SegmentEverything,
      reqParams,
    );
    if (result && result.masks?.length > 0) {
      // change to display different color
      setEditState((s) => {
        s.annotsDisplayOptions.colorByCategory = false;
      });
      const maskObjects: IAnnotationObject[] = result.masks.map((item) => {
        const color = getAnnotColor(editState.latestLabelId);
        const maskRleStr = item?.counts || '';
        return {
          type: EObjectType.Mask,
          hidden: false,
          labelId: editState.latestLabelId,
          maskRle: maskRleStr,
          maskCanvasElement: rleToCanvas(maskRleStr, naturalSize, color),
          conf: 1,
          status: EObjectStatus.Checked,
          color,
        };
      });
      setDrawDataWithHistory((s) => {
        s.objectList = maskObjects;
        s.isBatchEditing = true;
      });
      return true;
    }
  };

  const onAiAnnotation: OnAiAnnotationFunc = useCallback(
    async ({
      type,
      drawData: propsDrawData,
      text,
      promptsQueue,
      segmentEverythingParams,
    }) => {
      if (editState.isRequiring || !currImageItem) return;

      const drawData = propsDrawData || editorDrawData;

      const hide = message.loading(
        localeText('DDSAnnotator.smart.msg.loading'),
        100000,
      );
      try {
        setLoading(true);
        setEditState((s) => {
          s.isRequiring = true;
        });
        const aiType = type || EBasicToolTypeMap[drawData.selectedTool];
        let isSuccess;
        switch (aiType) {
          case EObjectType.Rectangle: {
            if (
              drawData.selectedModel[drawData.selectedTool] ===
              EnumModelType.Detection
            ) {
              isSuccess = await requestAiDetection(drawData, text || '');
            } else {
              isSuccess = await requestIvpDetection(drawData, promptsQueue);
            }
            break;
          }
          case EObjectType.Skeleton: {
            isSuccess = await requestAiPoseEstimation(drawData);
            break;
          }
          case EObjectType.Polygon: {
            isSuccess = await requestAiSegmentByPolygon(drawData, promptsQueue);
            break;
          }
          case EObjectType.Mask: {
            const model = drawData.selectedModel[drawData.selectedTool];
            if (model === EnumModelType.SegmentEverything) {
              if (drawData.selectedSubTool === ESubToolItem.AutoEdgeStitching) {
                isSuccess = await requestEdgeStitchingForMask(drawData);
              } else if (
                drawData.selectedSubTool === ESubToolItem.AutoSegmentEverything
              ) {
                isSuccess = await requestSegmentEverything(
                  segmentEverythingParams,
                );
              }
            } else if (model === EnumModelType.IVP) {
              isSuccess = await requestIvpMask(drawData, promptsQueue);
            } else {
              isSuccess = await requestAiSegmentByMask(drawData, promptsQueue);
            }
            break;
          }
          default:
            message.warning('Plan to Support!');
            break;
        }
        if (isSuccess) {
          message.success(localeText('DDSAnnotator.smart.msg.success'));
        }
      } catch (error) {
        setDrawDataWithHistory((s) => {
          if (s.prompt.creatingPrompt) {
            s.prompt.creatingPrompt = undefined;
          }
        });
        message.error(localeText('DDSAnnotator.smart.msg.error'));
      } finally {
        setLoading(false);
        setEditState((s) => {
          s.isRequiring = false;
        });
        setDrawData((s) => {
          s.prompt.activeRectWhileLoading = undefined;
        });
        hide();
      }
    },
    [
      editorDrawData,
      currImageItem,
      editState,
      naturalSize,
      clientSize,
      getAnnotColor,
      setDrawDataWithHistory,
    ],
  );

  return {
    onAiAnnotation,
  };
};

export default useAiModels;
