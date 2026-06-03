import type { Bubble, Panel, WebtoonCanvas } from './types';

const safeClassSegment = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '-');

const getStageClassName = (): string => 'codex-webtoon-stage';
const getCanvasStageClassName = (canvas: WebtoonCanvas): string =>
  `codex-webtoon-canvas-${safeClassSegment(canvas.id)}`;
const getCanvasConnectorClassName = (index?: number): string => {
  if (typeof index !== 'number') return 'codex-webtoon-canvas-connector';

  return `codex-webtoon-canvas-connector-${index}`;
};
const getStripGapClassName = (gap: number): string =>
  `codex-webtoon-strip-gap-${gap}`;

const getPanelClassName = (panel: Panel): string =>
  `codex-webtoon-panel-${safeClassSegment(panel.id)}`;

const getBubbleClassName = (panel: Panel, bubble: Bubble): string =>
  `codex-webtoon-bubble-${safeClassSegment(panel.id)}-${safeClassSegment(
    bubble.id,
  )}`;

export {
  getBubbleClassName,
  getCanvasConnectorClassName,
  getCanvasStageClassName,
  getPanelClassName,
  getStageClassName,
  getStripGapClassName,
};
