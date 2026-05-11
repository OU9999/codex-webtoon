const DEFAULT_PANEL_GAP_COLOR = '#ffffff';
const PANEL_GAP_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const normalizePanelGapColor = (value: unknown): string => {
  if (typeof value !== 'string') return DEFAULT_PANEL_GAP_COLOR;

  const color = value.trim();
  if (!PANEL_GAP_COLOR_PATTERN.test(color)) return DEFAULT_PANEL_GAP_COLOR;

  return color.toLowerCase();
};

export { DEFAULT_PANEL_GAP_COLOR, normalizePanelGapColor };
