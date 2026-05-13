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

interface ThoughtTailDots {
  large: BubbleTailPoint;
  small: BubbleTailPoint;
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
];
const BUBBLE_SHAPE_VALUES: readonly BubbleShape[] = [
  'rounded',
  'oval',
  'pill',
  'cloud',
  'square',
  'sharp',
  'rough',
  'jagged',
  'custom',
];
const BUBBLE_TAIL_SIDE_VALUES: readonly BubbleTailSide[] = [
  'none',
  'top',
  'right',
  'bottom',
  'left',
];
const BUBBLE_SHAPES_WITHOUT_TAIL: readonly BubbleShape[] = ['cloud', 'jagged'];

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
  tailPosition: 66,
  tailWidth: 28,
  tailHeight: 24,
  tailSkew: 16,
  tailTipX: 76,
  tailTipY: 126,
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
};

const SHAPE_CORNER_RADII: Record<BubbleShape, BubbleCornerRadii> = {
  rounded: {
    radiusTopLeft: 18,
    radiusTopRight: 18,
    radiusBottomRight: 18,
    radiusBottomLeft: 18,
  },
  oval: {
    radiusTopLeft: 96,
    radiusTopRight: 96,
    radiusBottomRight: 96,
    radiusBottomLeft: 96,
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
    radiusTopLeft: 0,
    radiusTopRight: 0,
    radiusBottomRight: 0,
    radiusBottomLeft: 0,
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
  jagged: {
    radiusTopLeft: 0,
    radiusTopRight: 0,
    radiusBottomRight: 0,
    radiusBottomLeft: 0,
  },
  custom: {
    radiusTopLeft: 18,
    radiusTopRight: 18,
    radiusBottomRight: 18,
    radiusBottomLeft: 18,
  },
};

const SHAPE_TAIL_PATCHES: Partial<Record<BubbleShape, Partial<Bubble>>> = {
  oval: {
    tailPosition: 66,
    tailWidth: 82,
    tailHeight: 34,
    tailTipX: 82,
    tailTipY: 134,
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

const getTailBaseBounds = (
  bubble: Bubble,
  style: ResolvedBubbleStyle,
): [number, number] => {
  if (style.shape === 'oval') return [8, 92];

  if (style.tailSide === 'top') {
    return [
      toPercentX(style.radiusTopLeft, bubble) + 2,
      100 - toPercentX(style.radiusTopRight, bubble) - 2,
    ];
  }

  if (style.tailSide === 'right') {
    return [
      toPercentY(style.radiusTopRight, bubble) + 2,
      100 - toPercentY(style.radiusBottomRight, bubble) - 2,
    ];
  }

  if (style.tailSide === 'left') {
    return [
      toPercentY(style.radiusTopLeft, bubble) + 2,
      100 - toPercentY(style.radiusBottomLeft, bubble) - 2,
    ];
  }

  return [
    toPercentX(style.radiusBottomLeft, bubble) + 2,
    100 - toPercentX(style.radiusBottomRight, bubble) - 2,
  ];
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

const getTailParts = (
  tailPoints: BubbleTailPoint[] | null,
): [BubbleTailPoint, BubbleTailPoint, BubbleTailPoint] | null => {
  const [first, second, tip] = tailPoints ?? [];
  if (!first || !second || !tip) return null;
  return [first, second, tip];
};

const pathFromPoints = (points: readonly BubbleTailPoint[]): string => {
  const [first, ...rest] = points;
  if (!first) return '';

  return [
    `M ${first.x} ${first.y}`,
    ...rest.map((point) => `L ${point.x} ${point.y}`),
    'Z',
  ].join(' ');
};

const getOvalFallbackAngle = (tailSide: BubbleTailSide): number => {
  if (tailSide === 'top') return -Math.PI / 2;
  if (tailSide === 'right') return 0;
  if (tailSide === 'left') return Math.PI;
  return Math.PI / 2;
};

const getOvalTailAngle = (style: ResolvedBubbleStyle): number => {
  const deltaX = style.tailTipX - 50;
  const deltaY = style.tailTipY - 50;

  if (Math.hypot(deltaX, deltaY) < 1) {
    return getOvalFallbackAngle(style.tailSide);
  }

  return Math.atan2(deltaY, deltaX);
};

const getOvalPointAtAngle = (angle: number): BubbleTailPoint => ({
  x: 50 + Math.cos(angle) * 50,
  y: 50 + Math.sin(angle) * 50,
});

const getOvalTailBaseDelta = (
  bubble: Bubble,
  style: ResolvedBubbleStyle,
  angle: number,
): number => {
  const radiusX = Math.max(bubble.width / 2, 1);
  const radiusY = Math.max(bubble.height / 2, 1);
  const tangentRadius = Math.hypot(
    radiusX * Math.sin(angle),
    radiusY * Math.cos(angle),
  );
  const halfBase = Math.max(style.tailWidth, 82) / 2;
  const delta = halfBase / Math.max(tangentRadius, 1);

  return Math.min(0.76, Math.max(0.34, delta));
};

const getOvalOutlinePath = (
  bubble: Bubble,
  style: ResolvedBubbleStyle,
  hasTail: boolean,
): string => {
  if (!hasTail || style.tailSide === 'none') {
    return [
      'M 50 0',
      'C 78 0 100 22 100 50',
      'C 100 78 78 100 50 100',
      'C 22 100 0 78 0 50',
      'C 0 22 22 0 50 0',
      'Z',
    ].join(' ');
  }

  const angle = getOvalTailAngle(style);
  const delta = getOvalTailBaseDelta(bubble, style, angle);
  const startAngle = angle + delta;
  let endAngle = angle - delta;
  const fullTurn = Math.PI * 2;

  while (endAngle <= startAngle) {
    endAngle += fullTurn;
  }

  const start = getOvalPointAtAngle(startAngle);
  const commands = [`M ${start.x} ${start.y}`];
  const segmentCount = 72;

  for (let index = 1; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const point = getOvalPointAtAngle(
      startAngle + (endAngle - startAngle) * progress,
    );
    commands.push(`L ${point.x} ${point.y}`);
  }

  commands.push(`L ${style.tailTipX} ${style.tailTipY}`);
  commands.push('Z');
  return commands.join(' ');
};

const getCloudOutlinePath = (): string =>
  [
    'M 18 76',
    'C 4 75 -2 58 8 48',
    'C 0 34 12 20 27 24',
    'C 32 8 54 5 63 20',
    'C 78 12 96 24 92 42',
    'C 106 50 100 72 84 74',
    'C 80 91 58 97 48 84',
    'C 38 96 18 91 18 76',
    'Z',
  ].join(' ');

const getJaggedOutlinePath = (): string =>
  pathFromPoints([
    { x: 6, y: 44 },
    { x: 18, y: 36 },
    { x: 11, y: 18 },
    { x: 31, y: 24 },
    { x: 38, y: 8 },
    { x: 51, y: 22 },
    { x: 69, y: 9 },
    { x: 72, y: 29 },
    { x: 94, y: 32 },
    { x: 80, y: 48 },
    { x: 94, y: 66 },
    { x: 73, y: 65 },
    { x: 69, y: 90 },
    { x: 52, y: 76 },
    { x: 35, y: 91 },
    { x: 32, y: 70 },
    { x: 10, y: 76 },
    { x: 20, y: 57 },
  ]);

const getRoundedRectOutlinePath = (
  bubble: Bubble,
  style: ResolvedBubbleStyle,
  tailPoints: BubbleTailPoint[] | null,
): string => {
  const tailParts = getTailParts(tailPoints);
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

  if (tailParts && style.tailSide === 'top') {
    const [first, second, tip] = tailParts;
    appendTailPath(commands, first, second, tip, style.tailSide);
  }

  commands.push(`L ${100 - topRightX} 0`);
  commands.push(`Q 100 0 100 ${topRightY}`);

  if (tailParts && style.tailSide === 'right') {
    const [first, second, tip] = tailParts;
    appendTailPath(commands, first, second, tip, style.tailSide);
  }

  commands.push(`L 100 ${100 - bottomRightY}`);
  commands.push(`Q 100 100 ${100 - bottomRightX} 100`);

  if (tailParts && style.tailSide === 'bottom') {
    const [first, second, tip] = tailParts;
    appendTailPath(commands, second, first, tip, style.tailSide);
  }

  commands.push(`L ${bottomLeftX} 100`);
  commands.push(`Q 0 100 0 ${100 - bottomLeftY}`);

  if (tailParts && style.tailSide === 'left') {
    const [first, second, tip] = tailParts;
    appendTailPath(commands, second, first, tip, style.tailSide);
  }

  commands.push(`L 0 ${topLeftY}`);
  commands.push(`Q 0 0 ${topLeftX} 0`);
  commands.push('Z');

  return commands.join(' ');
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

const getThoughtTailAnchor = (
  tailSide: BubbleTailSide,
  tailPosition: number,
): BubbleTailPoint | null => {
  if (tailSide === 'top') return { x: tailPosition, y: 0 };
  if (tailSide === 'right') return { x: 100, y: tailPosition };
  if (tailSide === 'bottom') return { x: tailPosition, y: 100 };
  if (tailSide === 'left') return { x: 0, y: tailPosition };
  return null;
};

const interpolateTailPoint = (
  anchor: BubbleTailPoint,
  tip: BubbleTailPoint,
  progress: number,
): BubbleTailPoint => ({
  x: anchor.x + (tip.x - anchor.x) * progress,
  y: anchor.y + (tip.y - anchor.y) * progress,
});

const getThoughtTailDots = (bubble: Bubble): ThoughtTailDots | null => {
  if (bubble.type !== 'thought') return null;

  const style = resolveBubbleStyle(bubble);
  const anchor = getThoughtTailAnchor(style.tailSide, style.tailPosition);
  if (!anchor) return null;

  const tip = { x: style.tailTipX, y: style.tailTipY };
  return {
    large: interpolateTailPoint(anchor, tip, 0.42),
    small: interpolateTailPoint(anchor, tip, 0.78),
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
    ...SHAPE_TAIL_PATCHES[shape],
  };
};

const getBubbleTailSidePatch = (tailSide: BubbleTailSide): Partial<Bubble> => {
  if (tailSide === 'top') {
    return { tailSide, tailPosition: 34, tailTipX: 24, tailTipY: -28 };
  }

  if (tailSide === 'right') {
    return { tailSide, tailPosition: 56, tailTipX: 126, tailTipY: 68 };
  }

  if (tailSide === 'left') {
    return { tailSide, tailPosition: 56, tailTipX: -26, tailTipY: 68 };
  }

  if (tailSide === 'none') {
    return { tailSide };
  }

  return { tailSide, tailPosition: 66, tailTipX: 76, tailTipY: 126 };
};

const getBubbleTailPoints = (bubble: Bubble): BubbleTailPoint[] | null => {
  if (bubble.type !== 'speech' && bubble.type !== 'thought') return null;

  const style = resolveBubbleStyle(bubble);
  if (BUBBLE_SHAPES_WITHOUT_TAIL.includes(style.shape)) return null;
  if (style.tailSide === 'none') return null;

  const sideIsHorizontal =
    style.tailSide === 'top' || style.tailSide === 'bottom';
  const size = sideIsHorizontal ? bubble.width : bubble.height;
  const minimumTailWidth = style.shape === 'oval' ? 82 : 0;
  const tailWidth = Math.max(style.tailWidth, minimumTailWidth);
  const halfBase = size > 0 ? (tailWidth / size) * 50 : 8;
  const [minBase, maxBase] = getTailBaseBounds(bubble, style);

  if (style.tailSide === 'top') {
    const [start, end] = fitTailBase(
      style.tailPosition,
      halfBase,
      minBase,
      maxBase,
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
      minBase,
      maxBase,
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
      minBase,
      maxBase,
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
    minBase,
    maxBase,
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
  if (bubble.type === 'sfx') return null;

  const style = resolveBubbleStyle(bubble);
  const tailPoints =
    bubble.type === 'thought' ? null : getBubbleTailPoints(bubble);
  if (style.shape === 'oval') {
    return { path: getOvalOutlinePath(bubble, style, Boolean(tailPoints)) };
  }

  if (style.shape === 'cloud') {
    return { path: getCloudOutlinePath() };
  }

  if (style.shape === 'jagged') {
    return { path: getJaggedOutlinePath() };
  }

  return { path: getRoundedRectOutlinePath(bubble, style, tailPoints) };
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
  getThoughtTailDots,
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
  ThoughtTailDots,
  ResolvedBubbleStyle,
};
