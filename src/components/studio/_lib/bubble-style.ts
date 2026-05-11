import type {
  Bubble,
  BubbleBorderStyle,
  BubbleFontFamily,
  BubbleFontWeight,
  BubbleShape,
  BubbleTailSide,
} from './types';

interface BubbleStyleValues {
  fillColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: BubbleBorderStyle;
  fontFamily: BubbleFontFamily;
  fontWeight: BubbleFontWeight;
  shape: BubbleShape;
  radiusTopLeft: number;
  radiusTopRight: number;
  radiusBottomRight: number;
  radiusBottomLeft: number;
  tailSide: BubbleTailSide;
  tailPosition: number;
  tailWidth: number;
  tailHeight: number;
  tailSkew: number;
  tailTipX: number;
  tailTipY: number;
}

interface ResolvedBubbleStyle extends BubbleStyleValues {
  borderRadius: string;
  canvasFontFamily: string;
  cssFontFamily: string;
  cssFontWeight: number;
}

interface BubbleCornerRadii {
  radiusTopLeft: number;
  radiusTopRight: number;
  radiusBottomRight: number;
  radiusBottomLeft: number;
}

interface BubbleTailPoint {
  x: number;
  y: number;
}

interface BubbleOutlineSvgPath {
  path: string;
}

const BUBBLE_BORDER_STYLE_VALUES: readonly BubbleBorderStyle[] = [
  'solid',
  'dashed',
  'dotted',
];
const BUBBLE_FONT_FAMILY_VALUES: readonly BubbleFontFamily[] = [
  'inter',
  'mono',
  'display',
  'serif',
];
const BUBBLE_FONT_WEIGHT_VALUES: readonly BubbleFontWeight[] = [
  'regular',
  'medium',
  'bold',
  'black',
];
const BUBBLE_SHAPE_VALUES: readonly BubbleShape[] = [
  'rounded',
  'pill',
  'cloud',
  'square',
  'sharp',
  'rough',
  'burst',
  'custom',
];
const BUBBLE_TAIL_SIDE_VALUES: readonly BubbleTailSide[] = [
  'none',
  'top',
  'right',
  'bottom',
  'left',
];

const DEFAULT_BUBBLE_STYLE: BubbleStyleValues = {
  fillColor: '#ffffff',
  textColor: '#1a1f30',
  borderColor: '#1a1f30',
  borderWidth: 1.5,
  borderStyle: 'solid',
  fontFamily: 'inter',
  fontWeight: 'bold',
  shape: 'rounded',
  radiusTopLeft: 18,
  radiusTopRight: 18,
  radiusBottomRight: 18,
  radiusBottomLeft: 18,
  tailSide: 'bottom',
  tailPosition: 68,
  tailWidth: 32,
  tailHeight: 28,
  tailSkew: 16,
  tailTipX: 78,
  tailTipY: 136,
};

const CSS_FONT_FAMILIES: Record<BubbleFontFamily, string> = {
  inter: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  display: 'var(--font-display)',
  serif: "Georgia, 'Times New Roman', serif",
};

const CANVAS_FONT_FAMILIES: Record<BubbleFontFamily, string> = {
  inter: 'Inter, Arial, sans-serif',
  mono: 'IBM Plex Mono, monospace',
  display: 'Bagel Fat One, Inter, Arial, sans-serif',
  serif: 'Georgia, Times New Roman, serif',
};

const CSS_FONT_WEIGHTS: Record<BubbleFontWeight, number> = {
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900,
};

