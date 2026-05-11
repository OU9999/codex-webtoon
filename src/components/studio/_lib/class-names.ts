import type { Bubble, Panel } from './types';

const safeClassSegment = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '-');

const getStageClassName = (): string => 'wps-webtoon-stage';
const getStripGapClassName = (gap: number): string => `wps-strip-gap-${gap}`;

const getPanelClassName = (panel: Panel): string =>
  `wps-panel-${safeClassSegment(panel.id)}`;

const getBubbleClassName = (panel: Panel, bubble: Bubble): string =>
  `wps-bubble-${safeClassSegment(panel.id)}-${safeClassSegment(bubble.id)}`;

export {
  getBubbleClassName,
  getPanelClassName,
  getStageClassName,
  getStripGapClassName,
};
