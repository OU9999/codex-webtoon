import { useState } from 'react';
import { normalizePanelGapColor } from '@shared/project-state';
import { drawBubbleToCanvas, drawEmptyPanel } from '../_lib/bubble-renderer';
import { CANVAS_WIDTH } from '../_lib/constants';
import { downloadBlob, loadImage } from '../_lib/file-utils';
import type { StudioState } from '../_lib/types';

const useExport = (state: StudioState) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleWebtoonPngExport = async (): Promise<void> => {
    setIsExporting(true);
    const totalHeight =
      state.panels.reduce((sum, panel) => sum + panel.height, 0) +
      state.panelGap * (state.panels.length - 1);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    ctx.fillStyle = normalizePanelGapColor(state.panelGapColor);
    ctx.fillRect(0, 0, CANVAS_WIDTH, totalHeight);

    let y = 0;
    for (const panel of state.panels) {
      const candidate = panel.candidates.find(
        (item) => item.id === panel.selectedCandidateId,
      );
      if (candidate?.imageUrl) {
        try {
          const image = await loadImage(candidate.imageUrl);
          ctx.drawImage(image, 0, y, CANVAS_WIDTH, panel.height);
        } catch {
          drawEmptyPanel(ctx, y, panel.height);
        }
      } else {
        drawEmptyPanel(ctx, y, panel.height);
      }

      ctx.strokeStyle = '#1f2326';
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, y + 1.5, CANVAS_WIDTH - 3, panel.height - 3);
      panel.bubbles.forEach((bubble) => drawBubbleToCanvas(ctx, bubble, y));
      y += panel.height + state.panelGap;
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