const SHAPE_CORNER_RADII: Record<BubbleShape, BubbleCornerRadii> = {
  rounded: {
    radiusTopLeft: 18,
    radiusTopRight: 18,
    radiusBottomRight: 18,
    radiusBottomLeft: 18,
  },
  pill: {
    radiusTopLeft: 48,
    radiusTopRight: 48,
    radiusBottomRight: 48,
    radiusBottomLeft: 48,
  },
  cloud: {
    radiusTopLeft: 34,
    radiusTopRight: 42,
    radiusBottomRight: 36,
    radiusBottomLeft: 44,
  },
  square: {
    radiusTopLeft: 6,
    radiusTopRight: 6,
    radiusBottomRight: 6,
    radiusBottomLeft: 6,
  },
  sharp: {
    radiusTopLeft: 0,
    radiusTopRight: 0,
    radiusBottomRight: 0,
    radiusBottomLeft: 0,
  },
  rough: {
    radiusTopLeft: 14,
    radiusTopRight: 24,
    radiusBottomRight: 18,
    radiusBottomLeft: 30,
  },
  burst: {
    radiusTopLeft: 2,
    radiusTopRight: 2,
    radiusBottomRight: 2,
    radiusBottomLeft: 2,
  },
  custom: {
    radiusTopLeft: 18,
    radiusTopRight: 18,
    radiusBottomRight: 18,
    radiusBottomLeft: 18,
  },
};

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const isHexColor = (value: unknown): value is string => {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
};

const normalizeColor = (value: unknown, fallback: string): string => {
  if (!isHexColor(value)) return fallback;
  return value.toLowerCase();
};

const normalizeNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

const includesValue = <Value extends string>(
  values: readonly Value[],
  value: unknown,
): value is Value => {
  return typeof value === 'string' && values.includes(value as Value);
};

const toPercentX = (value: number, bubble: Bubble): number => {
  if (bubble.width <= 0) return 0;
  return (value / bubble.width) * 100;
};

const toPercentY = (value: number, bubble: Bubble): number => {
  if (bubble.height <= 0) return 0;
  return (value / bubble.height) * 100;
};

const fitTailBase = (
  center: number,
  halfBase: number,
  min: number,
  max: number,
): [number, number] => {
  if (max <= min) return [center - halfBase, center + halfBase];

  const width = Math.min(halfBase * 2, max - min);
  const fittedCenter = normalizeNumber(center, (min + max) / 2, min, max);
  let start = fittedCenter - width / 2;
  let end = fittedCenter + width / 2;

  if (start < min) {
    end += min - start;
    start = min;
  }

  if (end > max) {
    start -= end - max;
    end = max;
  }

  return [start, end];
};

const appendTailPath = (
  commands: string[],
  first: BubbleTailPoint,
  second: BubbleTailPoint,
  tip: BubbleTailPoint,
  side: BubbleTailSide,
): void => {
  const baseSpan = Math.hypot(second.x - first.x, second.y - first.y);
  const blend = Math.min(10, Math.max(3, baseSpan * 0.24));
  const tipPull = 0.28;
  let firstControl: BubbleTailPoint;
  let firstTipControl: BubbleTailPoint;
  let secondTipControl: BubbleTailPoint;
  let secondControl: BubbleTailPoint;

  if (side === 'top') {
    firstControl = { x: first.x + blend, y: first.y };
    firstTipControl = {
      x: tip.x + (first.x - tip.x) * tipPull,
      y: tip.y + 4,
    };
    secondTipControl = {
      x: tip.x + (second.x - tip.x) * tipPull,
      y: tip.y + 4,
    };
    secondControl = { x: second.x - blend, y: second.y };
  } else if (side === 'right') {
    firstControl = { x: first.x, y: first.y + blend };
    firstTipControl = {
      x: tip.x - 4,
      y: tip.y + (first.y - tip.y) * tipPull,
    };
    secondTipControl = {
      x: tip.x - 4,
      y: tip.y + (second.y - tip.y) * tipPull,
    };
    secondControl = { x: second.x, y: second.y - blend };
  } else if (side === 'left') {
    firstControl = { x: first.x, y: first.y - blend };
    firstTipControl = {
      x: tip.x + 4,
      y: tip.y + (first.y - tip.y) * tipPull,
    };
    secondTipControl = {
      x: tip.x + 4,
      y: tip.y + (second.y - tip.y) * tipPull,
    };
    secondControl = { x: second.x, y: second.y + blend };
  } else {
    firstControl = { x: first.x - blend, y: first.y };
    firstTipControl = {
      x: tip.x + (first.x - tip.x) * tipPull,
      y: tip.y - 4,
    };
    secondTipControl = {
      x: tip.x + (second.x - tip.x) * tipPull,
      y: tip.y - 4,
    };
    secondControl = { x: second.x + blend, y: second.y };
  }

  commands.push(`L ${first.x} ${first.y}`);
  commands.push(
    `C ${firstControl.x} ${firstControl.y} ${firstTipControl.x} ${firstTipControl.y} ${tip.x} ${tip.y}`,
  );
  commands.push(
    `C ${secondTipControl.x} ${secondTipControl.y} ${secondControl.x} ${secondControl.y} ${second.x} ${second.y}`,
  );
};

