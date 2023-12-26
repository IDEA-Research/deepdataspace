import {
  getVisibleAreaForImage,
  translateBoundingBoxToRect,
  translatePointsToPointObjs,
  translatePointZoom,
  translateRectToAbsBbox,
  getCanvasPoint,
  getNaturalPoint,
  translateRectToBoundingBox,
  translatePointObjsToPointAttrs,
  convertFrameObjectsIntoFramesObjects,
  translateRectZoom,
  translateAbsBBoxToRect,
} from '../utils/compute';
import { Modal, message } from 'antd';
import { Updater } from 'use-immer';
import {
  BODY_TEMPLATE,
  EBasicToolItem,
  EBasicToolTypeMap,
  EnumModelType,
  EObjectType,
  ESubToolItem,
} from '../constants';
import {
  getImageBase64,
  isBase64,
  isBlobUrl,
  isHttpsUrl,
} from '../utils/base64';
import { useLocale } from 'dds-utils/locale';
import { useModel } from '@umijs/max';
import {
  DrawData,
  AnnoItem,
  EditState,
  EditorMode,
  IAnnotationObject,
  PromptItem,
  EObjectStatus,
  Category,
  VideoFramesData,
} from '../type';
import { objectToRle, rleToCanvas } from '../tools/useMask';
import { CursorState } from 'ahooks/lib/useMouse';
import { ModalStaticFunctions } from 'antd/es/modal/confirm';
import { useCallback } from 'react';
import {
  NsApiAnnotator,
  fetchModelResults,
  getOssUrlByBlobUrl,
} from '../sevices';

interface IProps {
  mode: EditorMode;
  currImageItem?: AnnoItem;
  modal: Omit<ModalStaticFunctions, 'warn'>;
  framesData?: VideoFramesData;
  drawData: DrawData;
  setDrawData: Updater<DrawData>;
  setDrawDataWithHistory: Updater<DrawData>;
  editState: EditState;
  setEditState: Updater<EditState>;
  naturalSize: ISize;
  clientSize: ISize;
  containerMouse: CursorState;
  imagePos: React.MutableRefObject<IPoint>;
  updateAllObject: (objectList: IAnnotationObject[]) => void;
  hadChangeRecord: boolean;
  getAnnotColor: (category: string, forceColorByCategory?: boolean) => string;
  categories: Category[];
  translateObject?: (object: any) => any;
  onCancel?: () => void;
  onSave?: (id: string, labels: any[]) => Promise<void>;
  onCommit?: (id: string, labels: any[]) => Promise<void>;
  onReviewModify?: (id: string, labels: any[]) => Promise<void>;
  onReviewAccept?: (id: string, labels: any[]) => Promise<void>;
  onReviewReject?: (id: string, labels: any[]) => Promise<void>;
  classificationOptions?: Category[];
}

export type OnAiAnnotationFunc = ({
  type,
  drawData,
  aiLabels,
  bbox,
  promptsQueue,
  segmentationClicks,
  segmentEverythingParams,
}: {
  type?: EObjectType;
  drawData?: DrawData;
  aiLabels?: string;
  bbox?: IBoundingBox;
  promptsQueue?: PromptItem[];
  segmentationClicks?: {
    point: IPoint;
    isPositive: boolean;
  }[];
  segmentEverythingParams?: NsApiAnnotator.SegmentEverythingParams;
}) => Promise<void>;

