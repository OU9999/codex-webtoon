import { WEBTOON_CANVAS_WIDTH } from '@shared/project-state';
import { clamp } from './canvas-primitives';
import { getCanvasPanels } from './canvas-state';
import { createPanel } from './factories';
import type { Bubble, Panel, StudioState } from './types';

interface PanelClipboardItem {
  kind: 'panel';
  panel: Panel;
}

interface BubbleClipboardItem {
  kind: 'bubble';
  bubble: Bubble;
  panelId: string;
}

interface PasteClipboardOptions {
  getPanelCopyTitle: (title: string) => string;
}

type StudioClipboardItem = PanelClipboardItem | BubbleClipboardItem;

const PASTE_OFFSET = 24;

const cloneValue = <Value>(value: Value): Value => {
  return structuredClone(value) as Value;
};

const getSelectedBubbleClipboardItem = (
  state: StudioState,
): BubbleClipboardItem | null => {
  if (!state.selectedBubbleId) return null;

  const panel = state.panels.find((item) =>
    item.bubbles.some((bubble) => bubble.id === state.selectedBubbleId),
  );
  const bubble = panel?.bubbles.find(
    (item) => item.id === state.selectedBubbleId,
  );
  if (!panel || !bubble) return null;

  return {
    kind: 'bubble',
    bubble: cloneValue(bubble),
    panelId: panel.id,
  };
};

const getSelectedPanelClipboardItem = (
  state: StudioState,
): PanelClipboardItem | null => {
  if (!state.selectedPanelId) return null;

  const panel = state.panels.find((item) => item.id === state.selectedPanelId);
  if (!panel) return null;

  return {
    kind: 'panel',
    panel: cloneValue(panel),
  };
};

const createClipboardItem = (
  state: StudioState,
): StudioClipboardItem | null => {
  return (
    getSelectedBubbleClipboardItem(state) ??
    getSelectedPanelClipboardItem(state)
  );
};

const getTargetCanvasId = (
  state: StudioState,
  sourceCanvasId: string,
): string | null => {
  if (state.canvases.some((canvas) => canvas.id === state.selectedCanvasId)) {
    return state.selectedCanvasId;
  }

  if (state.canvases.some((canvas) => canvas.id === sourceCanvasId)) {
    return sourceCanvasId;
  }

  return state.canvases[0]?.id ?? null;
};

const getPanelInsertIndex = (
  state: StudioState,
  targetCanvasId: string,
  sourcePanelId: string,
): number => {
  const selectedPanelIndex = state.panels.findIndex(
    (panel) =>
      panel.id === state.selectedPanelId && panel.canvasId === targetCanvasId,
  );
  if (selectedPanelIndex >= 0) return selectedPanelIndex + 1;

  const sourcePanelIndex = state.panels.findIndex(
    (panel) => panel.id === sourcePanelId && panel.canvasId === targetCanvasId,
  );
  if (sourcePanelIndex >= 0) return sourcePanelIndex + 1;

  let lastCanvasPanelIndex = -1;
  state.panels.forEach((panel, index) => {
    if (panel.canvasId !== targetCanvasId) return;
    lastCanvasPanelIndex = index;
  });

  return lastCanvasPanelIndex >= 0
    ? lastCanvasPanelIndex + 1
    : state.panels.length;
};

const getPanelPasteAnchor = (
  state: StudioState,
  targetCanvasId: string,
  sourcePanel: Panel,
): Panel => {
  return (
    state.panels.find(
      (panel) =>
        panel.id === state.selectedPanelId && panel.canvasId === targetCanvasId,
    ) ??
    state.panels.find(
      (panel) =>
        panel.id === sourcePanel.id && panel.canvasId === targetCanvasId,
    ) ??
    sourcePanel
  );
};

const createPastedPanel = (
  state: StudioState,
  sourcePanel: Panel,
  targetCanvasId: string,
  options: PasteClipboardOptions,
): Panel => {
  const anchor = getPanelPasteAnchor(state, targetCanvasId, sourcePanel);
  const maxX = Math.max(0, WEBTOON_CANVAS_WIDTH - sourcePanel.width);
  const panel = createPanel({
    canvasId: targetCanvasId,
    title: options.getPanelCopyTitle(sourcePanel.title),
    x: clamp(anchor.x + PASTE_OFFSET, 0, maxX),
    y: Math.max(0, anchor.y + PASTE_OFFSET),
    width: sourcePanel.width,
    height: sourcePanel.height,
    prompt: sourcePanel.prompt,
    candidates: cloneValue(sourcePanel.candidates),
    selectedCandidateId: sourcePanel.selectedCandidateId,
    fitMode: sourcePanel.fitMode,
    referenceImages: cloneValue(sourcePanel.referenceImages),
    bubbles: sourcePanel.bubbles.map((bubble) => ({
      ...cloneValue(bubble),
      id: crypto.randomUUID(),
    })),
  });

  return {
    ...panel,
    deletedCandidates: cloneValue(sourcePanel.deletedCandidates),
    referenceImages: panel.referenceImages.map((reference) =>
      reference.panelId === sourcePanel.id
        ? { ...reference, panelId: panel.id }
        : reference,
    ),
  };
};

