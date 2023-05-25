import { DATA } from '@/services/type';
import {
  translatePointObjsToPointAttrs,
  translatePolygonsToSegmentation,
  translateRectToBoundingBox,
} from '@/utils/compute';
import { Updater } from 'use-immer';
import { EditorMode, IAnnotationObject } from '..';

interface IProps {
  objectsFilter?: (objects: DATA.BaseObject[]) => DATA.BaseObject[];
  mode: EditorMode;
  annotations: DATA.BaseObject[];
  setAnnotations: Updater<DATA.BaseObject[]>;
  clientSize: ISize;
  naturalSize: ISize;
  updateHistory: (objects: DATA.BaseObject[]) => void;
  onAutoSave?: (annos: DATA.BaseObject[]) => void;
}

const useAnnotations = ({
  mode,
  annotations,
  setAnnotations,
  clientSize,
  naturalSize,
  updateHistory,
  onAutoSave,
}: IProps) => {
  const translateObjectToAnnotation = (
    object: IAnnotationObject,
  ): DATA.BaseObject => {
    const { label, rect, keypoints, polygon } = object;
    const annoObj = {
      categoryName: label,
    };
    if (rect) {
      Object.assign(annoObj, {
        boundingBox: translateRectToBoundingBox(rect, clientSize),
      });
    } else {
      Object.assign(annoObj, {
        boundingBox: {
          xmin: 0,
          xmax: 0,
          ymin: 0,
          ymax: 0,
        },
      });
    }
    if (keypoints) {
      Object.assign(annoObj, {
        lines: keypoints.lines,
        ...translatePointObjsToPointAttrs(
          keypoints.points,
          naturalSize,
          clientSize,
        ),
      });
    }
    if (polygon) {
      const segmentation = translatePolygonsToSegmentation(
        polygon,
        naturalSize,
        clientSize,
      );
      Object.assign(annoObj, {
        segmentation,
      });
    }
    return annoObj;
  };

  const changeAnnotation = (updatedAnnos: DATA.BaseObject[]) => {
    updateHistory(updatedAnnos);
    setAnnotations(updatedAnnos);
    if (onAutoSave) onAutoSave(updatedAnnos);
  };

  const addAnnotation = (object: IAnnotationObject) => {
    if (mode !== EditorMode.Edit) return;
    const newAnno = translateObjectToAnnotation(object);
    const updateAnnos = [...annotations, newAnno];
    changeAnnotation(updateAnnos);
  };

  const removeAnnotation = (index: number) => {
    if (mode !== EditorMode.Edit) return;
    if (index < 0 || index >= annotations.length) return;
    const copyAnnos = [...annotations];
    copyAnnos.splice(index, 1);
    changeAnnotation(copyAnnos);
  };

  const updateAnnotation = (object: IAnnotationObject, index: number) => {
    if (mode !== EditorMode.Edit) return;
    if (index < 0 || index >= annotations.length) return;
    const copyAnnos = [...annotations];
    copyAnnos[index] = translateObjectToAnnotation(object);
    changeAnnotation(copyAnnos);
  };

  const updateAllAnnotation = (objectList: IAnnotationObject[]) => {
    const updateAnnos = objectList.map((object) =>
      translateObjectToAnnotation(object),
    );
    changeAnnotation(updateAnnos);
  };

  return {
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    updateAllAnnotation,
  };
};

export default useAnnotations;
