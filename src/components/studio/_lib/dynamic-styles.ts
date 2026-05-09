import {
  getBubbleClassName,
  getPanelClassName,
  getStripGapClassName,
} from './class-names';
import { CANVAS_WIDTH } from './constants';
import type { StudioState } from './types';

const buildDynamicStyles = (state: StudioState): string => {
  const rules = [
    `.${getStripGapClassName(state.panelGap)}{gap:${state.panelGap}px}`,
  ];

  state.panels.forEach((panel) => {
    rules.push(
      `.${getPanelClassName(panel)}{aspect-ratio:${CANVAS_WIDTH}/${panel.height}}`,
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
