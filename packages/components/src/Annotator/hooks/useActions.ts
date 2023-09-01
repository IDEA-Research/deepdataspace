import {
  getVisibleAreaForImage,
  translateBoundingBoxToRect,
  translateObjectsToAnnotations,
  translatePointsToPointObjs,
  translatePointZoom,
  translateRectToAbsBbox,
  getCanvasPoint,
  getNaturalPoint,
} from '../utils/compute';
import { message } from 'antd';
import { Updater } from 'use-immer';
import {
  BODY_TEMPLATE,
  EBasicToolItem,
  EBasicToolTypeMap,
  EObjectType,
  ESubToolItem,
} from '../constants';
import { getImageBase64, isBase64 } from '../utils/base64';
import { useLocale } from 'dds-utils/locale';
import { useModel } from '@umijs/max';
import {
  BaseObject,
  DrawData,
  DrawImageData,
  EditState,
  EditorMode,
  IAnnotationObject,
  MaskPromptItem,
  EObjectStatus,
  EQaAction,
} from '../type';
import { objectToRle, rleToCanvas } from '../tools/useMask';
import { CursorState } from 'ahooks/lib/useMouse';
import { ModalStaticFunctions } from 'antd/es/modal/confirm';
import { useCallback } from 'react';
import { NsApiAnnotator, fetchModelResults } from '../sevices';

interface IProps {
  mode: EditorMode;
  list: DrawImageData[];
  current: number;
  modal: Omit<ModalStaticFunctions, 'warn'>;
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
  latestLabel: string;
  getAnnotColor: (category: string, forceColorByCategory?: boolean) => string;
  onCancel?: () => void;
  onSave?: (imageId: string, annotations: BaseObject[]) => Promise<void>;
  onReviewResult?: (imageId: string, action: EQaAction) => Promise<void>;
}

export type OnAiAnnotationFunc = ({
  type,
  drawData,
  aiLabels,
  bbox,
  maskPrompts,
  segmentationClicks,
  segmentEverythingParams,
}: {
  type?: EObjectType;
  drawData?: DrawData;
  aiLabels?: string[];
  bbox?: IBoundingBox;
  maskPrompts?: MaskPromptItem[];
  segmentationClicks?: {
    point: IPoint;
    isPositive: boolean;
  }[];
  segmentEverythingParams?: NsApiAnnotator.SegmentEverythingParams;
}) => Promise<void>;

