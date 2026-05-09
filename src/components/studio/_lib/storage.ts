import { defaultCommonPrompt, STORAGE_KEY } from './constants';
import { starterPanels } from './factories';
import type { StudioState } from './types';

const normalizeLoadedState = (value: unknown): StudioState | null => {
  const loaded = value as Partial<StudioState> | null;

  if (!loaded) return null;
  if (!Array.isArray(loaded.panels)) return null;
  if (loaded.panels.length === 0) return null;

  return {
    commonPrompt: loaded.commonPrompt ?? defaultCommonPrompt,
    panels: loaded.panels.map((panel) => ({
      ...panel,
      deletedCandidates: panel.deletedCandidates ?? [],
      bubbles: panel.bubbles ?? [],
    })),
    selectedPanelId: loaded.selectedPanelId ?? loaded.panels[0].id,
    selectedBubbleId: loaded.selectedBubbleId ?? null,
    panelGap:
      typeof loaded.panelGap === 'number' && Number.isFinite(loaded.panelGap)
        ? loaded.panelGap
        : 28,
  };
};

const getInitialState = (): StudioState => {
  const fallback: StudioState = {
    commonPrompt: defaultCommonPrompt,
    panels: starterPanels,
    selectedPanelId: starterPanels[0].id,
    selectedBubbleId: null,
    panelGap: 28,
  };

  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return fallback;

    const loaded = normalizeLoadedState(JSON.parse(savedState));
    if (loaded) return loaded;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return fallback;
};

export { getInitialState };
