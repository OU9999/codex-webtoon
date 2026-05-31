import type { Panel, StudioState } from './types';

const uniqueIds = (ids: string[]): string[] => {
  return Array.from(new Set(ids));
};

const getPanelIdSet = (state: StudioState): Set<string> => {
  return new Set(state.panels.map((panel) => panel.id));
};

const getBubbleIdSet = (state: StudioState): Set<string> => {
  return new Set(
    state.panels.flatMap((panel) => panel.bubbles.map((bubble) => bubble.id)),
  );
};

const getSelectedPanelIds = (state: StudioState): string[] => {
  const panelIds = getPanelIdSet(state);
  const rawIds =
    state.selectedPanelIds && state.selectedPanelIds.length > 0
      ? state.selectedPanelIds
      : state.selectedPanelId
        ? [state.selectedPanelId]
        : [];

  return uniqueIds(rawIds).filter((id) => panelIds.has(id));
};

const getSelectedBubbleIds = (state: StudioState): string[] => {
  const bubbleIds = getBubbleIdSet(state);
  const rawIds =
    state.selectedBubbleIds && state.selectedBubbleIds.length > 0
      ? state.selectedBubbleIds
      : state.selectedBubbleId
        ? [state.selectedBubbleId]
        : [];

  return uniqueIds(rawIds).filter((id) => bubbleIds.has(id));
};

const getSelectedPanelIdSet = (state: StudioState): Set<string> => {
  return new Set(getSelectedPanelIds(state));
};

const getSelectedBubbleIdSet = (state: StudioState): Set<string> => {
  return new Set(getSelectedBubbleIds(state));
};

const getPanelByBubbleId = (
  state: StudioState,
  bubbleId: string,
): Panel | null => {
  return (
    state.panels.find((panel) =>
      panel.bubbles.some((bubble) => bubble.id === bubbleId),
    ) ?? null
  );
};

const getPrimarySelectionId = (ids: string[]): string | null => {
  return ids.at(-1) ?? null;
};

export {
  getPanelByBubbleId,
  getPrimarySelectionId,
  getSelectedBubbleIds,
  getSelectedBubbleIdSet,
  getSelectedPanelIds,
  getSelectedPanelIdSet,
};
