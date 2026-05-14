import {
  getBubbleClassName,
  getCanvasConnectorClassName,
  getCanvasStageClassName,
  getPanelClassName,
  getStripGapClassName,
} from './class-names';
import { getThoughtTailDots, resolveBubbleStyle } from './bubble-style';
import { normalizePanelGapColor } from '@shared/project-state';
import { getCanvasPanels } from './canvas-state';
import { CANVAS_WIDTH } from './constants';
import type { StudioState } from './types';

const buildDynamicStyles = (state: StudioState): string => {
  const rules = [
    [
      `.${getCanvasConnectorClassName()}{`,
      'background:var(--bg-canvas);',
      '}',
    ].join(''),
    `.${getStripGapClassName(state.panelGap)}{gap:${state.panelGap}px}`,
  ];

  state.canvases.forEach((canvas, index) => {
    const backgroundColor = normalizePanelGapColor(canvas.backgroundColor);
    rules.push(
      [
        `.${getCanvasStageClassName(canvas)}{`,
        `aspect-ratio:${CANVAS_WIDTH}/${canvas.height};`,
        `background-color:${backgroundColor};`,
        '}',
      ].join(''),
    );

    if (index > 0) {
      const previousCanvas = state.canvases[index - 1];
      const previousColor = normalizePanelGapColor(
        previousCanvas?.backgroundColor,
      );

      rules.push(
        [
          `.${getCanvasConnectorClassName(index)}{`,
          `background:linear-gradient(180deg,${previousColor} 0%,${backgroundColor} 100%);`,
          '}',
        ].join(''),
      );
    }

    getCanvasPanels(state, canvas.id).forEach((panel) => {
      const left = (panel.x / CANVAS_WIDTH) * 100;
      const top = (panel.y / canvas.height) * 100;
      const width = (panel.width / CANVAS_WIDTH) * 100;
      const height = (panel.height / canvas.height) * 100;

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
        const style = resolveBubbleStyle(bubble);
        const strokeDasharray =
          style.borderStyle === 'dashed'
            ? '10 7'
            : style.borderStyle === 'dotted'
              ? '2 6'
              : 'none';
        const left = ((panel.x + bubble.x) / CANVAS_WIDTH) * 100;
        const top = ((panel.y + bubble.y) / canvas.height) * 100;
        const width = (bubble.width / CANVAS_WIDTH) * 100;
        const height = (bubble.height / canvas.height) * 100;
        const viewportSize = (bubble.fontSize / CANVAS_WIDTH) * 100;
        const thoughtTailDots = getThoughtTailDots(bubble);

        rules.push(
          [
            `.${getBubbleClassName(panel, bubble)}{`,
            `left:${left}%;`,
            `top:${top}%;`,
            `width:${width}%;`,
            `height:${height}%;`,
            `font-size:clamp(12px,${viewportSize}vw,${bubble.fontSize}px);`,
            `--bubble-fill:${style.fillColor};`,
            `--bubble-text:${style.textColor};`,
            `--bubble-border:${style.borderColor};`,
            `--bubble-border-width:${style.borderWidth}px;`,
            `--bubble-border-style:${style.borderStyle};`,
            `--bubble-stroke-dasharray:${strokeDasharray};`,
            `--bubble-radius:${style.borderRadius};`,
            `--bubble-radius-tl:${style.radiusTopLeft}px;`,
            `--bubble-radius-tr:${style.radiusTopRight}px;`,
            `--bubble-radius-br:${style.radiusBottomRight}px;`,
            `--bubble-radius-bl:${style.radiusBottomLeft}px;`,
            `--bubble-tail-side:${style.tailSide};`,
            `--bubble-tail-position:${style.tailPosition}%;`,
            `--bubble-tail-width:${style.tailWidth}px;`,
            `--bubble-tail-height:${style.tailHeight}px;`,
            `--bubble-tail-skew:${style.tailSkew}deg;`,
            `--bubble-tail-tip-x:${style.tailTipX}%;`,
            `--bubble-tail-tip-y:${style.tailTipY}%;`,
            `--bubble-thought-tail-opacity:${thoughtTailDots ? 1 : 0};`,
            `--bubble-thought-dot-large-x:${thoughtTailDots?.large.x ?? 82}%;`,
            `--bubble-thought-dot-large-y:${thoughtTailDots?.large.y ?? 112}%;`,
            `--bubble-thought-dot-small-x:${thoughtTailDots?.small.x ?? 89}%;`,
            `--bubble-thought-dot-small-y:${thoughtTailDots?.small.y ?? 126}%;`,
            `--bubble-font-family:${style.cssFontFamily};`,
            `--bubble-font-weight:${style.cssFontWeight};`,
            '}',
          ].join(''),
        );
      });
    });
  });

  return rules.join('\n');
};

export { buildDynamicStyles };
