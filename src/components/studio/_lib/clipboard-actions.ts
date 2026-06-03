import { WEBTOON_CANVAS_WIDTH } from '@shared/project-state';
import { clamp } from './canvas-primitives';
import { getCanvasPanels } from './canvas-state';
import { createPanel } from './factories';
import { getSelectedBubbleIds, getSelectedPanelIds } from './selection-state';
import type { Bubble, Panel, StudioState } from './types';

interface PanelClipboardItem {
  kind: 'panel';
  panel: Panel;
}

interface PanelGroupClipboardItem {
  kind: 'panel-group';
  panels: Panel[];
}

interface BubbleClipboardSource {
  bubble: Bubble;
  panelId: string;
}

interface BubbleClipboardItem extends BubbleClipboardSource {
  kind: 'bubble';
}

interface BubbleGroupClipboardItem {
  kind: 'bubble-group';
  bubbles: BubbleClipboardSource[];
}

interface MixedClipboardItem {
  kind: 'mixed';
  panels: Panel[];
  bubbles: BubbleClipboardSource[];
}

interface PasteClipboardOptions {
  getPanelCopyTitle: (title: string) => string;
}

interface PanelPastePosition {
  x: number;
  y: number;
}

interface BubbleRecord {
  bubble: Bubble;
  panel: Panel;
}

interface BubblePastePlan {
  bubble: Bubble;
  panelId: string;
}

type StudioClipboardItem =
  | PanelClipboardItem
  | PanelGroupClipboardItem
  | BubbleClipboardItem
  | BubbleGroupClipboardItem
  | MixedClipboardItem;

const PASTE_OFFSET = 24;

const cloneValue = <Value>(value: Value): Value => {
  return structuredClone(value) as Value;
};

const getBubbleRecordById = (
  state: StudioState,
  bubbleId: string,
): BubbleRecord | null => {
  for (const panel of state.panels) {
    const bubble = panel.bubbles.find((item) => item.id === bubbleId);
    if (bubble) return { bubble, panel };
  }

  return null;
};

const getSelectedBubbleSources = (
  state: StudioState,
): BubbleClipboardSource[] => {
  return getSelectedBubbleIds(state)
    .map((bubbleId) => getBubbleRecordById(state, bubbleId))
    .filter((record): record is BubbleRecord => record !== null)
    .map(({ bubble, panel }) => ({
      bubble: cloneValue(bubble),
      panelId: panel.id,
    }));
};

const getSelectedPanelCopies = (state: StudioState): Panel[] => {
  const selectedIds = new Set(getSelectedPanelIds(state));
  if (selectedIds.size === 0) return [];

  return state.panels
    .filter((panel) => selectedIds.has(panel.id))
    .map((panel) => cloneValue(panel));
};

