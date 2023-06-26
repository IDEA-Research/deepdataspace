import { reportEvent } from '@/logs';
import { fetchModelResults } from '@/services/dataset';
import {
  isEqualRect,
  translateBoundingBoxToRect,
  translateObjectsToAnnotations,
  translatePointsToPointObjs,
} from '@/utils/compute';
import { message, Modal } from 'antd';
import { DrawData, EditImageData, IAnnotationObject } from '..';
import { Updater } from 'use-immer';
import { DATA, EnumModelType } from '@/services/type';
import { BODY_TEMPLATE, EBasicToolItem, EObjectType } from '@/constants';
import {
  getCanvasPoint,
  getImageBase64,
  getNaturalPoint,
  isBase64,
} from '@/utils/annotation';
import { useLocale } from '@/locales/helper';
import { useModel } from '@umijs/max';

interface IProps {
  list: EditImageData[];
  current: number;
  setDrawData: Updater<DrawData>;
  isRequiring: boolean;
  setIsRequiring: Updater<boolean>;
  naturalSize: ISize;
  clientSize: ISize;
  onCancel?: () => void;
  onSave?: (imageId: string, annotations: DATA.BaseObject[]) => Promise<void>;
  updateAllObject: (objectList: IAnnotationObject[]) => void;
  hadChangeRecord: boolean;
  latestLabel: string;
}

const useActions = ({
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
  hadChangeRecord,
  latestLabel,
}: IProps) => {
  const { localeText } = useLocale();
  const { setLoading } = useModel('global');

  /**
   * Smart Detection
   * @param drawData
   * @param source
   * @param aiLabels
   * @param hide
   */
  const requestAiDetection = async (
    drawData: DrawData,
    source: string,
    aiLabels: string[],
  ) => {
    try {
      setLoading(true);
      const result = await fetchModelResults<EnumModelType.Detection>(
        EnumModelType.Detection,
        {
          image: source,
          text: aiLabels.join(','),
        },
      );

      if (result) {
        const { objects } = result;
        const newObjects: IAnnotationObject[] = [];
        objects.forEach((item) => {
          // mouse.elementW is not necessarily identical to the size during initialization transformation
          const rect = {
            ...translateBoundingBoxToRect(item.boundingBox, clientSize),
          };
          if (
            !drawData.objectList.find((obj) => {
              return (
                obj.label === item.categoryName &&
                obj.rect &&
                isEqualRect(rect, obj.rect)
              );
            })
          ) {
            newObjects.push({
              rect: { ...rect, visible: true },
              label: item.categoryName,
              type: EObjectType.Rectangle,
              hidden: false,
            });
          }
        });
        updateAllObject([...drawData.objectList, ...newObjects]);
        message.success(localeText('smartAnnotation.msg.success'));
      }
    } catch (error: any) {
      console.error(error.message);
      message.error(`Request Failed: ${error.message}, Please retry later.`);
    } finally {
      setLoading(false);
    }
  };

  const requestAiSegmentation = async (
    drawData: DrawData,
    source: string,
    bbox?: IBoundingBox,
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
      drawData.segmentationClicks?.map((click) => {
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
      mask: drawData.segmentationMask || '',
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
      const result = await fetchModelResults<EnumModelType.Segmentation>(
        EnumModelType.Segmentation,
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
            currIndex: -1,
            polygon: {
              visible: true,
              group: predictPolygons,
            },
          };

          setDrawData((s) => {
            s.creatingObject = creatingObj;
            s.segmentationMask = mask;
          });
        }

        message.success(localeText('smartAnnotation.msg.success'));
      }
    } catch (error: any) {
      console.error(error.message);
      message.error(`Request Failed: ${error.message}, Please retry later.`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * AI Pose Estimation
   * @param source
   * @param aiLabels
   */
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
    const skeletonObjs = drawData.objectList.filter(
      (obj) => obj.type === EObjectType.Skeleton,
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
            let { categoryName, boundingBox, points, conf } = obj;
            const newObj: IAnnotationObject = {
              label: categoryName,
              type: EObjectType.Skeleton,
              hidden: false,
              conf,
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

          // Replace all instances of the skeleton type
          const leftObjs = drawData.objectList.filter(
            (obj) => obj.type !== EObjectType.Skeleton,
          );
          const updatedObjects = [...leftObjs, ...skeletonObjs];
          updateAllObject(updatedObjects);

          message.success(localeText('smartAnnotation.msg.success'));
        }
      }
    } catch (error: any) {
      console.error(error.message);
      message.error(`Request Failed: ${error.message}, Please retry later.`);
    } finally {
      setLoading(false);
    }
  };

  const onAiAnnotation = async (
    drawData: DrawData,
    aiLabels: string[],
    bbox?: IBoundingBox,
  ) => {
    if (isRequiring) return;

    if (
      !aiLabels.length &&
      [EBasicToolItem.Rectangle, EBasicToolItem.Skeleton].includes(
        drawData.selectedTool,
      )
    ) {
      message.warning(localeText('smartAnnotation.msg.labelRequired'));
      return;
    }

    const hide = message.loading(
      localeText('smartAnnotation.msg.loading'),
      100000,
    );
    let imgSrc = `${list[current].urlFullRes}`;

    try {
      setIsRequiring(true);
      if (!isBase64(imgSrc)) {
        imgSrc = await getImageBase64(`${imgSrc}?noredirect=1`);
      }
    } catch (error) {
      console.log('imageToBase64 error:', error);
    }

    try {
      setIsRequiring(true);
      reportEvent('dataset_item_edit_ai_annotation', {
        labels: aiLabels,
      });
      switch (drawData.selectedTool) {
        case EBasicToolItem.Rectangle: {
          await requestAiDetection(drawData, imgSrc, aiLabels);
          setIsRequiring(false);
          hide();
          break;
        }
        case EBasicToolItem.Skeleton: {
          await requestAiPoseEstimation(drawData, imgSrc, aiLabels);
          setIsRequiring(false);
          hide();
          break;
        }
        case EBasicToolItem.Polygon: {
          await requestAiSegmentation(drawData, imgSrc, bbox);
          setIsRequiring(false);
          hide();
          break;
        }
        default:
          setIsRequiring(false);
          hide();
          message.warning('Plan to Support!');
          break;
      }
    } catch (error) {
      setIsRequiring(false);
      hide();
      message.error(localeText('smartAnnotation.msg.error'));
    }
  };

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
    if (list[current]) {
      if (hadChangeRecord) {
        Modal.confirm({
          content: localeText('editor.confirmLeave.content'),
          cancelText: localeText('editor.confirmLeave.cancel'),
          okText: localeText('editor.confirmLeave.ok'),
          okButtonProps: { danger: true },
          onOk: () => {
            if (onCancel) onCancel();
            reportEvent('dataset_item_edit_cancel');
          },
        });
        return;
      }
    }
    if (onCancel) onCancel();
    reportEvent('dataset_item_edit_cancel');
  };

  return {
    onAiAnnotation,
    onSaveAnnotations,
    onCancelAnnotations,
  };
};

export default useActions;
