import { useState } from 'react';
import { normalizePanelGapColor } from '@shared/project-state';
import {
  drawBubbleToCanvas,
  drawEmptyPanel,
  getBubbleCanvasFont,
} from '../_lib/bubble-renderer';
import { getCanvasBackgroundStops } from '../_lib/canvas-background';
import { getCanvasPanels } from '../_lib/canvas-state';
import {
  CANVAS_CONNECTOR_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_WORKSPACE_BACKGROUND_COLOR,
} from '../_lib/constants';
import { downloadBlob, loadImage } from '../_lib/file-utils';
import type { Panel, StudioState } from '../_lib/types';

const FONT_LOAD_SAMPLE_TEXT = 'Aa가나';

const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
};

const waitForCanvasFonts = async (panels: Panel[]): Promise<void> => {
  const fonts = document.fonts;
  if (!fonts) return;

  const requestedFonts = new Set<string>();
  panels.forEach((panel) => {
    panel.bubbles.forEach((bubble) => {
      requestedFonts.add(getBubbleCanvasFont(bubble));
    });
  });

  try {
    await Promise.allSettled(
      [...requestedFonts].map((font) =>
        fonts.load(font, FONT_LOAD_SAMPLE_TEXT),
      ),
    );
    await fonts.ready;
  } catch {}
};

const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;

  if (sourceRatio > targetRatio) {
    const sourceWidth = image.naturalHeight * targetRatio;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    ctx.drawImage(
      image,
      sourceX,
      0,
      sourceWidth,
      image.naturalHeight,
      x,
      y,
      width,
      height,
    );
    return;
  }

  const sourceHeight = image.naturalWidth / targetRatio;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(
    image,
    0,
    sourceY,
    image.naturalWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
};

const getExportHeight = (state: StudioState): number => {
  const canvasHeightTotal = state.canvases.reduce(
    (sum, canvas) => sum + canvas.height,
    0,
  );
  const connectorHeightTotal =
    Math.max(0, state.canvases.length - 1) * CANVAS_CONNECTOR_HEIGHT;

  return canvasHeightTotal + connectorHeightTotal;
};

const drawCanvasConnector = (
  ctx: CanvasRenderingContext2D,
  y: number,
): void => {
  ctx.fillStyle = CANVAS_WORKSPACE_BACKGROUND_COLOR;
  ctx.fillRect(0, y, CANVAS_WIDTH, CANVAS_CONNECTOR_HEIGHT);
};

const drawCanvasBackground = (
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  previousColor: string | null,
  currentColor: string,
  nextColor: string | null,
): void => {
  const stops = getCanvasBackgroundStops({
    currentColor,
    height,
    previousColor,
    nextColor,
  });
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, stops.topColor);
  gradient.addColorStop(stops.edgeStartRatio, stops.centerColor);
  gradient.addColorStop(stops.edgeEndRatio, stops.centerColor);
  gradient.addColorStop(1, stops.bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, CANVAS_WIDTH, height);
};

const useExport = (state: StudioState) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleWebtoonPngExport = async (): Promise<void> => {
    setIsExporting(true);

    try {
      await waitForCanvasFonts(state.panels);

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = getExportHeight(state);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let canvasOffsetY = 0;

      for (const [canvasIndex, projectCanvas] of state.canvases.entries()) {
        const previousCanvas = state.canvases[canvasIndex - 1] ?? null;
        const nextCanvas = state.canvases[canvasIndex + 1] ?? null;
        const canvasBackgroundColor = normalizePanelGapColor(
          projectCanvas.backgroundColor,
        );
        const previousBackgroundColor = previousCanvas
          ? normalizePanelGapColor(previousCanvas.backgroundColor)
          : null;
        const nextBackgroundColor = nextCanvas
          ? normalizePanelGapColor(nextCanvas.backgroundColor)
          : null;
        if (canvasIndex > 0) {
          drawCanvasConnector(ctx, canvasOffsetY);
          canvasOffsetY += CANVAS_CONNECTOR_HEIGHT;
        }

        drawCanvasBackground(
          ctx,
          canvasOffsetY,
          projectCanvas.height,
          previousBackgroundColor,
          canvasBackgroundColor,
          nextBackgroundColor,
        );

        for (const panel of getCanvasPanels(state, projectCanvas.id)) {
          const panelY = canvasOffsetY + panel.y;
          const candidate = panel.candidates.find(
            (item) => item.id === panel.selectedCandidateId,
          );
          if (candidate?.imageUrl) {
            try {
              const image = await loadImage(candidate.imageUrl);
              ctx.save();
              ctx.beginPath();
              ctx.rect(panel.x, panelY, panel.width, panel.height);
              ctx.clip();
              drawImageCover(
                ctx,
                image,
                panel.x,
                panelY,
                panel.width,
                panel.height,
              );
              ctx.restore();
            } catch {
              drawEmptyPanel(ctx, panelY, panel.height, panel.x, panel.width);
            }
          } else {
            drawEmptyPanel(ctx, panelY, panel.height, panel.x, panel.width);
          }

          ctx.strokeStyle = '#1f2326';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            panel.x + 0.5,
            panelY + 0.5,
            panel.width - 1,
            panel.height - 1,
          );
          ctx.save();
          ctx.translate(panel.x, panelY);
          panel.bubbles.forEach((bubble) => drawBubbleToCanvas(ctx, bubble, 0));
          ctx.restore();
        }

        canvasOffsetY += projectCanvas.height;
      }

      const blob = await canvasToPngBlob(canvas);
      if (blob) downloadBlob(blob, `webtoon-panel-${Date.now()}.png`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleProjectJsonExport = (): void => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `webtoon-panel-project-${Date.now()}.json`);
  };

  return { handleProjectJsonExport, handleWebtoonPngExport, isExporting };
};

export { useExport };