const resolveBubbleStyle = (bubble: Bubble): ResolvedBubbleStyle => {
  const borderStyle = includesValue(
    BUBBLE_BORDER_STYLE_VALUES,
    bubble.borderStyle,
  )
    ? bubble.borderStyle
    : DEFAULT_BUBBLE_STYLE.borderStyle;
  const fontFamily = includesValue(BUBBLE_FONT_FAMILY_VALUES, bubble.fontFamily)
    ? bubble.fontFamily
    : DEFAULT_BUBBLE_STYLE.fontFamily;
  const fontWeight = includesValue(BUBBLE_FONT_WEIGHT_VALUES, bubble.fontWeight)
    ? bubble.fontWeight
    : DEFAULT_BUBBLE_STYLE.fontWeight;
  const shape = includesValue(BUBBLE_SHAPE_VALUES, bubble.shape)
    ? bubble.shape
    : DEFAULT_BUBBLE_STYLE.shape;
  const tailSide = includesValue(BUBBLE_TAIL_SIDE_VALUES, bubble.tailSide)
    ? bubble.tailSide
    : DEFAULT_BUBBLE_STYLE.tailSide;
  const cornerRadii = SHAPE_CORNER_RADII[shape];
  const radiusTopLeft = normalizeNumber(
    bubble.radiusTopLeft,
    cornerRadii.radiusTopLeft,
    0,
    96,
  );
  const radiusTopRight = normalizeNumber(
    bubble.radiusTopRight,
    cornerRadii.radiusTopRight,
    0,
    96,
  );
  const radiusBottomRight = normalizeNumber(
    bubble.radiusBottomRight,
    cornerRadii.radiusBottomRight,
    0,
    96,
  );
  const radiusBottomLeft = normalizeNumber(
    bubble.radiusBottomLeft,
    cornerRadii.radiusBottomLeft,
    0,
    96,
  );

  return {
    fillColor: normalizeColor(bubble.fillColor, DEFAULT_BUBBLE_STYLE.fillColor),
    textColor: normalizeColor(bubble.textColor, DEFAULT_BUBBLE_STYLE.textColor),
    borderColor: normalizeColor(
      bubble.borderColor,
      DEFAULT_BUBBLE_STYLE.borderColor,
    ),
    borderWidth: normalizeNumber(
      bubble.borderWidth,
      DEFAULT_BUBBLE_STYLE.borderWidth,
      0,
      8,
    ),
    borderStyle,
    fontFamily,
    fontWeight,
    shape,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomRight,
    radiusBottomLeft,
    tailSide,
    tailPosition: normalizeNumber(
      bubble.tailPosition,
      DEFAULT_BUBBLE_STYLE.tailPosition,
      5,
      95,
    ),
    tailWidth: normalizeNumber(
      bubble.tailWidth,
      DEFAULT_BUBBLE_STYLE.tailWidth,
      10,
      96,
    ),
    tailHeight: normalizeNumber(
      bubble.tailHeight,
      DEFAULT_BUBBLE_STYLE.tailHeight,
      8,
      96,
    ),
    tailSkew: normalizeNumber(
      bubble.tailSkew,
      DEFAULT_BUBBLE_STYLE.tailSkew,
      -45,
      45,
    ),
    tailTipX: normalizeNumber(
      bubble.tailTipX,
      DEFAULT_BUBBLE_STYLE.tailTipX,
      -120,
      220,
    ),
    tailTipY: normalizeNumber(
      bubble.tailTipY,
      DEFAULT_BUBBLE_STYLE.tailTipY,
      -120,
      220,
    ),
    borderRadius: `${radiusTopLeft}px ${radiusTopRight}px ${radiusBottomRight}px ${radiusBottomLeft}px`,
    canvasFontFamily: CANVAS_FONT_FAMILIES[fontFamily],
    cssFontFamily: CSS_FONT_FAMILIES[fontFamily],
    cssFontWeight: CSS_FONT_WEIGHTS[fontWeight],
  };
};

