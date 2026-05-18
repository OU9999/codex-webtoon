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
import type { Panel, StudioState, WebtoonCanvas } from '../_lib/types';

const FONT_LOAD_SAMPLE_TEXT = 'Aa가나';
const DEFAULT_AUTO_SPLIT_HEIGHT = 12000;
const DEFAULT_MANUAL_SPLIT_HEIGHT = 12000;
const MIN_MANUAL_SPLIT_HEIGHT = 1000;
const MAX_MANUAL_SPLIT_HEIGHT = 24000;

type PngExportMode = 'single' | 'auto-split' | 'canvas-split' | 'manual-split';

interface PngExportOptions {
  mode: PngExportMode;
  manualSplitHeight?: number;
}

interface CanvasExportLayout {
  projectCanvas: WebtoonCanvas;
  canvasIndex: number;
  canvasTop: number;
  connectorTop: number | null;
  previousBackgroundColor: string | null;
  currentBackgroundColor: string;
  nextBackgroundColor: string | null;
}

interface RenderPngPartInput {
  state: StudioState;
  sliceTop: number;
  sliceHeight: number;
  imageCache: Map<string, Promise<HTMLImageElement>>;
}

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

const intersectsSlice = (
  itemTop: number,
  itemHeight: number,
  sliceTop: number,
  sliceHeight: number,
): boolean =>
  itemTop < sliceTop + sliceHeight && itemTop + itemHeight > sliceTop;

const clampManualSplitHeight = (height: number | undefined): number => {
  if (!height || !Number.isFinite(height)) return DEFAULT_MANUAL_SPLIT_HEIGHT;

  return Math.min(
    MAX_MANUAL_SPLIT_HEIGHT,
    Math.max(MIN_MANUAL_SPLIT_HEIGHT, Math.trunc(height)),
  );
};

const getSplitHeight = (options: PngExportOptions): number => {
  if (options.mode === 'manual-split') {
    return clampManualSplitHeight(options.manualSplitHeight);
  }

  return DEFAULT_AUTO_SPLIT_HEIGHT;
};

const getPngExportPartCount = (
  state: StudioState,
  options: PngExportOptions,
): number => {
  if (options.mode === 'single') return 1;
  if (options.mode === 'canvas-split') return state.canvases.length;

  return Math.max(
    1,
    Math.ceil(getExportHeight(state) / getSplitHeight(options)),
  );
};

const buildCanvasExportLayouts = (state: StudioState): CanvasExportLayout[] => {
  let offsetY = 0;

  return state.canvases.map((projectCanvas, canvasIndex) => {
    const previousCanvas = state.canvases[canvasIndex - 1] ?? null;
    const nextCanvas = state.canvases[canvasIndex + 1] ?? null;
    const connectorTop = canvasIndex > 0 ? offsetY : null;
    if (connectorTop !== null) offsetY += CANVAS_CONNECTOR_HEIGHT;

    const canvasTop = offsetY;
    offsetY += projectCanvas.height;

    return {
      projectCanvas,
      canvasIndex,
      canvasTop,
      connectorTop,
      currentBackgroundColor: normalizePanelGapColor(
        projectCanvas.backgroundColor,
      ),
      previousBackgroundColor: previousCanvas
        ? normalizePanelGapColor(previousCanvas.backgroundColor)
        : null,
      nextBackgroundColor: nextCanvas
        ? normalizePanelGapColor(nextCanvas.backgroundColor)
        : null,
    };
  });
};

const loadCachedImage = (
  imageUrl: string,
  imageCache: Map<string, Promise<HTMLImageElement>>,
): Promise<HTMLImageElement> => {
  const cached = imageCache.get(imageUrl);
  if (cached) return cached;

  const image = loadImage(imageUrl);
  imageCache.set(imageUrl, image);
  return image;
};

