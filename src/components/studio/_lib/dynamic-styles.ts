import {
  getBubbleClassName,
  getCanvasConnectorClassName,
  getCanvasStageClassName,
  getPanelClassName,
  getStripGapClassName,
} from './class-names';
import {
  getBubbleOutlineSvgPath,
  getThoughtTailDots,
  resolveBubbleStyle,
} from './bubble-style';
import { normalizePanelGapColor } from '@shared/project-state';
import { getCanvasPanels } from './canvas-state';
import {
  CANVAS_CONNECTOR_HEIGHT,
  CANVAS_EDGE_BLEND_HEIGHT,
  CANVAS_WIDTH,
} from './constants';
import type { StudioState } from './types';

const getEdgeBlendHeight = (height: number): number => {
  if (!Number.isFinite(height) || height <= 0) return 0;

  return Math.min(CANVAS_EDGE_BLEND_HEIGHT, height / 2);
};

const mixHexColor = (firstColor: string, secondColor: string): string => {
  const first = Number.parseInt(firstColor.slice(1), 16);
  const second = Number.parseInt(secondColor.slice(1), 16);
  const red = Math.round(((first >> 16) + (second >> 16)) / 2);
  const green = Math.round((((first >> 8) & 255) + ((second >> 8) & 255)) / 2);
  const blue = Math.round(((first & 255) + (second & 255)) / 2);
  const mixed = (red << 16) + (green << 8) + blue;

  return `#${mixed.toString(16).padStart(6, '0')}`;
};

const buildDynamicStyles = (state: StudioState): string => {
  const rules = [
    [
      `.${getCanvasConnectorClassName()}{`,
      `height:${CANVAS_CONNECTOR_HEIGHT}px;`,
      `max-width:${CANVAS_WIDTH}px;`,
      'background:transparent;',
      '}',
    ].join(''),
    `.${getStripGapClassName(state.panelGap)}{gap:${state.panelGap}px}`,
  ];

  state.canvases.forEach((canvas, index) => {
    const previousCanvas = state.canvases[index - 1] ?? null;
    const nextCanvas = state.canvases[index + 1] ?? null;
    const backgroundColor = normalizePanelGapColor(canvas.backgroundColor);
    const edgeBlendHeight = getEdgeBlendHeight(canvas.height);
    const backgroundImages: string[] = [];
    const backgroundSizes: string[] = [];
    const backgroundPositions: string[] = [];
    const backgroundRepeats: string[] = [];

    if (previousCanvas && edgeBlendHeight > 0) {
      const previousColor = normalizePanelGapColor(
        previousCanvas.backgroundColor,
      );
      const midpointColor = mixHexColor(previousColor, backgroundColor);
      backgroundImages.push(
        `linear-gradient(180deg,${midpointColor} 0%,${backgroundColor} 100%)`,
      );
      backgroundSizes.push(`100% ${edgeBlendHeight}px`);
      backgroundPositions.push('top');
      backgroundRepeats.push('no-repeat');
    }

    if (nextCanvas && edgeBlendHeight > 0) {
      const nextColor = normalizePanelGapColor(nextCanvas.backgroundColor);
      const midpointColor = mixHexColor(backgroundColor, nextColor);
      backgroundImages.push(
        `linear-gradient(180deg,${backgroundColor} 0%,${midpointColor} 100%)`,
      );
      backgroundSizes.push(`100% ${edgeBlendHeight}px`);
      backgroundPositions.push('bottom');
      backgroundRepeats.push('no-repeat');
    }

    rules.push(
      [
        `.${getCanvasStageClassName(canvas)}{`,
        `aspect-ratio:${CANVAS_WIDTH}/${canvas.height};`,
        `background-color:${backgroundColor};`,
        backgroundImages.length > 0
          ? `background-image:${backgroundImages.join(',')};`
          : '',
        backgroundSizes.length > 0
          ? `background-size:${backgroundSizes.join(',')};`
          : '',
        backgroundPositions.length > 0
          ? `background-position:${backgroundPositions.join(',')};`
          : '',
        backgroundRepeats.length > 0
          ? `background-repeat:${backgroundRepeats.join(',')};`
          : '',
        '}',
      ].join(''),
    );

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
        const outlinePath = getBubbleOutlineSvgPath(bubble);
        const outlineStrokeWidth =
          style.borderWidth * (outlinePath?.outlineStrokeScale ?? 1);
        const decorationStrokeWidth = Math.max(
          0.6,
          style.borderWidth * (outlinePath?.decorationStrokeScale ?? 0.46),
        );

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
            `--bubble-outline-opacity:${outlinePath?.outlineOpacity ?? 1};`,
            `--bubble-outline-stroke-width:${outlineStrokeWidth}px;`,
            `--bubble-decoration-opacity:${outlinePath?.decorationOpacity ?? 1};`,
            `--bubble-decoration-stroke-width:${decorationStrokeWidth}px;`,
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