const withDefaultBubbleStyle = (bubble: Bubble): Bubble => {
  const style = resolveBubbleStyle(bubble);

  return {
    ...bubble,
    fillColor: style.fillColor,
    textColor: style.textColor,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderStyle: style.borderStyle,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    shape: style.shape,
    radiusTopLeft: style.radiusTopLeft,
    radiusTopRight: style.radiusTopRight,
    radiusBottomRight: style.radiusBottomRight,
    radiusBottomLeft: style.radiusBottomLeft,
    tailSide: style.tailSide,
    tailPosition: style.tailPosition,
    tailWidth: style.tailWidth,
    tailHeight: style.tailHeight,
    tailSkew: style.tailSkew,
    tailTipX: style.tailTipX,
    tailTipY: style.tailTipY,
  };
};

const getBubbleShapePatch = (shape: BubbleShape): Partial<Bubble> => {
  return {
    shape,
    ...SHAPE_CORNER_RADII[shape],
  };
};

const getBubbleTailSidePatch = (tailSide: BubbleTailSide): Partial<Bubble> => {
  if (tailSide === 'top') {
    return { tailSide, tailPosition: 34, tailTipX: 22, tailTipY: -36 };
  }

  if (tailSide === 'right') {
    return { tailSide, tailPosition: 56, tailTipX: 138, tailTipY: 70 };
  }

  if (tailSide === 'left') {
    return { tailSide, tailPosition: 56, tailTipX: -38, tailTipY: 70 };
  }

  if (tailSide === 'none') {
    return { tailSide };
  }

  return { tailSide, tailPosition: 68, tailTipX: 78, tailTipY: 136 };
};

const getBubbleTailPoints = (bubble: Bubble): BubbleTailPoint[] | null => {
  if (bubble.type !== 'speech') return null;

  const style = resolveBubbleStyle(bubble);
  if (style.tailSide === 'none') return null;

  const sideIsHorizontal =
    style.tailSide === 'top' || style.tailSide === 'bottom';
  const size = sideIsHorizontal ? bubble.width : bubble.height;
  const halfBase = size > 0 ? (style.tailWidth / size) * 50 : 8;

  if (style.tailSide === 'top') {
    const [start, end] = fitTailBase(
      style.tailPosition,
      halfBase,
      toPercentX(style.radiusTopLeft, bubble) + 2,
      100 - toPercentX(style.radiusTopRight, bubble) - 2,
    );

    return [
      { x: start, y: 0 },
      { x: end, y: 0 },
      { x: style.tailTipX, y: style.tailTipY },
    ];
  }

  if (style.tailSide === 'right') {
    const [start, end] = fitTailBase(
      style.tailPosition,
      halfBase,
      toPercentY(style.radiusTopRight, bubble) + 2,
      100 - toPercentY(style.radiusBottomRight, bubble) - 2,
    );

    return [
      { x: 100, y: start },
      { x: 100, y: end },
      { x: style.tailTipX, y: style.tailTipY },
    ];
  }

  if (style.tailSide === 'left') {
    const [start, end] = fitTailBase(
      style.tailPosition,
      halfBase,
      toPercentY(style.radiusTopLeft, bubble) + 2,
      100 - toPercentY(style.radiusBottomLeft, bubble) - 2,
    );

    return [
      { x: 0, y: start },
      { x: 0, y: end },
      { x: style.tailTipX, y: style.tailTipY },
    ];
  }

  const [start, end] = fitTailBase(
    style.tailPosition,
    halfBase,
    toPercentX(style.radiusBottomLeft, bubble) + 2,
    100 - toPercentX(style.radiusBottomRight, bubble) - 2,
  );

  return [
    { x: start, y: 100 },
    { x: end, y: 100 },
    { x: style.tailTipX, y: style.tailTipY },
  ];
};

