import {
  MIN_PANEL_HEIGHT,
  MIN_PANEL_WIDTH,
  WEBTOON_CANVAS_WIDTH,
} from '@shared/project-state';
import { clamp } from './canvas-primitives';
import type { Panel } from './types';

const clampPanelToCanvas = (panel: Panel, canvasHeight: number): Panel => {
  const width = clamp(panel.width, MIN_PANEL_WIDTH, WEBTOON_CANVAS_WIDTH);
  const height = clamp(panel.height, MIN_PANEL_HEIGHT, canvasHeight);
  const x = clamp(panel.x, 0, WEBTOON_CANVAS_WIDTH - width);
  const y = clamp(panel.y, 0, canvasHeight - height);

  return { ...panel, x, y, width, height };
};

export { clampPanelToCanvas };
