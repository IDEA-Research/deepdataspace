import { Modal } from 'antd';
import { ModalStaticFunctions } from 'antd/es/modal/confirm';
import { useLocale } from 'dds-utils/locale';
import { useCallback } from 'react';
import { Updater } from 'use-immer';

import {
  DrawData,
  AnnoItem,
  EditState,
  EditorMode,
  Category,
  VideoFramesData,
  ICreatingObject,
} from '../type';
import { isRequiredAttributeValueEmpty } from '../utils/verify';

interface IProps {
  mode: EditorMode;
  currImageItem?: AnnoItem;
  modal: Omit<ModalStaticFunctions, 'warn'>;
  framesData?: VideoFramesData;
  drawData: DrawData;
  editState: EditState;
  setEditState: Updater<EditState>;
  hadChangeRecord: boolean;
  categories: Category[];
  translateObject?: (object: any) => any;
  flagSaved?: () => void;
  onCancel?: () => void;
  onSave?: (id: string, labels: any[]) => Promise<void>;
  onCommit?: (id: string, labels: any[]) => Promise<void>;
  onReviewModify?: (
    id: string,
    labels: any[],
    frameIssues?: Record<number, object>,
  ) => Promise<void>;
  onReviewAccept?: (
    id: string,
    labels: any[],
    frameIssues?: Record<number, object>,
  ) => Promise<void>;
  onReviewReject?: (
    id: string,
    labels: any[],
    frameIssues?: Record<number, object>,
  ) => Promise<void>;
  classificationOptions?: Category[];
  isInAiSession: () => boolean | ICreatingObject | undefined;
}

const useActions = ({
  mode,
  currImageItem,
  modal,
  framesData,
  drawData: editorDrawData,
  editState,
  setEditState,
  hadChangeRecord,
  categories,
  translateObject,
  flagSaved,
  onCancel,
  onSave,
  onCommit,
  onReviewModify,
  onReviewAccept,
  onReviewReject,
  classificationOptions,
  isInAiSession,
}: IProps) => {
  const { localeText } = useLocale();
  const { isRequiring } = editState;
  const setIsRequiring = (requiring: boolean) =>
    setEditState((s) => {
      s.isRequiring = requiring;
    });

  const translateDrawData = useCallback(
    (drawData: DrawData): [string, any[], any] => {
      let objectList = [];
      if (framesData) {
        objectList = framesData.objects.map((objs) => {
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
        framesData ? { [framesData.activeIndex]: {} } : undefined,
      ];
    },
    [currImageItem, translateObject, framesData],
  );

  const judgeLimitCommit = (labels: any[]) => {
    const errorList: string[] = [];
    // check classification
    classificationOptions?.forEach((item, idx) => {
      const value = labels.find((label) => label.labelId === item.id);
      if (!value || isRequiredAttributeValueEmpty(value.labelValue)) {
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
            isRequiredAttributeValueEmpty(item.attributes?.[index]),
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
    if (isRequiring || !onSave || isInAiSession()) return;

    const [id, labels] = translateDrawData(editorDrawData);
    console.log('>>> save', id, labels);
    if (judgeLimitCommit(labels)) return;

    setIsRequiring(true);
    try {
      await onSave(id, labels);
      flagSaved?.();
    } catch (error) {
      console.error(error);
    }
    setIsRequiring(false);
  };

  const onCommitAnnotations = async () => {
    if (isRequiring || !onCommit || isInAiSession()) return;

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
    onSaveAnnotations,
    onCommitAnnotations,
    onCancelAnnotations,
    onRejectAnnotations,
    onAcceptAnnotations,
    onModifyAnnotations,
  };
};

export default useActions;