const pastePanelClipboardItem = (
  state: StudioState,
  item: PanelClipboardItem,
  options: PasteClipboardOptions,
): StudioState => {
  const targetCanvasId = getTargetCanvasId(state, item.panel.canvasId);
  if (!targetCanvasId) return state;

  const targetCanvas = state.canvases.find(
    (canvas) => canvas.id === targetCanvasId,
  );
  if (!targetCanvas) return state;

  const panel = createPastedPanel(state, item.panel, targetCanvasId, options);
  const insertIndex = getPanelInsertIndex(state, targetCanvasId, item.panel.id);
  const panels = [...state.panels];
  panels.splice(insertIndex, 0, panel);
  const canvasHeight = Math.max(targetCanvas.height, panel.y + panel.height);

  return {
    ...state,
    canvases: state.canvases.map((canvas) =>
      canvas.id === targetCanvasId
        ? { ...canvas, height: canvasHeight }
        : canvas,
    ),
    panels,
    selectedCanvasId: targetCanvasId,
    selectedPanelId: panel.id,
    selectedBubbleId: null,
  };
};

const getSelectedBubblePanel = (state: StudioState): Panel | null => {
  if (!state.selectedBubbleId) return null;

  return (
    state.panels.find((panel) =>
      panel.bubbles.some((bubble) => bubble.id === state.selectedBubbleId),
    ) ?? null
  );
};

const getTargetBubblePanel = (
  state: StudioState,
  item: BubbleClipboardItem,
): Panel | null => {
  return (
    state.panels.find((panel) => panel.id === state.selectedPanelId) ??
    getSelectedBubblePanel(state) ??
    state.panels.find((panel) => panel.id === item.panelId) ??
    getCanvasPanels(state, state.selectedCanvasId)[0] ??
    state.panels[0] ??
    null
  );
};

const getBubbleInsertIndex = (
  state: StudioState,
  targetPanel: Panel,
  sourceBubbleId: string,
): number => {
  const selectedBubbleIndex = targetPanel.bubbles.findIndex(
    (bubble) => bubble.id === state.selectedBubbleId,
  );
  if (selectedBubbleIndex >= 0) return selectedBubbleIndex + 1;

  const sourceBubbleIndex = targetPanel.bubbles.findIndex(
    (bubble) => bubble.id === sourceBubbleId,
  );
  if (sourceBubbleIndex >= 0) return sourceBubbleIndex + 1;

  return targetPanel.bubbles.length;
};

const getBubblePasteAnchor = (
  state: StudioState,
  targetPanel: Panel,
  sourceBubble: Bubble,
): Bubble => {
  return (
    targetPanel.bubbles.find(
      (bubble) => bubble.id === state.selectedBubbleId,
    ) ??
    targetPanel.bubbles.find((bubble) => bubble.id === sourceBubble.id) ??
    sourceBubble
  );
};

const pasteBubbleClipboardItem = (
  state: StudioState,
  item: BubbleClipboardItem,
): StudioState => {
  const targetPanel = getTargetBubblePanel(state, item);
  if (!targetPanel) return state;

  const anchor = getBubblePasteAnchor(state, targetPanel, item.bubble);
  const bubble = {
    ...cloneValue(item.bubble),
    id: crypto.randomUUID(),
    x: anchor.x + PASTE_OFFSET,
    y: anchor.y + PASTE_OFFSET,
  };
  const insertIndex = getBubbleInsertIndex(state, targetPanel, item.bubble.id);

  return {
    ...state,
    panels: state.panels.map((panel) => {
      if (panel.id !== targetPanel.id) return panel;

      const bubbles = [...panel.bubbles];
      bubbles.splice(insertIndex, 0, bubble);

      return { ...panel, bubbles };
    }),
    selectedCanvasId: targetPanel.canvasId,
    selectedPanelId: null,
    selectedBubbleId: bubble.id,
  };
};

const pasteClipboardItem = (
  state: StudioState,
  item: StudioClipboardItem | null,
  options: PasteClipboardOptions,
): StudioState => {
  if (!item) return state;

  if (item.kind === 'panel') {
    return pastePanelClipboardItem(state, item, options);
  }

  return pasteBubbleClipboardItem(state, item);
};

export { createClipboardItem, pasteClipboardItem };
export type { StudioClipboardItem };
