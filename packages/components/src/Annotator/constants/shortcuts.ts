export enum EShortcutType {
  Tool = 'DDSAnnotator.shortcuts.tools',
  GeneralAction = 'DDSAnnotator.shortcuts.general',
  ViewAction = 'DDSAnnotator.shortcuts.viewControl',
  AnnotationAction = 'DDSAnnotator.shortcuts.annotsControl',
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
  MaskTool,
  /** General Actions */
  SmartAnnotation,
  Undo,
  Redo,
  RepeatPrevious,
  DeleteAll,
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
    descTextKey: 'DDSAnnotator.shortcuts.tools.rectangle',
  },
  [EShortcuts.PolygonTool]: {
    name: 'PolygonTool',
    type: EShortcutType.Tool,
    shortcut: ['p'],
    descTextKey: 'DDSAnnotator.shortcuts.tools.polygon',
  },
  [EShortcuts.SkeletonTool]: {
    name: 'SkeletonTool',
    type: EShortcutType.Tool,
    shortcut: ['s'],
    descTextKey: 'DDSAnnotator.shortcuts.tools.skeleton',
  },
  [EShortcuts.MaskTool]: {
    name: 'MaskTool',
    type: EShortcutType.Tool,
    shortcut: ['m'],
    descTextKey: 'DDSAnnotator.shortcuts.tools.mask',
  },
  [EShortcuts.DragTool]: {
    name: 'DragTool',
    type: EShortcutType.Tool,
    shortcut: ['d'],
    descTextKey: 'DDSAnnotator.shortcuts.tools.drag',
  },
  [EShortcuts.SmartAnnotation]: {
    name: 'SmartAnnotation',
    type: EShortcutType.GeneralAction,
    shortcut: ['a'],
    descTextKey: 'DDSAnnotator.shortcuts.general.smart',
  },
  [EShortcuts.Undo]: {
    name: 'Undo',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.z', 'meta.z'],
    descTextKey: 'DDSAnnotator.shortcuts.general.undo',
  },
  [EShortcuts.Redo]: {
    name: 'Redo',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.shift.z', 'meta.shift.z'],
    descTextKey: 'DDSAnnotator.shortcuts.general.redo',
  },
  [EShortcuts.RepeatPrevious]: {
    name: 'RepeatPrevious',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.r', 'meta.r'],
    descTextKey: 'DDSAnnotator.shortcuts.general.repeatPrevious',
  },
  [EShortcuts.DeleteAll]: {
    name: 'DeleteAll',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.shift.d', 'meta.shift.d'],
    descTextKey: 'DDSAnnotator.shortcuts.general.deleteAll',
  },
  [EShortcuts.Save]: {
    name: 'Save',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.s', 'meta.s'],
    descTextKey: 'DDSAnnotator.shortcuts.general.save',
  },
  [EShortcuts.HideCurrObject]: {
    name: 'HideCurrObject',
    type: EShortcutType.ViewAction,
    shortcut: ['h'],
    descTextKey: 'DDSAnnotator.shortcuts.viewControl.hideCurrObject',
  },
  [EShortcuts.HideCurrCategory]: {
    name: 'HideCurrCategory',
    type: EShortcutType.ViewAction,
    shortcut: ['ctrl.h', 'meta.h'],
    descTextKey: 'DDSAnnotator.shortcuts.viewControl.hideCurrCategory',
  },
  [EShortcuts.HideAll]: {
    name: 'HideAll',
    type: EShortcutType.ViewAction,
    shortcut: ['ctrl.shift.h', 'meta.shift.h'],
    descTextKey: 'DDSAnnotator.shortcuts.viewControl.hideAll',
  },
  [EShortcuts.ZoomIn]: {
    name: 'ZoomIn',
    type: EShortcutType.ViewAction,
    shortcut: ['equalsign'],
    descTextKey: 'DDSAnnotator.shortcuts.viewControl.zoomIn',
  },
  [EShortcuts.ZoomOut]: {
    name: 'ZoomOut',
    type: EShortcutType.ViewAction,
    shortcut: ['dash'],
    descTextKey: 'DDSAnnotator.shortcuts.viewControl.zoomOut',
  },
  [EShortcuts.Reset]: {
    name: 'Reset',
    type: EShortcutType.ViewAction,
    shortcut: ['0'],
    descTextKey: 'DDSAnnotator.shortcuts.viewControl.zoomReset',
  },
  [EShortcuts.Accept]: {
    name: 'Accept',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.a', 'meta.a'],
    descTextKey: 'DDSAnnotator.shortcuts.general.accept',
  },
  [EShortcuts.Reject]: {
    name: 'Reject',
    type: EShortcutType.GeneralAction,
    shortcut: ['ctrl.r', 'meta.r'],
    descTextKey: 'DDSAnnotator.shortcuts.general.reject',
  },
  [EShortcuts.NextImage]: {
    name: 'NextImage',
    type: EShortcutType.ViewAction,
    shortcut: ['rightarrow'],
    descTextKey: 'DDSAnnotator.shortcuts.general.next',
  },
  [EShortcuts.PreviousImage]: {
    name: 'PreviousImage',
    type: EShortcutType.ViewAction,
    shortcut: ['leftarrow'],
    descTextKey: 'DDSAnnotator.shortcuts.general.prev',
  },
  [EShortcuts.PanImage]: {
    name: 'PanImage',
    type: EShortcutType.ViewAction,
    shortcut: ['Space'],
    descTextKey: 'DDSAnnotator.shortcuts.viewControl.panImage',
  },
  [EShortcuts.SaveCurrObject]: {
    name: 'SaveCurrObject',
    type: EShortcutType.AnnotationAction,
    shortcut: ['enter'],
    descTextKey: 'DDSAnnotator.shortcuts.annotsControl.finish',
  },
  [EShortcuts.DeleteCurrObject]: {
    name: 'DeleteCurrObject',
    type: EShortcutType.AnnotationAction,
    shortcut: ['Backspace', 'Delete'],
    descTextKey: 'DDSAnnotator.shortcuts.annotsControl.delete',
  },
  [EShortcuts.CancelCurrObject]: {
    name: 'CancelCurrObject',
    type: EShortcutType.AnnotationAction,
    shortcut: ['esc'],
    descTextKey: 'DDSAnnotator.shortcuts.annotsControl.cancel',
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
