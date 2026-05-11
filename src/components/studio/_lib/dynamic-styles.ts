import {
  getBubbleClassName,
  getPanelClassName,
  getStageClassName,
  getStripGapClassName,
} from './class-names';
import { normalizePanelGapColor } from '@shared/project-state';
import { CANVAS_WIDTH } from './constants';
import type { StudioState } from './types';

const buildDynamicStyles = (state: StudioState): string => {
  const panelGapColor = normalizePanelGapColor(state.panelGapColor);
  const rules = [
    [
      `.${getStageClassName()}{`,
      `aspect-ratio:${CANVAS_WIDTH}/${state.canvasHeight};`,
      `background-color:${panelGapColor};`,
      '}',
    ].join(''),
    `.${getStripGapClassName(state.panelGap)}{gap:${state.panelGap}px}`,
  ];

  state.panels.forEach((panel) => {
    const left = (panel.x / CANVAS_WIDTH) * 100;
    const top = (panel.y / state.canvasHeight) * 100;
    const width = (panel.width / CANVAS_WIDTH) * 100;
    const height = (panel.height / state.canvasHeight) * 100;

    rules.push(
      [
        `.${getPanelClassName(panel)}{`,
        `left:${left}%;`,
        `top:${top}%;`,
        `width:${width}%;`,
        `height:${height}%;`,
        '}',
      ].join(''),
    );

    panel.bubbles.forEach((bubble) => {
      const left = (bubble.x / CANVAS_WIDTH) * 100;
      const top = (bubble.y / panel.height) * 100;
      const width = (bubble.width / CANVAS_WIDTH) * 100;
      const height = (bubble.height / panel.height) * 100;
      const viewportSize = (bubble.fontSize / CANVAS_WIDTH) * 100;

      rules.push(
        [
          `.${getBubbleClassName(panel, bubble)}{`,
          `left:${left}%;`,
          `top:${top}%;`,
          `width:${width}%;`,
          `height:${height}%;`,
          `font-size:clamp(12px,${viewportSize}vw,${bubble.fontSize}px);`,
          '}',
        ].join(''),
      );
    });
  });

  return rules.join('\n');
};

export { buildDynamicStyles };
