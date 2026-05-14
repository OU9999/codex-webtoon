import type { Bubble, Panel, WebtoonCanvas } from './types';

const safeClassSegment = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '-');

const getStageClassName = (): string => 'wps-webtoon-stage';
const getCanvasStageClassName = (canvas: WebtoonCanvas): string =>
  `wps-canvas-${safeClassSegment(canvas.id)}`;
const getCanvasConnectorClassName = (index?: number): string => {
  if (typeof index !== 'number') return 'wps-canvas-connector';

  return `wps-canvas-connector-${index}`;
};
const getStripGapClassName = (gap: number): string => `wps-strip-gap-${gap}`;

const getPanelClassName = (panel: Panel): string =>
  `wps-panel-${safeClassSegment(panel.id)}`;

const getBubbleClassName = (panel: Panel, bubble: Bubble): string =>
  `wps-bubble-${safeClassSegment(panel.id)}-${safeClassSegment(bubble.id)}`;

export {
  getBubbleClassName,
  getCanvasConnectorClassName,
  getCanvasStageClassName,
  getPanelClassName,
  getStageClassName,
  getStripGapClassName,
};
