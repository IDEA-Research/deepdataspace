import { useKeyPress } from 'ahooks';
import { Updater } from 'use-immer';

import { EObjectType } from '../constants';
import { EDITOR_SHORTCUTS, EShortcuts } from '../constants/shortcuts';
import {
  Category,
  DrawData,
  EditState,
  EditorMode,
  IAnnotationObject,
} from '../type';

interface IProps {
  visible: boolean;
  mode: EditorMode;
  drawData: DrawData;
  categories: Category[];
  isMousePress: boolean;
  setDrawData: Updater<DrawData>;
  setEditState: Updater<EditState>;
  onSaveAnnotations?: () => void;
  onAcceptAnnotations?: () => void;
  onRejectAnnotations?: () => void;
  onChangeObjectHidden: (index: number, hidden: boolean) => void;
  onChangeCategoryHidden: (category: string, hidden: boolean) => void;
  removeObject: (index: number) => void;
  addObject: (object: IAnnotationObject, notActive?: boolean) => void;
}

const useShortcuts = ({
  visible,
  mode,
  drawData,
  categories,
  isMousePress,
  setDrawData,
  setEditState,
  onSaveAnnotations,
  onAcceptAnnotations,
  onRejectAnnotations,
  onChangeObjectHidden,
  onChangeCategoryHidden,
  removeObject,
  addObject,
}: IProps) => {
  /** Save Results */
  useKeyPress(
    EDITOR_SHORTCUTS[EShortcuts.Save].shortcut,
    (event: KeyboardEvent) => {
      event.preventDefault();
      if (mode === EditorMode.Edit) {
        onSaveAnnotations?.();
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
      onAcceptAnnotations?.();
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
      onRejectAnnotations?.();
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
      // event.preventDefault();
      if (event.type === 'keydown' && !isMousePress) {
        setEditState((s) => {
          s.allowMove = true;
        });
      } else if (event.type === 'keyup') {
        setEditState((s) => {
          s.allowMove = false;
        });
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
              s.prompt = {};
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
      if (drawData.activeObjectIndex < 0) return;
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
      if (drawData.activeObjectIndex < 0) return;
      event.preventDefault();
      const { labelId, hidden } =
        drawData.objectList[drawData.activeObjectIndex];
      const labelName = categories.find((c) => c.id === labelId)?.name || '';
      onChangeCategoryHidden(labelName, !hidden);
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

  /** Change isCtrlPressed state */
  useKeyPress(
    ['ctrl'],
    (event: KeyboardEvent) => {
      if (drawData.activeObjectIndex > -1) return;
      setEditState((s) => {
        const targetPressed = event.type === 'keydown';
        if (s.isCtrlPressed === targetPressed) return s;
        s.isCtrlPressed = Boolean(event.type === 'keydown');
        s.focusObjectIndex = -1;
        s.foucsObjectAllIndexs = [];
      });
    },
    { events: ['keydown', 'keyup'] },
  );

  /** Hide currently creating / editing mask */
  useKeyPress(
    ['v'],
    (event: KeyboardEvent) => {
      setEditState((s) => {
        const targetPressed = event.type === 'keydown';
        if (s.hideCreatingObject === targetPressed) return s;
        s.hideCreatingObject = Boolean(event.type === 'keydown');
      });
    },
    { events: ['keydown', 'keyup'] },
  );

  /** Close manually creating polygon */
  useKeyPress(
    ['enter'],
    () => {
      if (
        !drawData.AIAnnotation &&
        drawData.creatingObject &&
        drawData.creatingObject.type === EObjectType.Polygon
      ) {
        const { polygon, type, hidden, labelId, status, color } =
          drawData.creatingObject!;
        if (polygon && polygon.group && polygon.group[0].length > 2) {
          const newObject: IAnnotationObject = {
            polygon,
            type,
            hidden,
            labelId,
            status,
            color,
          };
          addObject(newObject);
        }
      }
    },
    {
      exactMatch: true,
      events: ['keyup'],
    },
  );

  return {};
};

export default useShortcuts;