const useActions = ({
  mode,
  list,
  current,
  modal,
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
  latestLabel,
  getAnnotColor,
  onCancel,
  onSave,
  onReviewResult,
}: IProps) => {
  const { localeText } = useLocale();
  const { setLoading } = useModel('global');
  const { isRequiring } = editState;
  const setIsRequiring = (requiring: boolean) =>
    setEditState((s) => {
      s.isRequiring = requiring;
    });

  const requestAiDetection = async (source: string, aiLabels: string[]) => {
    try {
      setLoading(true);
      const result =
        await fetchModelResults<NsApiAnnotator.EnumModelType.Detection>(
          NsApiAnnotator.EnumModelType.Detection,
          {
            image: source,
            text: aiLabels.join(','),
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
              label: item.categoryName,
              type: EObjectType.Rectangle,
              hidden: false,
              status:
                item.normalizedScore >= limitConf
                  ? EObjectStatus.Checked
                  : EObjectStatus.Unchecked,
              conf: item.normalizedScore,
              color: getAnnotColor(item.categoryName, true),
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
        });
        message.success(localeText('DDSAnnotator.smart.msg.success'));
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
    } finally {
      setLoading(false);
    }
  };

  const requestAiSegmentByPolygon = async (
    drawData: DrawData,
    source: string,
    bbox?: IBoundingBox,
    segmentationClicks?: {
      point: IPoint;
      isPositive: boolean;
    }[],
  ) => {
    const existPolygons =
      drawData.creatingObject?.polygon?.group.map((polygon) => {
        return polygon.reduce((acc: number[], point) => {
          const { x, y } = getNaturalPoint(
            [point.x, point.y],
            naturalSize,
            clientSize,
          );
          return acc.concat([x, y]);
        }, []);
      }) || [];

    const clicks =
      segmentationClicks?.map((click) => {
        const { x, y } = getNaturalPoint(
          [click.point.x, click.point.y],
          naturalSize,
          clientSize,
        );
        return {
          isPositive: click.isPositive,
          position: [x, y],
        };
      }) || [];

    const reqParams = {
      image: source,
      mask: drawData.prompt.segmentationMask || '',
      polygons: existPolygons,
      clicks: clicks,
    };

    if (bbox) {
      const { xmin, ymin, xmax, ymax } = bbox;
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
      Object.assign(reqParams, {
        rect: [
          topleftPoint.x,
          topleftPoint.y,
          bottomRightPoint.x,
          bottomRightPoint.y,
        ],
      });
    }

    try {
      setLoading(true);
      const result =
        await fetchModelResults<NsApiAnnotator.EnumModelType.SegmentByPolygon>(
          NsApiAnnotator.EnumModelType.SegmentByPolygon,
          reqParams,
        );
      if (result) {
        const { polygon, mask } = result;

        if (polygon && polygon.length > 0) {
          const predictPolygons = polygon.map((item) => {
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
            label: latestLabel,
            color: getAnnotColor(latestLabel),
            currIndex: -1,
            polygon: {
              visible: true,
              group: predictPolygons,
            },
            status: EObjectStatus.Checked,
          };

          setDrawDataWithHistory((s) => {
            s.creatingObject = creatingObj;
            s.prompt.segmentationMask = mask;
          });
        }

        message.success(localeText('DDSAnnotator.smart.msg.success'));
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
    } finally {
      setLoading(false);
    }
  };

  const convertPromptFormat = (
    prompt: MaskPromptItem[],
  ): {
    type: string;
    isPositive: boolean;
    point?: number[];
    rect?: number[];
    stroke?: number[];
  }[] => {
    const newPromptArr = prompt.map((item) => {
      const { type, isPositive, point, rect, stroke, radius } = item;

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

      return newItem;
    });

    return newPromptArr;
  };

  const requestAiSegmentByMask = async (
    drawData: DrawData,
    source: string,
    maskPrompts?: MaskPromptItem[],
  ) => {
    if (!maskPrompts) return;

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

    // record visible area currently for model
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

    const reqParams: NsApiAnnotator.FetchAIMaskSegmentReq = {
      maskRle: currMask || [],
      maskId: drawData.prompt.segmentationMask || '',
      prompt: convertPromptFormat(maskPrompts || []),
      area,
    };

    if (editState.imageCacheId) {
      Object.assign(reqParams, { imageId: editState.imageCacheId });
    } else {
      Object.assign(reqParams, { image: source });
    }

    try {
      setLoading(true);
      const result =
        await fetchModelResults<NsApiAnnotator.EnumModelType.SegmentByMask>(
          NsApiAnnotator.EnumModelType.SegmentByMask,
          reqParams,
        );
      if (result) {
        const { maskId, maskRle, imageId } = result;
        const color =
          drawData.creatingObject?.color || getAnnotColor(latestLabel);
        const creatingObj = {
          type: EObjectType.Mask,
          hidden: false,
          label: latestLabel,
          currIndex: -1,
          maskCanvasElement: rleToCanvas(maskRle, naturalSize, color),
          maskRle,
          status: EObjectStatus.Checked,
          color,
        };
        setDrawDataWithHistory((s) => {
          s.creatingObject = creatingObj;
          s.prompt.maskPrompts = maskPrompts;
          s.prompt.segmentationMask = maskId;
          s.prompt.creatingMask = undefined;
        });
        setEditState((s) => {
          s.imageCacheId = imageId;
        });
        message.success(localeText('DDSAnnotator.smart.msg.success'));
      }
    } catch (error: any) {
      message.error(localeText('DDSAnnotator.smart.msg.error'));
      setDrawDataWithHistory((s) => {
        s.prompt.creatingMask = undefined;
      });
    } finally {
      setLoading(false);
    }
  };

  const requestAiPoseEstimation = async (
    drawData: DrawData,
    source: string,
    aiLabels: string[],
  ) => {
    // TODO: Integrate custom templates
    const { lines, pointNames, pointColors } = BODY_TEMPLATE;
    const reqParams = {
      image: source,
      targets: aiLabels.join(','),
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
        const annotations = translateObjectsToAnnotations(
          skeletonObjs,
          naturalSize,
          clientSize,
        );
        const objects = annotations.map((item) => {
          return {
            categoryName: item.categoryName,
            points: item.points,
            boundingBox: item.boundingBox,
          };
        });
        Object.assign(reqParams, { objects });
      }
    }

    try {
      setLoading(true);
      const result = await fetchModelResults<NsApiAnnotator.EnumModelType.Pose>(
        NsApiAnnotator.EnumModelType.Pose,
        reqParams,
      );

      if (result) {
        const { objects } = result;

        if (objects && objects.length > 0) {
          const skeletonObjs = objects.map((obj) => {
            let { categoryName, boundingBox, points, conf } = obj;
            const newObj: IAnnotationObject = {
              label: categoryName,
              color: getAnnotColor(categoryName),
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
      !drawData.prompt.creatingMask?.stroke ||
      !drawData.prompt.creatingMask?.radius
    )
      return;

    const { stroke, radius } = drawData.prompt.creatingMask;

    const maskObjects = drawData.objectList.filter(
      (item) => item.type === EObjectType.Mask,
    );

    if (maskObjects.length < 2) {
      message.error(
        'To ensure valid results when using intelligent edge stitching, make sure to use at least 2 mask objects.',
      );
      setDrawData((s) => {
        s.prompt.creatingMask = undefined;
      });
      return;
    }

    const rleList = maskObjects.map((item) => {
      const maskRle =
        objectToRle(clientSize, naturalSize, [], item.maskCanvasElement) || [];
      return { maskRle, categoryName: item.label };
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
      const result =
        await fetchModelResults<NsApiAnnotator.EnumModelType.MaskEdgeStitching>(
          NsApiAnnotator.EnumModelType.MaskEdgeStitching,
          reqParams,
        );
      if (result && result.rleList?.length > 0) {
        const maskObjects = result.rleList.map((item) => {
          const color = getAnnotColor(item.categoryName);
          return {
            type: EObjectType.Mask,
            hidden: false,
            label: item.categoryName,
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
        s.prompt.creatingMask = undefined;
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
      const result =
        await fetchModelResults<NsApiAnnotator.EnumModelType.SegmentEverything>(
          NsApiAnnotator.EnumModelType.SegmentEverything,
          reqParams,
        );
      if (result && result.rleList?.length > 0) {
        // change to display different color
        setEditState((s) => {
          s.annotsDisplayOptions.colorByCategory = false;
        });
        const maskObjects: IAnnotationObject[] = result.rleList.map((item) => {
          const color = getAnnotColor(latestLabel);
          return {
            type: EObjectType.Mask,
            hidden: false,
            label: latestLabel,
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
      aiLabels = [],
      bbox,
      maskPrompts,
      segmentationClicks,
      segmentEverythingParams,
    }) => {
      if (isRequiring) return;

      const drawData = propsDrawData || editorDrawData;

      if (
        !aiLabels.length &&
        [EBasicToolItem.Rectangle, EBasicToolItem.Skeleton].includes(
          drawData.selectedTool,
        )
      ) {
        message.warning(localeText('DDSAnnotator.smart.msg.labelRequired'));
        return;
      }

      const hide = message.loading(
        localeText('DDSAnnotator.smart.msg.loading'),
        100000,
      );
      let imgSrc = `${list[current].urlFullRes}`;

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
            await requestAiDetection(imgSrc, aiLabels);
            break;
          }
          case EObjectType.Skeleton: {
            await requestAiPoseEstimation(drawData, imgSrc, aiLabels);
            break;
          }
          case EObjectType.Polygon: {
            await requestAiSegmentByPolygon(
              drawData,
              imgSrc,
              bbox,
              segmentationClicks,
            );
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
              await requestAiSegmentByMask(drawData, imgSrc, maskPrompts);
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

  const onSaveAnnotations = async (drawData: DrawData) => {
    if (isRequiring || !onSave) return;

    if (drawData.objectList.find((item) => !item.label)) {
      message.warning(
        'There are annotations without a category. Please check.',
      );
      return;
    }

    setIsRequiring(true);
    try {
      const annotations = translateObjectsToAnnotations(
        drawData.objectList,
        naturalSize,
        clientSize,
      );
      await onSave(list[current].id, annotations);
    } catch (error) {
      console.error(error);
    }
    setIsRequiring(false);
  };

  const onCancelAnnotations = () => {
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

  return {
    onAiAnnotation,
    onSaveAnnotations,
    onCancelAnnotations,
    onReject,
    onAccept,
  };
};

export default useActions;
