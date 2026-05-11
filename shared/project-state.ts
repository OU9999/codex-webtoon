const DEFAULT_PANEL_GAP_COLOR = '#ffffff';
const WEBTOON_CANVAS_WIDTH = 720;
const DEFAULT_CANVAS_HEIGHT = 1440;
const MIN_CANVAS_HEIGHT = 360;
const MIN_PANEL_WIDTH = 120;
const MIN_PANEL_HEIGHT = 120;
const PANEL_GAP_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

interface PanelGeometrySource {
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
}

interface PanelGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value)) return fallback;

  return clamp(Math.round(value), min, max);
};

const normalizePanelGapColor = (value: unknown): string => {
  if (typeof value !== 'string') return DEFAULT_PANEL_GAP_COLOR;

  const color = value.trim();
  if (!PANEL_GAP_COLOR_PATTERN.test(color)) return DEFAULT_PANEL_GAP_COLOR;

  return color.toLowerCase();
};

const getStackedCanvasHeight = (
  panels: PanelGeometrySource[],
  panelGap: number,
): number => {
  const panelTotal = panels.reduce((sum, panel) => {
    const height =
      typeof panel.height === 'number' && Number.isFinite(panel.height)
        ? Math.max(MIN_PANEL_HEIGHT, panel.height)
        : MIN_PANEL_HEIGHT;
    return sum + height;
  }, 0);
  const gapTotal = Math.max(0, panels.length - 1) * Math.max(0, panelGap);
  const explicitBottom = panels.reduce((bottom, panel) => {
    if (typeof panel.y !== 'number' || !Number.isFinite(panel.y)) return bottom;

    const height =
      typeof panel.height === 'number' && Number.isFinite(panel.height)
        ? Math.max(MIN_PANEL_HEIGHT, panel.height)
        : MIN_PANEL_HEIGHT;
    return Math.max(bottom, Math.round(panel.y + height));
  }, 0);

  return Math.max(
    DEFAULT_CANVAS_HEIGHT,
    Math.round(panelTotal + gapTotal),
    explicitBottom,
  );
};

const normalizeCanvasHeight = (
  value: unknown,
  panels: PanelGeometrySource[],
  panelGap: number,
): number => {
  const stackedHeight = getStackedCanvasHeight(panels, panelGap);
  if (typeof value !== 'number') return stackedHeight;
  if (!Number.isFinite(value)) return stackedHeight;

  return Math.max(MIN_CANVAS_HEIGHT, Math.round(value));
};

const normalizePanelGeometry = (
  panel: PanelGeometrySource,
  fallbackY: number,
  canvasHeight: number,
): PanelGeometry => {
  const height = normalizeNumber(
    panel.height,
    MIN_PANEL_HEIGHT,
    MIN_PANEL_HEIGHT,
    Math.max(MIN_PANEL_HEIGHT, canvasHeight),
  );
  const width = normalizeNumber(
    panel.width,
    WEBTOON_CANVAS_WIDTH,
    MIN_PANEL_WIDTH,
    WEBTOON_CANVAS_WIDTH,
  );
  const x = normalizeNumber(
    panel.x,
    0,
    0,
    Math.max(0, WEBTOON_CANVAS_WIDTH - width),
  );
  const y = normalizeNumber(
    panel.y,
    fallbackY,
    0,
    Math.max(0, canvasHeight - height),
  );

  return { x, y, width, height };
};

export {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_PANEL_GAP_COLOR,
  MIN_CANVAS_HEIGHT,
  MIN_PANEL_HEIGHT,
  MIN_PANEL_WIDTH,
  normalizeCanvasHeight,
  normalizePanelGapColor,
  normalizePanelGeometry,
  WEBTOON_CANVAS_WIDTH,
};
export type { PanelGeometry, PanelGeometrySource };