const drawPanel = async (
  ctx: CanvasRenderingContext2D,
  panel: Panel,
  panelY: number,
  imageCache: Map<string, Promise<HTMLImageElement>>,
): Promise<void> => {
  const candidate = panel.candidates.find(
    (item) => item.id === panel.selectedCandidateId,
  );
  if (candidate?.imageUrl) {
    try {
      const image = await loadCachedImage(candidate.imageUrl, imageCache);
      ctx.save();
      ctx.beginPath();
      ctx.rect(panel.x, panelY, panel.width, panel.height);
      ctx.clip();
      drawImageCover(ctx, image, panel.x, panelY, panel.width, panel.height);
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
};

const renderExportSlice = async (
  state: StudioState,
  ctx: CanvasRenderingContext2D,
  sliceTop: number,
  sliceHeight: number,
  imageCache: Map<string, Promise<HTMLImageElement>>,
): Promise<void> => {
  const layouts = buildCanvasExportLayouts(state);

  for (const layout of layouts) {
    if (
      layout.connectorTop !== null &&
      intersectsSlice(
        layout.connectorTop,
        CANVAS_CONNECTOR_HEIGHT,
        sliceTop,
        sliceHeight,
      )
    ) {
      drawCanvasConnector(ctx, layout.connectorTop - sliceTop);
    }

    if (
      !intersectsSlice(
        layout.canvasTop,
        layout.projectCanvas.height,
        sliceTop,
        sliceHeight,
      )
    ) {
      continue;
    }

    drawCanvasBackground(
      ctx,
      layout.canvasTop - sliceTop,
      layout.projectCanvas.height,
      layout.previousBackgroundColor,
      layout.currentBackgroundColor,
      layout.nextBackgroundColor,
    );

    for (const panel of getCanvasPanels(state, layout.projectCanvas.id)) {
      const panelGlobalY = layout.canvasTop + panel.y;
      if (!intersectsSlice(panelGlobalY, panel.height, sliceTop, sliceHeight)) {
        continue;
      }

      await drawPanel(ctx, panel, panelGlobalY - sliceTop, imageCache);
    }
  }
};

const renderPngPart = async ({
  state,
  sliceTop,
  sliceHeight,
  imageCache,
}: RenderPngPartInput): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = Math.max(1, Math.ceil(sliceHeight));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('PNG canvas context is unavailable.');

  await renderExportSlice(state, ctx, sliceTop, sliceHeight, imageCache);

  const blob = await canvasToPngBlob(canvas);
  if (!blob) throw new Error('PNG export failed.');

  return blob;
};

const downloadSinglePng = async (
  state: StudioState,
  imageCache: Map<string, Promise<HTMLImageElement>>,
  timestamp: number,
): Promise<void> => {
  const blob = await renderPngPart({
    state,
    sliceTop: 0,
    sliceHeight: getExportHeight(state),
    imageCache,
  });
  downloadBlob(blob, `webtoon-panel-${timestamp}.png`);
};

const downloadSplitPngs = async (
  state: StudioState,
  imageCache: Map<string, Promise<HTMLImageElement>>,
  splitHeight: number,
  filenameMode: 'auto' | 'manual',
  timestamp: number,
): Promise<void> => {
  const totalHeight = getExportHeight(state);
  const partCount = Math.max(1, Math.ceil(totalHeight / splitHeight));

  for (let index = 0; index < partCount; index += 1) {
    const sliceTop = index * splitHeight;
    const sliceHeight = Math.min(splitHeight, totalHeight - sliceTop);
    const blob = await renderPngPart({
      state,
      sliceTop,
      sliceHeight,
      imageCache,
    });
    const part = String(index + 1).padStart(2, '0');
    downloadBlob(
      blob,
      `webtoon-panel-${filenameMode}-${part}-${timestamp}.png`,
    );
  }
};

const downloadCanvasPngs = async (
  state: StudioState,
  imageCache: Map<string, Promise<HTMLImageElement>>,
  timestamp: number,
): Promise<void> => {
  const layouts = buildCanvasExportLayouts(state);

  for (const layout of layouts) {
    const blob = await renderPngPart({
      state,
      sliceTop: layout.canvasTop,
      sliceHeight: layout.projectCanvas.height,
      imageCache,
    });
    const canvasNumber = String(layout.canvasIndex + 1).padStart(2, '0');
    downloadBlob(blob, `webtoon-panel-canvas-${canvasNumber}-${timestamp}.png`);
  }
};

const useExport = (state: StudioState) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleWebtoonPngExport = async (
    options: PngExportOptions = { mode: 'single' },
  ): Promise<boolean> => {
    setIsExporting(true);
    setExportError(null);

    try {
      await waitForCanvasFonts(state.panels);
      const imageCache = new Map<string, Promise<HTMLImageElement>>();
      const timestamp = Date.now();

      if (options.mode === 'single') {
        await downloadSinglePng(state, imageCache, timestamp);
        return true;
      }
      if (options.mode === 'canvas-split') {
        await downloadCanvasPngs(state, imageCache, timestamp);
        return true;
      }
      if (options.mode === 'manual-split') {
        await downloadSplitPngs(
          state,
          imageCache,
          getSplitHeight(options),
          'manual',
          timestamp,
        );
        return true;
      }

      await downloadSplitPngs(
        state,
        imageCache,
        DEFAULT_AUTO_SPLIT_HEIGHT,
        'auto',
        timestamp,
      );
      return true;
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'PNG export failed.');
      return false;
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

  return {
    exportError,
    handleProjectJsonExport,
    handleWebtoonPngExport,
    isExporting,
  };
};

export {
  DEFAULT_AUTO_SPLIT_HEIGHT,
  DEFAULT_MANUAL_SPLIT_HEIGHT,
  MAX_MANUAL_SPLIT_HEIGHT,
  MIN_MANUAL_SPLIT_HEIGHT,
  getExportHeight,
  getPngExportPartCount,
  useExport,
};
export type { PngExportMode, PngExportOptions };
