import { useState } from 'react';
import { normalizePanelGapColor } from '@shared/project-state';
import { drawBubbleToCanvas, drawEmptyPanel } from '../_lib/bubble-renderer';
import { CANVAS_WIDTH } from '../_lib/constants';
import { downloadBlob, loadImage } from '../_lib/file-utils';
import type { StudioState } from '../_lib/types';

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

const useExport = (state: StudioState) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleWebtoonPngExport = async (): Promise<void> => {
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = state.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    ctx.fillStyle = normalizePanelGapColor(state.panelGapColor);
    ctx.fillRect(0, 0, CANVAS_WIDTH, state.canvasHeight);

    for (const panel of state.panels) {
      const candidate = panel.candidates.find(
        (item) => item.id === panel.selectedCandidateId,
      );
      if (candidate?.imageUrl) {
        try {
          const image = await loadImage(candidate.imageUrl);
          ctx.save();
          ctx.beginPath();
          ctx.rect(panel.x, panel.y, panel.width, panel.height);
          ctx.clip();
          drawImageCover(
            ctx,
            image,
            panel.x,
            panel.y,
            panel.width,
            panel.height,
          );
          ctx.restore();
        } catch {
          drawEmptyPanel(ctx, panel.y, panel.height, panel.x, panel.width);
        }
      } else {
        drawEmptyPanel(ctx, panel.y, panel.height, panel.x, panel.width);
      }

      ctx.strokeStyle = '#1f2326';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        panel.x + 1.5,
        panel.y + 1.5,
        panel.width - 3,
        panel.height - 3,
      );
      ctx.save();
      ctx.translate(panel.x, panel.y);
      ctx.scale(panel.width / CANVAS_WIDTH, 1);
      panel.bubbles.forEach((bubble) => drawBubbleToCanvas(ctx, bubble, 0));
      ctx.restore();
    }

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `webtoon-panel-${Date.now()}.png`);
      setIsExporting(false);
    }, 'image/png');
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
