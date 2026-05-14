import { DEFAULT_CANVAS_HEIGHT } from '@shared/project-state';
import type { Panel, StudioState, WebtoonCanvas } from './types';

const getSelectedCanvas = (state: StudioState): WebtoonCanvas | null => {
  return (
    state.canvases.find((canvas) => canvas.id === state.selectedCanvasId) ??
    state.canvases[0] ??
    null
  );
};

const getCanvasPanels = (state: StudioState, canvasId: string): Panel[] => {
  return state.panels.filter((panel) => panel.canvasId === canvasId);
};

const getSelectedCanvasPanels = (state: StudioState): Panel[] => {
  const canvas = getSelectedCanvas(state);
  if (!canvas) return [];

  return getCanvasPanels(state, canvas.id);
};

const getSelectedCanvasHeight = (state: StudioState): number => {
  return getSelectedCanvas(state)?.height ?? DEFAULT_CANVAS_HEIGHT;
};

const getPanelCanvas = (
  state: StudioState,
  panel: Panel,
): WebtoonCanvas | null => {
  return (
    state.canvases.find((canvas) => canvas.id === panel.canvasId) ??
    getSelectedCanvas(state)
  );
};

const getPanelCanvasHeight = (state: StudioState, panel: Panel): number => {
  return getPanelCanvas(state, panel)?.height ?? DEFAULT_CANVAS_HEIGHT;
};

const getPanelIndexInCanvas = (panels: Panel[], panelId: string): number => {
  return panels.findIndex((panel) => panel.id === panelId);
};

export {
  getCanvasPanels,
  getPanelCanvas,
  getPanelCanvasHeight,
  getPanelIndexInCanvas,
  getSelectedCanvas,
  getSelectedCanvasHeight,
  getSelectedCanvasPanels,
};
