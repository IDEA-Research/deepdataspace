import { LineType } from '../type';

export const ANNO_FILL_ALPHA = {
  DEFAULT: 0,
  DEFAULT_SHAPE: 0.35,
  CREATING: 0,
  JUST_CREATED: 0.5,
  FOCUS: 0.6,
  CTRL_TO_SELECT: 0.1,
  OTHER: 0,
};

export const ANNO_STROKE_ALPHA = {
  DEFAULT: 1,
  CREATING: 1,
  CREATING_LINE: 0.8,
  FOCUS: 1,
  ACTIVE: 1,
  OTHER: 0.3,
};

export const ANNO_MASK_ALPHA = {
  CREATING: 0.7,
  FOCUS: 0.7,
  JUST_CREATED: 0.5,
  DEFAULT: 0.35,
};

export const ANNO_STROKE_COLOR = {
  CREATING: '#fff',
};

export const ANNO_FILL_COLOR = {
  CREATING: 'transparent',
  CREATING_POSITIVE: '#2876d4',
  CREATING_NEGATIVE: '#e91d00',
};

export const PROMPT_STROKE_COLOR = {
  POSITIVE: 'rgba(1, 128, 0, 1)',
  NEGATIVE: 'rgba(255, 3, 0, 1)',
};

export const PROMPT_FILL_COLOR = {
  POSITIVE: 'rgba(1, 128, 0, 0.6)',
  NEGATIVE: 'rgba(255, 3, 0, 0.6)',
};

export const LINE_STYLE_MAP: Record<
  LineType,
  {
    lineDash: number[];
    thickness: number;
  }
> = {
  [LineType.Solid]: {
    lineDash: [],
    thickness: 2,
  },
  [LineType.DoubleSolid]: {
    lineDash: [],
    thickness: 4,
  },
  [LineType.LCurbside]: {
    lineDash: [],
    thickness: 2,
  },
  [LineType.RCurbside]: {
    lineDash: [],
    thickness: 2,
  },
  [LineType.Unknown]: {
    lineDash: [],
    thickness: 2,
  },
  [LineType.Dashed]: {
    lineDash: [4, 4],
    thickness: 2,
  },
  [LineType.DoubleDashed]: {
    lineDash: [4, 4],
    thickness: 4,
  },
  [LineType.LDashedRSolid]: {
    lineDash: [4, 8, 4, 8, 16, 4],
    thickness: 4,
  },
  [LineType.LSolidRDashed]: {
    lineDash: [4, 8, 16, 4],
    thickness: 4,
  },
};

export const LINE_COLOR = {
  Yellow: '#d97945',
  White: '#de1760',
  Other: '#72af44',
};