const useActions = ({
  mode,
  currImageItem,
  modal,
  framesData,
  drawData: editorDrawData,
  setDrawData,
  setDrawDataWithHistory,
  editState,
  setEditState,
  naturalSize,
  clientSize,
  imagePos,
  containerMouse,
  updateAllObject,
  hadChangeRecord,
  categories,
  getAnnotColor,
  translateObject,
  onCancel,
  onSave,
  onCommit,
  onReviewModify,
  onReviewAccept,
  onReviewReject,
  classificationOptions,
}: IProps) => {
  const { localeText } = useLocale();
  const { setLoading } = useModel('global');
  const { isRequiring } = editState;
  const setIsRequiring = (requiring: boolean) =>
    setEditState((s) => {
      s.isRequiring = requiring;
    });

  const requestAiDetection = async (source: string, aiLabels: string) => {
    try {
      setLoading(true);
      const result = await fetchModelResults<EnumModelType.Detection>(
        EnumModelType.Detection,
        {
          image: source,
          text: aiLabels,
        },
      );

      if (result) {
        const { objects, suggestThreshold } = result;
        const limitConf = suggestThreshold || 0;
        const newObjects: IAnnotationObject[] = objects
          .map((item) => {
            // mouse.elementW is not necessarily identical to the size during initialization transformation
            const rect = {
              ...translateBoundingBoxToRect(item.boundingBox, clientSize),
            };
            return {
              rect: { ...rect, visible: true },
              labelId: editState.latestLabelId,
              type: EObjectType.Rectangle,
              hidden: false,
              status:
                item.normalizedScore >= limitConf
                  ? EObjectStatus.Checked
                  : EObjectStatus.Unchecked,
              conf: item.normalizedScore,
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
        });
        message.success(localeText('DDSAnnotator.smart.msg.success'));
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
    } finally {
      setLoading(false);
    }
  };

  const convertPromptFormat = (
    prompt: PromptItem[],
  ): {
    type: string;
    isPositive: boolean;
    point?: number[];
    rect?: number[];
    stroke?: number[];
    radius?: number;
    polygons?: number[][];
  }[] => {
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

  const requestIvpDetection = async (
    base64Img: string,
    promptsQueue?: PromptItem[],
  ) => {
    if (!promptsQueue || !currImageItem) return;

    if (promptsQueue.every((prompt) => !prompt.isPositive)) {
      message.error(localeText('DDSAnnotator.smart.msg.positivePrompt'));
      setDrawDataWithHistory((s) => {
        s.prompt.creatingPrompt = undefined;
      });
      return;
    }

    try {
      setLoading(true);

      let url = base64Img;
      if (isHttpsUrl(currImageItem.url)) {
        url = currImageItem.url;
      } else if (isBlobUrl(currImageItem.url)) {
        url = await getOssUrlByBlobUrl(
          currImageItem.fileName || 'image',
          currImageItem.url,
        );
      }

      const reqParams = {
        promptImage: url,
        inferImage: url,
        prompts: convertPromptFormat(promptsQueue || []),
        labelTypes: ['bbox'],
      };

      const result = await fetchModelResults<EnumModelType.IVP>(
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
          s.prompt.creatingPrompt = undefined;
        });
        message.success(localeText('DDSAnnotator.smart.msg.success'));
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
      setDrawDataWithHistory((s) => {
        s.prompt.creatingPrompt = undefined;
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrVisibleBbox = () => {
    // record visible area currently for model prediction
    const { xmin, ymin, xmax, ymax } = getVisibleAreaForImage(
      imagePos.current,
      clientSize,
      containerMouse,
    );
    let area = [0, 0, naturalSize.width, naturalSize.height];
    if (xmax > 0 && ymax > 0) {
      const { x: x1, y: y1 } = translatePointZoom(
        {
          x: xmin,
          y: ymin,
        },
        clientSize,
        naturalSize,
      );
      const { x: x2, y: y2 } = translatePointZoom(
        {
          x: xmax,
          y: ymax,
        },
        clientSize,
        naturalSize,
      );
      area = [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)];
    }
    return area;
  };

  const requestAiSegmentByPolygon = async (
    drawData: DrawData,
    source: string,
    promptsQueue?: PromptItem[],
  ) => {
    if (!promptsQueue) return;

    const reqParams = {
      image: editState.imageCacheIdForPolygon
        ? `image_id://${editState.imageCacheIdForPolygon}`
        : source,
      density: drawData.pointResolution,
      area: getCurrVisibleBbox(),
      prompts: convertPromptFormat(promptsQueue || []),
    };

    if (drawData.prompt.sessionId) {
      Object.assign(reqParams, { sessionId: drawData.prompt.sessionId });
    }

    try {
      setLoading(true);
      const result = await fetchModelResults<EnumModelType.SegmentByPolygon>(
        EnumModelType.SegmentByPolygon,
        reqParams,
      );
      if (result) {
        const { image, polygons, sessionId } = result;

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
          setEditState((s) => {
            s.imageCacheIdForPolygon = image.replace(/^image_id:\/\//, '');
          });
          message.success(localeText('DDSAnnotator.smart.msg.success'));
        }
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
      setDrawDataWithHistory((s) => {
        s.prompt.creatingPrompt = undefined;
      });
    } finally {
      setLoading(false);
    }
  };

  const requestAiSegmentByMask = async (
    drawData: DrawData,
    source: string,
    promptsQueue?: PromptItem[],
  ) => {
    if (!promptsQueue) return;
    const currMask =
      drawData.creatingObject?.maskCanvasElement ||
      drawData.creatingObject?.tempMaskSteps
        ? objectToRle(
            clientSize,
            naturalSize,
            drawData.creatingObject?.tempMaskSteps || [],
            drawData.creatingObject?.maskCanvasElement,
          )
        : [];

    const reqParams: NsApiAnnotator.FetchAIMaskSegmentReq = {
      maskRle: currMask || [],
      maskId: drawData.prompt.sessionId || '',
      prompt: convertPromptFormat(promptsQueue || []),
      area: getCurrVisibleBbox(),
    };

    if (editState.imageCacheId) {
      Object.assign(reqParams, { imageId: editState.imageCacheId });
    } else {
      Object.assign(reqParams, { image: source });
    }

    try {
      setLoading(true);
      const result = await fetchModelResults<EnumModelType.SegmentByMask>(
        EnumModelType.SegmentByMask,
        reqParams,
      );
      if (result) {
        const { maskId, maskRle, imageId } = result;
        const color =
          drawData.creatingObject?.color ||
          getAnnotColor(editState.latestLabelId);
        const creatingObj = {
          type: EObjectType.Mask,
          hidden: false,
          labelId: editState.latestLabelId,
          currIndex: -1,
          maskCanvasElement: rleToCanvas(maskRle, naturalSize, color),
          maskRle,
          status: EObjectStatus.Checked,
          color,
        };
        setDrawDataWithHistory((s) => {
          s.creatingObject = creatingObj;
          s.prompt.promptsQueue = promptsQueue;
          s.prompt.sessionId = maskId;
          s.prompt.creatingPrompt = undefined;
        });
        setEditState((s) => {
          s.imageCacheId = imageId;
        });
        message.success(localeText('DDSAnnotator.smart.msg.success'));
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
      setDrawDataWithHistory((s) => {
        s.prompt.creatingPrompt = undefined;
      });
    } finally {
      setLoading(false);
    }
  };

  const requestAiPoseEstimation = async (
    drawData: DrawData,
    source: string,
    aiLabels: string,
  ) => {
    // TODO: Integrate custom templates
    const { lines, pointNames, pointColors } = BODY_TEMPLATE;
    const reqParams = {
      image: source,
      targets: aiLabels,
      template: {
        lines,
        pointNames,
        pointColors,
      },
    };

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
            categoryName: aiLabels,
            points: item.keypoints
              ? translatePointObjsToPointAttrs(
                  item.keypoints.points,
                  naturalSize,
                  clientSize,
                ).points
              : undefined,
            boundingBox: item.rect
              ? translateRectToBoundingBox(item.rect, clientSize)
              : undefined,
          };
        });
        Object.assign(reqParams, { objects });
      }
    }

    try {
      setLoading(true);
      const result = await fetchModelResults<EnumModelType.Pose>(
        EnumModelType.Pose,
        reqParams,
      );

      if (result) {
        const { objects } = result;

        if (objects && objects.length > 0) {
          const skeletonObjs = objects.map((obj) => {
            let { boundingBox, points, conf } = obj;
            const newObj: IAnnotationObject = {
              labelId: editState.latestLabelId,
              color: getAnnotColor(editState.latestLabelId),
              type: EObjectType.Skeleton,
              hidden: false,
              conf,
              status: EObjectStatus.Checked,
            };
            if (boundingBox) {
              const rect = translateBoundingBoxToRect(boundingBox!, clientSize);
              Object.assign(newObj, { rect: { visible: true, ...rect } });
            }
            if (points && lines && pointColors && pointNames) {
              const pointObjs = translatePointsToPointObjs(
                points,
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
          });

          message.success(localeText('DDSAnnotator.smart.msg.success'));
        }
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
    } finally {
      setLoading(false);
    }
  };

  const requestEdgeStitchingForMask = async (
    drawData: DrawData,
    source: string,
  ) => {
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
      message.error(
        'To ensure valid results when using intelligent edge stitching, make sure to use at least 2 mask objects.',
      );
      setDrawData((s) => {
        s.prompt.creatingPrompt = undefined;
      });
      return;
    }

    const rleList = maskObjects.map((item) => {
      const maskRle =
        objectToRle(clientSize, naturalSize, [], item.maskCanvasElement) || [];
      const categoryName =
        categories.find((c) => c.id === item.labelId)?.name || '';
      return { maskRle, categoryName };
    });

    const points = stroke.reduce((acc: number[], point: IPoint) => {
      const { x, y } = point;
      const naturalPoint = getNaturalPoint([x, y], naturalSize, clientSize);
      return acc.concat([naturalPoint.x, naturalPoint.y]);
    }, []);

    const reqParams: NsApiAnnotator.FetchEdgeStitchingReq = {
      rleList,
      stroke: points,
      radius,
    };

    if (editState.imageCacheId) {
      Object.assign(reqParams, { imageId: editState.imageCacheId });
    } else {
      Object.assign(reqParams, { image: source });
    }

    Object.assign(reqParams, { image: source });

    try {
      setLoading(true);
      const result = await fetchModelResults<EnumModelType.MaskEdgeStitching>(
        EnumModelType.MaskEdgeStitching,
        reqParams,
      );
      if (result && result.rleList?.length > 0) {
        const maskObjects = result.rleList.map((item) => {
          const labelId =
            categories.find((c) => c.name === item.categoryName)?.id || '';
          const color = getAnnotColor(labelId);
          return {
            type: EObjectType.Mask,
            hidden: false,
            labelId: labelId,
            maskRle: item.maskRle,
            maskCanvasElement: rleToCanvas(item.maskRle, naturalSize, color),
            conf: 1,
            status: EObjectStatus.Commited,
            color,
          };
        });

        // Replace all instances of the mask type
        const leftObjs = drawData.objectList.filter(
          (obj) => obj.type !== EObjectType.Mask,
        );

        const updatedObjects = [...leftObjs, ...maskObjects];
        updateAllObject(updatedObjects);

        message.success(localeText('DDSAnnotator.smart.msg.success'));
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
    } finally {
      setLoading(false);
      setDrawData((s) => {
        s.prompt.creatingPrompt = undefined;
      });
    }
  };

  const requestSegmentEverything = async (
    source: string,
    params?: NsApiAnnotator.SegmentEverythingParams,
  ) => {
    const reqParams: NsApiAnnotator.FetchSegmentEverythingReq = {
      ...params,
    };

    if (editState.imageCacheId) {
      Object.assign(reqParams, { imageId: editState.imageCacheId });
    } else {
      Object.assign(reqParams, { image: source });
    }

    try {
      setLoading(true);
      const result = await fetchModelResults<EnumModelType.SegmentEverything>(
        EnumModelType.SegmentEverything,
        reqParams,
      );
      if (result && result.rleList?.length > 0) {
        // change to display different color
        setEditState((s) => {
          s.annotsDisplayOptions.colorByCategory = false;
        });
        const maskObjects: IAnnotationObject[] = result.rleList.map((item) => {
          const color = getAnnotColor(editState.latestLabelId);
          return {
            type: EObjectType.Mask,
            hidden: false,
            labelId: editState.latestLabelId,
            maskRle: item.maskRle,
            maskCanvasElement: rleToCanvas(item.maskRle, naturalSize, color),
            conf: 1,
            status: EObjectStatus.Checked,
            color,
          };
        });
        setDrawDataWithHistory((s) => {
          s.objectList = maskObjects;
          s.isBatchEditing = true;
        });
        message.success(localeText('DDSAnnotator.smart.msg.success'));
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
    } finally {
      setLoading(false);
    }
  };

  const onAiAnnotation: OnAiAnnotationFunc = useCallback(
    async ({
      type,
      drawData: propsDrawData,
      aiLabels,
      promptsQueue,
      segmentEverythingParams,
    }) => {
      if (isRequiring) return;

      const drawData = propsDrawData || editorDrawData;

      if (
        !aiLabels &&
        (drawData.selectedTool === EBasicToolItem.Skeleton ||
          (drawData.selectedTool === EBasicToolItem.Rectangle &&
            drawData.selectedModel === EnumModelType.Detection))
      ) {
        message.warning(localeText('DDSAnnotator.smart.msg.labelRequired'));
        return;
      }

      const hide = message.loading(
        localeText('DDSAnnotator.smart.msg.loading'),
        100000,
      );
      let imgSrc = `${currImageItem?.url}`;

      try {
        setIsRequiring(true);
        if (!isBase64(imgSrc)) {
          imgSrc = await getImageBase64(imgSrc);
        }
      } catch (e: any) {
        message.error('ImageToBase64 Error:', e);
      }

      try {
        setIsRequiring(true);
        const aiType = type || EBasicToolTypeMap[drawData.selectedTool];
        switch (aiType) {
          case EObjectType.Rectangle: {
            if (drawData.selectedModel === EnumModelType.Detection) {
              await requestAiDetection(imgSrc, aiLabels || '');
            } else {
              await requestIvpDetection(imgSrc, promptsQueue);
            }
            break;
          }
          case EObjectType.Skeleton: {
            await requestAiPoseEstimation(drawData, imgSrc, aiLabels || '');
            break;
          }
          case EObjectType.Polygon: {
            await requestAiSegmentByPolygon(drawData, imgSrc, promptsQueue);
            break;
          }
          case EObjectType.Mask: {
            if (drawData.selectedSubTool === ESubToolItem.AutoEdgeStitching) {
              await requestEdgeStitchingForMask(drawData, imgSrc);
            } else if (
              drawData.selectedSubTool === ESubToolItem.AutoSegmentEverything
            ) {
              await requestSegmentEverything(imgSrc, segmentEverythingParams);
            } else {
              await requestAiSegmentByMask(drawData, imgSrc, promptsQueue);
            }
            break;
          }
          default:
            message.warning('Plan to Support!');
            break;
        }
      } catch (error) {
        message.error(localeText('DDSAnnotator.smart.msg.error'));
      } finally {
        setIsRequiring(false);
        setDrawData((s) => {
          s.prompt.activeRectWhileLoading = undefined;
        });
        hide();
      }
    },
    [editorDrawData],
  );

  const translateDrawData = useCallback(
    (drawData: DrawData): [string, any[]] => {
      let objectList = [];
      if (framesData) {
        objectList = convertFrameObjectsIntoFramesObjects(
          drawData.objectList,
          framesData.objects,
          framesData.list.length,
          framesData.activeIndex,
        ).map((objs) => {
          const availObjs: any = {};
          objs.forEach((obj, frameIndex) => {
            if (obj && !obj.frameEmpty) {
              // TODO: adapt for old format
              const { labelId, attributes, labelValue } =
                translateObject?.(obj);
              availObjs.labelId = labelId;
              availObjs.attributes = attributes;
              if (!availObjs.labelValue) availObjs.labelValue = {};
              availObjs.labelValue[String(frameIndex)] = labelValue;
            }
          });
          return availObjs;
        });
      } else {
        objectList = drawData.objectList.map((obj) => translateObject?.(obj));
      }
      return [
        framesData?.id || currImageItem?.id || '',
        [
          ...drawData.classifications.map((item) => {
            const label = categories.find((c) => c.id === item.labelId);
            return {
              ...item,
              attributes:
                item.attributes || label?.attributes?.map(() => null) || [],
            };
          }),
          ...objectList,
        ],
      ];
    },
    [currImageItem, translateObject, framesData],
  );

  const judgeLimitCommit = (labels: any[]) => {
    const errorList: string[] = [];
    // check classification
    classificationOptions?.forEach((item, idx) => {
      const value = labels.find((label) => label.labelId === item.id);
      if (!value || [undefined, null, ''].includes(value.labelValue)) {
        errorList.push(
          localeText('DDSAnnotator.save.check.classification', {
            idx: idx + 1,
          }),
        );
      }
    });
    // check label
    labels.forEach((item, idx) => {
      const label = categories.find((label) => label.id === item.labelId);
      if (
        label?.attributes?.find(
          (attribute, index) =>
            attribute.required &&
            [undefined, null, ''].includes(item.attributes?.[index]),
        )
      ) {
        errorList.push(
          localeText('DDSAnnotator.save.check.label', {
            idx: idx + 1,
            labelName: label.labelName,
          }),
        );
      }
    });

    if (errorList.length > 0) {
      Modal.warning({
        width: 480,
        title: localeText('DDSAnnotator.save.check.error'),
        content: (
          <div>
            {errorList.map((item, index) => (
              <span key={index}>
                {item}
                <br />
              </span>
            ))}
            <span>{localeText('DDSAnnotator.save.check.tip')}</span>
          </div>
        ),
      });
      return true;
    }

    return false;
  };

  const onSaveAnnotations = async () => {
    if (isRequiring || !onSave) return;

    const [id, labels] = translateDrawData(editorDrawData);
    console.log('>>> save', id, labels);
    if (judgeLimitCommit(labels)) return;

    setIsRequiring(true);
    try {
      await onSave(id, labels);
    } catch (error) {
      console.error(error);
    }
    setIsRequiring(false);
  };

  const onCommitAnnotations = async () => {
    if (isRequiring || !onCommit) return;

    const [id, labels] = translateDrawData(editorDrawData);
    if (judgeLimitCommit(labels)) return;

    setIsRequiring(true);
    try {
      await onCommit(id, labels);
    } catch (error) {
      console.error(error);
    }
    setIsRequiring(false);
  };

  const onRejectAnnotations = async () => {
    if (mode === EditorMode.Review && onReviewReject) {
      onReviewReject(...translateDrawData(editorDrawData));
    }
  };

  const onAcceptAnnotations = async () => {
    if (mode === EditorMode.Review && onReviewAccept) {
      onReviewAccept(...translateDrawData(editorDrawData));
    }
  };

  const onModifyAnnotations = async () => {
    if (mode === EditorMode.Review && onReviewModify) {
      onReviewModify(...translateDrawData(editorDrawData));
    }
  };

  const onCancelAnnotations = async () => {
    if (mode === EditorMode.Edit && hadChangeRecord) {
      modal.confirm({
        getContainer: () => document.body,
        content: localeText('DDSAnnotator.confirmLeave.content'),
        cancelText: localeText('DDSAnnotator.confirmLeave.cancel'),
        okText: localeText('DDSAnnotator.confirmLeave.ok'),
        okButtonProps: { danger: true },
        onOk: () => {
          if (onCancel) onCancel();
        },
      });
      return;
    }
    if (onCancel) onCancel();
  };

  return {
    onAiAnnotation,
    onSaveAnnotations,
    onCommitAnnotations,
    onCancelAnnotations,
    onRejectAnnotations,
    onAcceptAnnotations,
    onModifyAnnotations,
  };
};

export default useActions;
