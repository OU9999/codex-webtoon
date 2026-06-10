import {
  DEFAULT_BUBBLE_STYLE,
  getBubbleOutlineSvgPath,
  getThoughtTailDots,
  resolveBubbleStyle,
} from '../../_lib/bubble-style';
import type { Bubble, BubbleType, LayerAction } from '../../_lib/types';

interface BubbleActionPreviewIconProps {
  action: LayerAction;
}

interface PreviewSize {
  width: number;
  height: number;
}

const PREVIEW_BUBBLE_DEFAULTS: Record<
  BubbleType,
  Omit<Bubble, 'id' | 'type'>
> = {
  speech: {
    text: '',
    x: 58,
    y: 40,
    width: 210,
    height: 74,
    fontSize: 24,
  },
  monologue: {
    text: '',
    x: 46,
    y: 56,
    width: 250,
    height: 78,
    fontSize: 22,
  },
  thought: {
    text: '',
    x: 390,
    y: 54,
    width: 210,
    height: 76,
    fontSize: 22,
    borderStyle: 'dashed',
  },
  sfx: {
    text: '',
    x: 420,
    y: 170,
    width: 150,
    height: 82,
    fontSize: 48,
    borderWidth: 0,
    fontFamily: 'display',
    fontWeight: 'bold',
  },
};

const getPreviewBubble = (action: LayerAction): Bubble => {
  return {
    id: action.id,
    type: action.type,
    ...DEFAULT_BUBBLE_STYLE,
    ...PREVIEW_BUBBLE_DEFAULTS[action.type],
    ...action.patch,
    text: '',
    x: 0,
    y: 0,
  };
};

const getPreviewSize = (bubble: Bubble): PreviewSize => {
  const maxWidth = 30;
  const maxHeight = 21;
  const scale = Math.min(maxWidth / bubble.width, maxHeight / bubble.height);

  return {
    width: Math.round(bubble.width * scale * 10) / 10,
    height: Math.round(bubble.height * scale * 10) / 10,
  };
};

const getStrokeDasharray = (borderStyle: Bubble['borderStyle']): string => {
  if (borderStyle === 'dashed') return '4 3';
  if (borderStyle === 'dotted') return '1 3';

  return 'none';
};

const BubbleActionPreviewIcon = ({ action }: BubbleActionPreviewIconProps) => {
  const bubble = getPreviewBubble(action);
  const style = resolveBubbleStyle(bubble);
  const outlinePath = getBubbleOutlineSvgPath(bubble);
  const thoughtTailDots = getThoughtTailDots(bubble);
  const previewSize = getPreviewSize(bubble);

  if (!outlinePath) {
    return (
      <span
        className="text-fg flex h-[22px] w-8 shrink-0 items-center justify-center font-display text-[14px] leading-none font-bold italic"
        aria-hidden="true"
      >
        FX
      </span>
    );
  }

  const outlineStrokeWidth =
    style.borderWidth * (outlinePath.outlineStrokeScale ?? 1);
  const decorationStrokeWidth = Math.max(
    0.6,
    style.borderWidth * (outlinePath.decorationStrokeScale ?? 0.46),
  );
  const largeDotRadiusX = (16 / bubble.width) * 50;
  const largeDotRadiusY = (16 / bubble.height) * 50;
  const smallDotRadiusX = (8 / bubble.width) * 50;
  const smallDotRadiusY = (8 / bubble.height) * 50;

  return (
    <span
      className="text-fg flex h-[22px] w-8 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <svg
        width={previewSize.width}
        height={previewSize.height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="size-auto overflow-visible"
        focusable="false"
      >
        <path
          d={outlinePath.path}
          fill={style.fillColor}
          stroke={style.borderColor}
          strokeWidth={outlineStrokeWidth}
          strokeDasharray={getStrokeDasharray(style.borderStyle)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={outlinePath.outlineOpacity ?? 1}
          vectorEffect="non-scaling-stroke"
        />
        {outlinePath.decorationPath && (
          <path
            d={outlinePath.decorationPath}
            fill="none"
            stroke={style.borderColor}
            strokeWidth={decorationStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={outlinePath.decorationOpacity ?? 1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {thoughtTailDots && (
          <g>
            <ellipse
              cx={thoughtTailDots.large.x}
              cy={thoughtTailDots.large.y}
              rx={largeDotRadiusX}
              ry={largeDotRadiusY}
              fill={style.fillColor}
              stroke={style.borderColor}
              strokeWidth={style.borderWidth}
              strokeDasharray={getStrokeDasharray(style.borderStyle)}
              vectorEffect="non-scaling-stroke"
            />
            <ellipse
              cx={thoughtTailDots.small.x}
              cy={thoughtTailDots.small.y}
              rx={smallDotRadiusX}
              ry={smallDotRadiusY}
              fill={style.fillColor}
              stroke={style.borderColor}
              strokeWidth={style.borderWidth}
              strokeDasharray={getStrokeDasharray(style.borderStyle)}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
      </svg>
    </span>
  );
};

export { BubbleActionPreviewIcon };
