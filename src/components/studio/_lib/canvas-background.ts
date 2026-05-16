import { normalizePanelGapColor } from '@shared/project-state';
import { CANVAS_EDGE_BLEND_HEIGHT } from './constants';

interface CanvasBackgroundStops {
  topColor: string;
  centerColor: string;
  bottomColor: string;
  edgeStartRatio: number;
  edgeEndRatio: number;
  edgeStartPercent: string;
  edgeEndPercent: string;
}

interface CanvasBackgroundOptions {
  currentColor: string;
  height: number;
  previousColor?: string | null;
  nextColor?: string | null;
}

const formatCssPercent = (value: number): string => {
  return `${Number(value.toFixed(4))}%`;
};

const getCanvasEdgeRatio = (height: number): number => {
  if (!Number.isFinite(height) || height <= 0) return 0;

  const blendHeight = Math.min(CANVAS_EDGE_BLEND_HEIGHT, height / 2);

  return blendHeight / height;
};

const getCanvasBackgroundStops = ({
  currentColor,
  height,
  previousColor,
  nextColor,
}: CanvasBackgroundOptions): CanvasBackgroundStops => {
  const centerColor = normalizePanelGapColor(currentColor);
  const edgeStartRatio = getCanvasEdgeRatio(height);
  const edgeEndRatio = 1 - edgeStartRatio;
  const topColor = previousColor
    ? normalizePanelGapColor(previousColor)
    : centerColor;
  const bottomColor = nextColor
    ? normalizePanelGapColor(nextColor)
    : centerColor;

  return {
    topColor,
    centerColor,
    bottomColor,
    edgeStartRatio,
    edgeEndRatio,
    edgeStartPercent: formatCssPercent(edgeStartRatio * 100),
    edgeEndPercent: formatCssPercent(edgeEndRatio * 100),
  };
};

export { getCanvasBackgroundStops };