const getBubbleOutlineSvgPath = (
  bubble: Bubble,
): BubbleOutlineSvgPath | null => {
  if (bubble.type !== 'speech') return null;

  const style = resolveBubbleStyle(bubble);
  const tailPoints = getBubbleTailPoints(bubble);
  const [first, second, tip] = tailPoints ?? [];
  const hasTail = Boolean(first && second && tip);
  const topLeftX = Math.min(toPercentX(style.radiusTopLeft, bubble), 48);
  const topLeftY = Math.min(toPercentY(style.radiusTopLeft, bubble), 48);
  const topRightX = Math.min(toPercentX(style.radiusTopRight, bubble), 48);
  const topRightY = Math.min(toPercentY(style.radiusTopRight, bubble), 48);
  const bottomRightX = Math.min(
    toPercentX(style.radiusBottomRight, bubble),
    48,
  );
  const bottomRightY = Math.min(
    toPercentY(style.radiusBottomRight, bubble),
    48,
  );
  const bottomLeftX = Math.min(toPercentX(style.radiusBottomLeft, bubble), 48);
  const bottomLeftY = Math.min(toPercentY(style.radiusBottomLeft, bubble), 48);
  const commands = [`M ${topLeftX} 0`];

  if (hasTail && style.tailSide === 'top') {
    appendTailPath(commands, first, second, tip, style.tailSide);
  }

  commands.push(`L ${100 - topRightX} 0`);
  commands.push(`Q 100 0 100 ${topRightY}`);

  if (hasTail && style.tailSide === 'right') {
    appendTailPath(commands, first, second, tip, style.tailSide);
  }

  commands.push(`L 100 ${100 - bottomRightY}`);
  commands.push(`Q 100 100 ${100 - bottomRightX} 100`);

  if (hasTail && style.tailSide === 'bottom') {
    appendTailPath(commands, second, first, tip, style.tailSide);
  }

  commands.push(`L ${bottomLeftX} 100`);
  commands.push(`Q 0 100 0 ${100 - bottomLeftY}`);

  if (hasTail && style.tailSide === 'left') {
    appendTailPath(commands, second, first, tip, style.tailSide);
  }

  commands.push(`L 0 ${topLeftY}`);
  commands.push(`Q 0 0 ${topLeftX} 0`);
  commands.push('Z');

  return { path: commands.join(' ') };
};

const isBubbleBorderStyle = (value: unknown): value is BubbleBorderStyle => {
  return includesValue(BUBBLE_BORDER_STYLE_VALUES, value);
};

const isBubbleFontFamily = (value: unknown): value is BubbleFontFamily => {
  return includesValue(BUBBLE_FONT_FAMILY_VALUES, value);
};

const isBubbleFontWeight = (value: unknown): value is BubbleFontWeight => {
  return includesValue(BUBBLE_FONT_WEIGHT_VALUES, value);
};

const isBubbleShape = (value: unknown): value is BubbleShape => {
  return includesValue(BUBBLE_SHAPE_VALUES, value);
};

const isBubbleTailSide = (value: unknown): value is BubbleTailSide => {
  return includesValue(BUBBLE_TAIL_SIDE_VALUES, value);
};

export {
  BUBBLE_BORDER_STYLE_VALUES,
  BUBBLE_FONT_FAMILY_VALUES,
  BUBBLE_FONT_WEIGHT_VALUES,
  BUBBLE_SHAPE_VALUES,
  BUBBLE_TAIL_SIDE_VALUES,
  DEFAULT_BUBBLE_STYLE,
  getBubbleOutlineSvgPath,
  getBubbleShapePatch,
  getBubbleTailSidePatch,
  getBubbleTailPoints,
  isBubbleBorderStyle,
  isBubbleFontFamily,
  isBubbleFontWeight,
  isBubbleShape,
  isBubbleTailSide,
  resolveBubbleStyle,
  withDefaultBubbleStyle,
};
export type {
  BubbleOutlineSvgPath,
  BubbleStyleValues,
  BubbleTailPoint,
  ResolvedBubbleStyle,
};
