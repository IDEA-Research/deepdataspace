import { Updater } from 'use-immer';
import { useKeyPress } from 'ahooks';
import { EObjectType } from '@/constants';
import { EDITOR_SHORTCUTS, EShortcuts } from '../constants/shortcuts';
import { DrawData, EditState, EditorMode } from '../type';

interface IProps {
  visible: boolean;
  mode: EditorMode;
  drawData: DrawData;
  isMousePress: boolean;
  setDrawData: Updater<DrawData>;
  setEditState: Updater<EditState>;
  onSaveAnnotations: (drawData: DrawData) => Promise<void>;
  onAccept: () => void;
  onReject: () => void;
  onChangeObjectHidden: (index: number, hidden: boolean) => void;
  onChangeCategoryHidden: (category: string, hidden: boolean) => void;
  removeObject: (index: number) => void;
}

const useShortcuts = ({
  visible,
  mode,
  drawData,
  isMousePress,
  setDrawData,
  setEditState,
  onSaveAnnotations,
  onAccept,
  onReject,
  onChangeObjectHidden,
  onChangeCategoryHidden,
  removeObject,
}: IProps) => {
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
      const { label, hidden } = drawData.objectList[drawData.activeObjectIndex];
      onChangeCategoryHidden(label, !hidden);
    },
    {
      exactMatch: true,
    },
  );

  /** Delete Current Selected Object */
  useKeyPress(
    'EDITOR_SHORTCUTS[EShortcuts.DeleteCurrObject].shortcut',
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
    ['ctrl', 'meta'],
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

  return {};
};

export default useShortcuts;
