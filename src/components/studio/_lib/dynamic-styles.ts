import {
  getBubbleClassName,
  getPanelClassName,
  getStripGapClassName,
} from './class-names';
import { resolveBubbleStyle } from './bubble-style';
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
      const style = resolveBubbleStyle(bubble);
      const strokeDasharray =
        style.borderStyle === 'dashed'
          ? '10 7'
          : style.borderStyle === 'dotted'
            ? '2 6'
            : 'none';
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
          `--bubble-font-family:${style.cssFontFamily};`,
          `--bubble-font-weight:${style.cssFontWeight};`,
          '}',
        ].join(''),
      );
    });
  });

  return rules.join('\n');
};

export { buildDynamicStyles };