const createClipboardItem = (
  state: StudioState,
): StudioClipboardItem | null => {
  const panels = getSelectedPanelCopies(state);
  const selectedPanelIds = new Set(panels.map((panel) => panel.id));
  const bubbleSources = getSelectedBubbleSources(state).filter(
    (source) => !selectedPanelIds.has(source.panelId),
  );
  if (panels.length > 0 && bubbleSources.length > 0) {
    return {
      kind: 'mixed',
      panels,
      bubbles: bubbleSources,
    };
  }

  if (bubbleSources.length === 1) {
    const [source] = bubbleSources;
    if (!source) return null;

    return {
      kind: 'bubble',
      bubble: source.bubble,
      panelId: source.panelId,
    };
  }
  if (bubbleSources.length > 1) {
    return { kind: 'bubble-group', bubbles: bubbleSources };
  }

  if (panels.length === 1) {
    const [panel] = panels;
    if (!panel) return null;

    return { kind: 'panel', panel };
  }
  if (panels.length > 1) {
    return { kind: 'panel-group', panels };
  }

  return null;
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
  sourcePanelIds: Set<string>,
): number => {
  const selectedIds = new Set(getSelectedPanelIds(state));
  let anchorIndex = -1;
  let lastCanvasPanelIndex = -1;

  state.panels.forEach((panel, index) => {
    if (panel.canvasId !== targetCanvasId) return;

    lastCanvasPanelIndex = index;
    if (selectedIds.has(panel.id) || sourcePanelIds.has(panel.id)) {
      anchorIndex = index;
    }
  });

  if (anchorIndex >= 0) return anchorIndex + 1;

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
  position?: PanelPastePosition,
): Panel => {
  const anchor = getPanelPasteAnchor(state, targetCanvasId, sourcePanel);
  const maxX = Math.max(0, WEBTOON_CANVAS_WIDTH - sourcePanel.width);
  const panel = createPanel({
    canvasId: targetCanvasId,
    title: options.getPanelCopyTitle(sourcePanel.title),
    x: position?.x ?? clamp(anchor.x + PASTE_OFFSET, 0, maxX),
    y: position?.y ?? Math.max(0, anchor.y + PASTE_OFFSET),
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
  };
};

const updatePastedPanelReferences = (
  panel: Panel,
  panelIdMap: Map<string, string>,
): Panel => {
  return {
    ...panel,
    referenceImages: panel.referenceImages.map((reference) =>
      reference.panelId && panelIdMap.has(reference.panelId)
        ? { ...reference, panelId: panelIdMap.get(reference.panelId) }
        : reference,
    ),
  };
};

const pastePanelGroupClipboardItem = (
  state: StudioState,
  sourcePanels: Panel[],
  options: PasteClipboardOptions,
): StudioState => {
  const firstPanel = sourcePanels[0];
  if (!firstPanel) return state;

  const targetCanvasId = getTargetCanvasId(state, firstPanel.canvasId);
  if (!targetCanvasId) return state;

  const targetCanvas = state.canvases.find(
    (canvas) => canvas.id === targetCanvasId,
  );
  if (!targetCanvas) return state;

  const panelIdMap = new Map<string, string>();
  const shouldUseAnchorPosition = sourcePanels.length === 1;
  const selectedPanelAnchors = getSelectedPanelIds(state)
    .map((panelId) => state.panels.find((panel) => panel.id === panelId))
    .filter((panel): panel is Panel => Boolean(panel));
  const useSelectedPanelAnchors =
    selectedPanelAnchors.length === sourcePanels.length;
  const pastedPanels = sourcePanels.map((sourcePanel, index) => {
    const anchorPanel = useSelectedPanelAnchors
      ? (selectedPanelAnchors[index] ?? sourcePanel)
      : sourcePanel;
    const maxX = Math.max(0, WEBTOON_CANVAS_WIDTH - sourcePanel.width);
    const panel = createPastedPanel(
      state,
      sourcePanel,
      targetCanvasId,
      options,
      shouldUseAnchorPosition
        ? undefined
        : {
            x: clamp(anchorPanel.x + PASTE_OFFSET, 0, maxX),
            y: Math.max(0, anchorPanel.y + PASTE_OFFSET),
          },
    );
    panelIdMap.set(sourcePanel.id, panel.id);

    return panel;
  });
  const normalizedPastedPanels = pastedPanels.map((panel) =>
    updatePastedPanelReferences(panel, panelIdMap),
  );
  const sourcePanelIds = new Set(sourcePanels.map((panel) => panel.id));
  const insertIndex = getPanelInsertIndex(
    state,
    targetCanvasId,
    sourcePanelIds,
  );
  const panels = [...state.panels];
  panels.splice(insertIndex, 0, ...normalizedPastedPanels);
  const canvasHeight = Math.max(
    targetCanvas.height,
    ...normalizedPastedPanels.map((panel) => panel.y + panel.height),
  );
  const selectedPanelIds = normalizedPastedPanels.map((panel) => panel.id);

  return {
    ...state,
    canvases: state.canvases.map((canvas) =>
      canvas.id === targetCanvasId
        ? { ...canvas, height: canvasHeight }
        : canvas,
    ),
    panels,
    selectedCanvasId: targetCanvasId,
    selectedPanelId: selectedPanelIds.at(-1) ?? null,
    selectedPanelIds,
    selectedBubbleId: null,
    selectedBubbleIds: [],
  };
};

const getSelectedBubbleRecords = (state: StudioState): BubbleRecord[] => {
  return getSelectedBubbleIds(state)
    .map((bubbleId) => getBubbleRecordById(state, bubbleId))
    .filter((record): record is BubbleRecord => record !== null);
};

const getSelectedBubblePanel = (state: StudioState): Panel | null => {
  if (!state.selectedBubbleId) return null;

  return getBubbleRecordById(state, state.selectedBubbleId)?.panel ?? null;
};

const getFallbackBubblePanel = (
  state: StudioState,
  sourcePanelId: string,
): Panel | null => {
  return (
    state.panels.find((panel) => panel.id === state.selectedPanelId) ??
    getSelectedBubblePanel(state) ??
    state.panels.find((panel) => panel.id === sourcePanelId) ??
    getCanvasPanels(state, state.selectedCanvasId)[0] ??
    state.panels[0] ??
    null
  );
};

const getBubblePastePlans = (
  state: StudioState,
  sources: BubbleClipboardSource[],
): BubblePastePlan[] => {
  const selectedRecords = getSelectedBubbleRecords(state);
  const useSelectedAnchors = selectedRecords.length === sources.length;
  const sourcePanelIds = new Set(sources.map((source) => source.panelId));
  const selectedPanel =
    sourcePanelIds.size === 1
      ? (state.panels.find((panel) => panel.id === state.selectedPanelId) ??
        null)
      : null;

  return sources.flatMap((source, index) => {
    const selectedRecord = useSelectedAnchors
      ? (selectedRecords[index] ?? null)
      : null;
    const sourceRecord = getBubbleRecordById(state, source.bubble.id);
    const targetPanel =
      selectedRecord?.panel ??
      selectedPanel ??
      state.panels.find((panel) => panel.id === source.panelId) ??
      getFallbackBubblePanel(state, source.panelId);
    if (!targetPanel) return [];

    const anchor =
      selectedRecord?.bubble ??
      (targetPanel.id === source.panelId ? sourceRecord?.bubble : null) ??
      source.bubble;

    return [
      {
        panelId: targetPanel.id,
        bubble: {
          ...cloneValue(source.bubble),
          id: crypto.randomUUID(),
          x: anchor.x + PASTE_OFFSET,
          y: anchor.y + PASTE_OFFSET,
        },
      },
    ];
  });
};

const pasteBubbleGroupClipboardItem = (
  state: StudioState,
  sources: BubbleClipboardSource[],
): StudioState => {
  const plans = getBubblePastePlans(state, sources);
  const firstPlan = plans[0];
  if (!firstPlan) return state;

  const plansByPanelId = new Map<string, Bubble[]>();
  plans.forEach((plan) => {
    const panelPlans = plansByPanelId.get(plan.panelId) ?? [];
    plansByPanelId.set(plan.panelId, [...panelPlans, plan.bubble]);
  });
  const selectedBubbleIds = plans.map((plan) => plan.bubble.id);
  const selectedPanel =
    state.panels.find((panel) => panel.id === firstPlan.panelId) ?? null;

  return {
    ...state,
    panels: state.panels.map((panel) => {
      const bubbles = plansByPanelId.get(panel.id);
      if (!bubbles) return panel;

      return { ...panel, bubbles: [...panel.bubbles, ...bubbles] };
    }),
    selectedCanvasId: selectedPanel?.canvasId ?? state.selectedCanvasId,
    selectedPanelId: null,
    selectedPanelIds: [],
    selectedBubbleId: selectedBubbleIds.at(-1) ?? null,
    selectedBubbleIds,
  };
};

const pasteClipboardItem = (
  state: StudioState,
  item: StudioClipboardItem | null,
  options: PasteClipboardOptions,
): StudioState => {
  if (!item) return state;

  if (item.kind === 'panel') {
    return pastePanelGroupClipboardItem(state, [item.panel], options);
  }

  if (item.kind === 'panel-group') {
    return pastePanelGroupClipboardItem(state, item.panels, options);
  }

  if (item.kind === 'bubble') {
    return pasteBubbleGroupClipboardItem(state, [item]);
  }

  if (item.kind === 'bubble-group') {
    return pasteBubbleGroupClipboardItem(state, item.bubbles);
  }

  const afterBubbles = pasteBubbleGroupClipboardItem(
    {
      ...state,
      selectedPanelId: null,
      selectedPanelIds: [],
    },
    item.bubbles,
  );
  const afterPanels = pastePanelGroupClipboardItem(
    afterBubbles,
    item.panels,
    options,
  );

  return {
    ...afterPanels,
    selectedBubbleId: null,
    selectedBubbleIds: afterBubbles.selectedBubbleIds,
  };
};

export { createClipboardItem, pasteClipboardItem };
export type { StudioClipboardItem };
