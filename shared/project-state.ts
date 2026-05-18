const DEFAULT_PANEL_GAP_COLOR = '#ffffff';
const DEFAULT_CANVAS_ID = 'default-canvas';
const DEFAULT_CANVAS_TITLE = 'Canvas 1';
const WEBTOON_CANVAS_WIDTH = 720;
const DEFAULT_CANVAS_HEIGHT = 1440;
const MIN_CANVAS_HEIGHT = 360;
const MIN_PANEL_WIDTH = 120;
const MIN_PANEL_HEIGHT = 120;
const PANEL_GAP_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const CANVAS_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;

interface PanelGeometrySource {
  id?: unknown;
  canvasId?: unknown;
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
}

interface ProjectCanvasSource {
  id?: unknown;
  title?: unknown;
  height?: unknown;
  commonPrompt?: unknown;
  backgroundColor?: unknown;
}

interface PanelGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProjectCanvas {
  id: string;
  title: string;
  height: number;
  commonPrompt: string;
  backgroundColor: string;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getObjectRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;

  return value as Record<string, unknown>;
};

const normalizeNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const normalizedFallback = clamp(Math.round(fallback), min, max);
  if (typeof value !== 'number') return normalizedFallback;
  if (!Number.isFinite(value)) return normalizedFallback;

  return clamp(Math.round(value), min, max);
};

const normalizePanelGapColor = (value: unknown): string => {
  if (typeof value !== 'string') return DEFAULT_PANEL_GAP_COLOR;

  const color = value.trim();
  if (!PANEL_GAP_COLOR_PATTERN.test(color)) return DEFAULT_PANEL_GAP_COLOR;

  return color.toLowerCase();
};

const getFallbackCanvasId = (index: number): string => {
  if (index === 0) return DEFAULT_CANVAS_ID;

  return `canvas-${index + 1}`;
};

const normalizeCanvasId = (
  value: unknown,
  index: number,
  usedIds: Set<string>,
): string => {
  const raw = typeof value === 'string' ? value.trim() : '';
  const base = CANVAS_ID_PATTERN.test(raw) ? raw : getFallbackCanvasId(index);
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  usedIds.add(candidate);
  return candidate;
};

const normalizeCanvasTitle = (value: unknown, index: number): string => {
  if (typeof value !== 'string') return `Canvas ${index + 1}`;

  const title = value.trim();
  if (!title) return `Canvas ${index + 1}`;

  return title.slice(0, 80);
};

const normalizeCanvasCommonPrompt = (value: unknown): string => {
  if (typeof value !== 'string') return '';

  return value;
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

const getNormalizedPanelCanvasId = (
  panel: PanelGeometrySource,
  validCanvasIds: Set<string>,
  fallbackCanvasId: string,
): string => {
  const canvasId = typeof panel.canvasId === 'string' ? panel.canvasId : '';
  if (validCanvasIds.has(canvasId)) return canvasId;

  return fallbackCanvasId;
};

const normalizeProjectCanvases = (
  value: unknown,
  panels: PanelGeometrySource[],
  panelGap: number,
  legacyCanvasHeight: unknown,
  legacyCanvasBackgroundColor: unknown = DEFAULT_PANEL_GAP_COLOR,
): ProjectCanvas[] => {
  const rawCanvases =
    Array.isArray(value) && value.length > 0
      ? value
      : [
          {
            id: DEFAULT_CANVAS_ID,
            title: DEFAULT_CANVAS_TITLE,
            height: legacyCanvasHeight,
            commonPrompt: '',
            backgroundColor: legacyCanvasBackgroundColor,
          },
        ];
  const usedIds = new Set<string>();
  const normalizedSources = rawCanvases.map((canvas, index) => {
    const record = getObjectRecord(canvas);

    return {
      id: normalizeCanvasId(record?.id, index, usedIds),
      title: normalizeCanvasTitle(record?.title, index),
      height: record?.height,
      commonPrompt: normalizeCanvasCommonPrompt(record?.commonPrompt),
      backgroundColor: normalizePanelGapColor(
        record?.backgroundColor ?? legacyCanvasBackgroundColor,
      ),
    };
  });
  const validCanvasIds = new Set(normalizedSources.map((canvas) => canvas.id));
  const fallbackCanvasId = normalizedSources[0]?.id ?? DEFAULT_CANVAS_ID;

  return normalizedSources.map((canvas) => {
    const canvasPanels = panels.filter(
      (panel) =>
        getNormalizedPanelCanvasId(panel, validCanvasIds, fallbackCanvasId) ===
        canvas.id,
    );

    return {
      ...canvas,
      height: normalizeCanvasHeight(canvas.height, canvasPanels, panelGap),
    };
  });
};

const normalizeSelectedCanvasId = (
  value: unknown,
  canvases: ProjectCanvas[],
  panels: PanelGeometrySource[],
  selectedPanelId: string | null,
): string => {
  const validCanvasIds = new Set(canvases.map((canvas) => canvas.id));
  if (typeof value === 'string' && validCanvasIds.has(value)) return value;

  const fallbackCanvasId = canvases[0]?.id ?? DEFAULT_CANVAS_ID;
  const selectedPanel = panels.find((panel) => panel.id === selectedPanelId);
  if (!selectedPanel) return fallbackCanvasId;

  return getNormalizedPanelCanvasId(
    selectedPanel,
    validCanvasIds,
    fallbackCanvasId,
  );
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
  DEFAULT_CANVAS_ID,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_TITLE,
  DEFAULT_PANEL_GAP_COLOR,
  MIN_CANVAS_HEIGHT,
  MIN_PANEL_HEIGHT,
  MIN_PANEL_WIDTH,
  normalizeCanvasHeight,
  normalizePanelGapColor,
  normalizePanelGeometry,
  normalizeProjectCanvases,
  normalizeSelectedCanvasId,
  getNormalizedPanelCanvasId,
  WEBTOON_CANVAS_WIDTH,
};
export type {
  PanelGeometry,
  PanelGeometrySource,
  ProjectCanvas,
  ProjectCanvasSource,
};
