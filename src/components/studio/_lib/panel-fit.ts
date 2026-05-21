import type { Panel, PanelFitMode } from './types';

const DEFAULT_PANEL_FIT_MODE: PanelFitMode = 'cover';

const PANEL_FIT_MODES: readonly PanelFitMode[] = ['cover', 'contain', 'fill'];

/** Background painted behind `contain` letterboxing — matches the editor `bg-card`. */
const PANEL_CONTAIN_BACKGROUND = '#ffffff';

const PANEL_FIT_OBJECT_CLASS: Record<PanelFitMode, string> = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
};

const getPanelFitMode = (panel: Panel): PanelFitMode =>
  panel.fitMode ?? DEFAULT_PANEL_FIT_MODE;

const getPanelImageFitClassName = (panel: Panel): string =>
  PANEL_FIT_OBJECT_CLASS[getPanelFitMode(panel)];

export {
  DEFAULT_PANEL_FIT_MODE,
  PANEL_CONTAIN_BACKGROUND,
  PANEL_FIT_MODES,
  getPanelFitMode,
  getPanelImageFitClassName,
};
