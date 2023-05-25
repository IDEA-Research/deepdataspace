export enum EShortcutType {
  Tool = 'editor.shortcuts.tools',
  GeneralAction = 'editor.shortcuts.general',
  ViewAction = 'editor.shortcuts.viewControl',
  AnnotationAction = 'editor.shortcuts.annotsControl',
}

export type TShortcutItem = {
  name: string;
  type: EShortcutType;
  shortcut: string[];
  descTextKey: string;
};

export enum EShortcuts {
  /** Tools */
  RectangleTool,
  PolygonTool,
  SkeletonTool,
  DragTool,
  /** General Actions */
  SmartAnnotation,
  Undo,
  Redo,
  NextImage,
  PreviousImage,
  Save,
  Accept,
  Reject,
  /** View Actions */
  ZoomIn,
  ZoomOut,
  Reset,
  HideCurrObject,
  HideCurrCategory,
  HideAll,
  PanImage,
  /** Annotation Actions */
  DeleteCurrObject,
  SaveCurrObject,
  CancelCurrObject,
}

export const EDITOR_SHORTCUTS: Record<EShortcuts, TShortcutItem> = {
  [EShortcuts.RectangleTool]: {
    name: 'RectangleTool',
    type: EShortcutType.Tool,
    shortcut: ['r'],
    descTextKey: 'editor.shortcuts.tools.rectangle',
  },
  [EShortcuts.PolygonTool]: {
    name: 'PolygonTool',
    type: EShortcutType.Tool,
    shortcut: ['p'],
    descTextKey: 'editor.shortcuts.tools.polygon',
  },
  [EShortcuts.SkeletonTool]: {
    name: 'SkeletonTool',
    type: EShortcutType.Tool,
    shortcut: ['s'],
    descTextKey: 'editor.shortcuts.tools.skeleton',
  },
  [EShortcuts.DragTool]: {
    name: 'DragTool',
    type: EShortcutType.Tool,
    shortcut: ['d'],
    descTextKey: 'editor.shortcuts.tools.drag',
  },
  [EShortcuts.SmartAnnotation]: {
    name: 'SmartAnnotation',
    type: EShortcutType.GeneralAction,
    shortcut: ['a'],
    descTextKey: 'editor.shortcuts.general.smart',
  },
  [EShortcuts.Undo]: {
    name: 'Undo',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.z', 'meta.z'],
    descTextKey: 'editor.shortcuts.general.undo',
  },
  [EShortcuts.Redo]: {
    name: 'Redo',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.shift.z', 'meta.shift.z'],
    descTextKey: 'editor.shortcuts.general.redo',
  },
  [EShortcuts.Save]: {
    name: 'Save',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.s', 'meta.s'],
    descTextKey: 'editor.shortcuts.general.save',
  },
  [EShortcuts.HideCurrObject]: {
    name: 'HideCurrObject',
    type: EShortcutType.ViewAction,
    shortcut: ['h'],
    descTextKey: 'editor.shortcuts.viewControl.hideCurrObject',
  },
  [EShortcuts.HideCurrCategory]: {
    name: 'HideCurrCategory',
    type: EShortcutType.ViewAction,
    shortcut: ['ctrl.h', 'meta.h'],
    descTextKey: 'editor.shortcuts.viewControl.hideCurrCategory',
  },
  [EShortcuts.HideAll]: {
    name: 'HideAll',
    type: EShortcutType.ViewAction,
    shortcut: ['ctrl.shift.h', 'meta.shift.h'],
    descTextKey: 'editor.shortcuts.viewControl.hideAll',
  },
  [EShortcuts.ZoomIn]: {
    name: 'ZoomIn',
    type: EShortcutType.ViewAction,
    shortcut: ['equalsign'],
    descTextKey: 'editor.shortcuts.viewControl.zoomIn',
  },
  [EShortcuts.ZoomOut]: {
    name: 'ZoomOut',
    type: EShortcutType.ViewAction,
    shortcut: ['dash'],
    descTextKey: 'editor.shortcuts.viewControl.zoomOut',
  },
  [EShortcuts.Reset]: {
    name: 'Reset',
    type: EShortcutType.ViewAction,
    shortcut: ['0'],
    descTextKey: 'editor.shortcuts.viewControl.zoomReset',
  },
  [EShortcuts.Accept]: {
    name: 'Accept',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.a', 'meta.a'],
    descTextKey: 'editor.shortcuts.general.accept',
  },
  [EShortcuts.Reject]: {
    name: 'Reject',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.r', 'meta.r'],
    descTextKey: 'editor.shortcuts.general.reject',
  },
  [EShortcuts.NextImage]: {
    name: 'NextImage',
    type: EShortcutType.ViewAction,
    shortcut: ['rightarrow'],
    descTextKey: 'editor.shortcuts.general.next',
  },
  [EShortcuts.PreviousImage]: {
    name: 'PreviousImage',
    type: EShortcutType.ViewAction,
    shortcut: ['leftarrow'],
    descTextKey: 'editor.shortcuts.general.prev',
  },
  [EShortcuts.PanImage]: {
    name: 'PanImage',
    type: EShortcutType.ViewAction,
    shortcut: ['Space'],
    descTextKey: 'editor.shortcuts.viewControl.panImage',
  },
  [EShortcuts.SaveCurrObject]: {
    name: 'SaveCurrObject',
    type: EShortcutType.AnnotationAction,
    shortcut: ['enter'],
    descTextKey: 'editor.shortcuts.annotsControl.finish',
  },
  [EShortcuts.DeleteCurrObject]: {
    name: 'DeleteCurrObject',
    type: EShortcutType.AnnotationAction,
    shortcut: ['Backspace', 'Delete'],
    descTextKey: 'editor.shortcuts.annotsControl.delete',
  },
  [EShortcuts.CancelCurrObject]: {
    name: 'CancelCurrObject',
    type: EShortcutType.AnnotationAction,
    shortcut: ['esc'],
    descTextKey: 'editor.shortcuts.annotsControl.cancel',
  },
};

export const convertAliasToSymbol = (key: string) => {
  let res = key;
  switch (key) {
    case 'meta':
      res = '⌘';
      break;
    case 'shift':
      res = '⇧';
      break;
    case 'equalsign':
    case 'add':
      res = '+';
      break;
    case 'dash':
    case 'subtract':
      res = '-';
      break;
    case 'leftarrow':
      res = '←';
      break;
    case 'rightarrow':
      res = '→';
      break;
    default:
      res = key.toUpperCase();
      break;
  }
  return res;
};
