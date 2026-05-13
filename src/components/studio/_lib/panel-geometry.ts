import {
  MIN_CANVAS_HEIGHT,
  MIN_PANEL_HEIGHT,
  MIN_PANEL_WIDTH,
  WEBTOON_CANVAS_WIDTH,
} from '@shared/project-state';
import { getBubbleTailPoints, getThoughtTailDots } from './bubble-style';
import { clamp } from './canvas-primitives';
import type { Bubble, Panel } from './types';

const getBubbleBottom = (panel: Panel, bubble: Bubble): number => {
  const bubbleTop = panel.y + bubble.y;
  let bottom = bubbleTop + bubble.height;

  const tailPoints = getBubbleTailPoints(bubble);
  if (tailPoints) {
    const tailBottom = Math.max(...tailPoints.map((point) => point.y));
    bottom = Math.max(bottom, bubbleTop + (tailBottom / 100) * bubble.height);
  }

  const thoughtTailDots = getThoughtTailDots(bubble);
  if (thoughtTailDots) {
    const dotBottom = Math.max(
      bubbleTop + (thoughtTailDots.large.y / 100) * bubble.height + 8,
      bubbleTop + (thoughtTailDots.small.y / 100) * bubble.height + 4,
    );
    bottom = Math.max(bottom, dotBottom);
  }

  return bottom;
};

const getPanelContentBottom = (panel: Panel): number => {
  const panelBottom = panel.y + panel.height;
  const bubbleBottom = panel.bubbles.reduce((bottom, bubble) => {
    return Math.max(bottom, getBubbleBottom(panel, bubble));
  }, panelBottom);

  return Math.max(panelBottom, bubbleBottom);
};

const getMinimumCanvasHeightForContent = (panels: Panel[]): number => {
  const contentBottom = panels.reduce((bottom, panel) => {
    return Math.max(bottom, getPanelContentBottom(panel));
  }, MIN_CANVAS_HEIGHT);

  return Math.ceil(Math.max(MIN_CANVAS_HEIGHT, contentBottom));
};

const clampPanelToCanvas = (panel: Panel, canvasHeight: number): Panel => {
  const width = clamp(panel.width, MIN_PANEL_WIDTH, WEBTOON_CANVAS_WIDTH);
  const height = clamp(panel.height, MIN_PANEL_HEIGHT, canvasHeight);
  const x = clamp(panel.x, 0, WEBTOON_CANVAS_WIDTH - width);
  const y = clamp(panel.y, 0, canvasHeight - height);

  return { ...panel, x, y, width, height };
};

export { clampPanelToCanvas, getMinimumCanvasHeightForContent };
