import { useState } from 'react';
import { buildFinalPrompt } from '../_lib/prompt';
import type {
  BubbleDragStartPayload,
  PanelTransformStartPayload,
  StudioState,
} from '../_lib/types';
import { useBubbleDrag } from './use-bubble-drag';
import { useCandidateActions } from './use-candidate-actions';
import { useDynamicStyles } from './use-dynamic-styles';
import { useExport } from './use-export';
import { useGeneratePanel } from './use-generate-panel';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';
import { useLayerActions } from './use-layer-actions';
import { usePanelActions } from './use-panel-actions';
import { usePanelTransform } from './use-panel-transform';
import { useStudioState } from './use-studio-state';

interface UseStudioOptions {
  projectName: string;
  initialState: StudioState;
  onBack: () => void;
}

const useStudio = ({ projectName, initialState, onBack }: UseStudioOptions) => {
  const [state, setState, saveStatus] = useStudioState({
    projectName,
    initialState,
  });
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);

  const selectedPanelCandidate = state.selectedPanelId
    ? (state.panels.find((panel) => panel.id === state.selectedPanelId) ?? null)
    : null;
  const selectedBubblePanel = state.selectedBubbleId
    ? (state.panels.find(
        (panel) =>
          panel.id === state.selectedPanelId &&
          panel.bubbles.some((bubble) => bubble.id === state.selectedBubbleId),
      ) ??
      state.panels.find((panel) =>
        panel.bubbles.some((bubble) => bubble.id === state.selectedBubbleId),
      ) ??
      null)
    : null;
  const selectedPanel = state.selectedBubbleId ? null : selectedPanelCandidate;
  const selectedCandidate = selectedPanel?.candidates.find(
    (candidate) => candidate.id === selectedPanel.selectedCandidateId,
  );
  const selectedBubble = selectedBubblePanel?.bubbles.find(
    (bubble) => bubble.id === state.selectedBubbleId,
  );
  const finalPrompt = buildFinalPrompt({
    commonPrompt: state.commonPrompt,
    panel: selectedPanel ?? undefined,
  });

  const panels = usePanelActions(state, setState);
  const generation = useGeneratePanel(
    state,
    setState,
    selectedPanel,
    finalPrompt,
    projectName,
  );
  const candidates = useCandidateActions(setState, panels.patchSelectedPanel);
  const layers = useLayerActions(setState);
  const drag = useBubbleDrag(setState);
  const transform = usePanelTransform(setState);
  const exporting = useExport(state);

  const handleBubbleSelect = (bubbleId: string, panelId?: string): void => {
    setEditingBubbleId(null);
    layers.handleBubbleSelect(bubbleId, panelId);
  };

  const handleBubbleTextEditStart = (
    panelId: string,
    bubbleId: string,
  ): void => {
    layers.handleBubbleSelect(bubbleId, panelId);
    setEditingBubbleId(bubbleId);
  };

  const handleBubbleTextEditEnd = (): void => {
    setEditingBubbleId(null);
  };

  const handleBubbleDragStart = (
    payload: BubbleDragStartPayload,
  ): void => {
    setEditingBubbleId(null);
    drag.handleBubbleDragStart(payload);
  };

  const handlePanelSelect = (panelId: string): void => {
    setEditingBubbleId(null);
    panels.handlePanelSelect(panelId);
  };

  const handlePanelTransformStart = (
    payload: PanelTransformStartPayload,
  ): void => {
    setEditingBubbleId(null);
    transform.handlePanelTransformStart(payload);
  };

  const handleSelectionClear = (): void => {
    setEditingBubbleId(null);
    panels.handleSelectionClear();
  };

  const handleSelectedBubbleDelete = (): void => {
    setEditingBubbleId(null);
    layers.handleSelectedBubbleDelete();
  };

  useDynamicStyles(state);
  useKeyboardShortcuts({
    onGenerate: generation.handleGenerateSelectedPanel,
    enabled: Boolean(selectedPanel) && !generation.isGenerating,
  });

  return {
    state,
    selectedPanel,
    selectedBubblePanel,
    selectedCandidate,
    selectedBubble,
    finalPrompt,
    projectName,
    saveStatus,
    onBack,
    ...panels,
    ...generation,
    ...candidates,
    ...layers,
    ...drag,
    ...transform,
    ...exporting,
    editingBubbleId,
    handleBubbleDragStart,
    handleBubbleSelect,
    handleBubbleTextEditEnd,
    handleBubbleTextEditStart,
    handlePanelSelect,
    handlePanelTransformStart,
    handleSelectionClear,
    handleSelectedBubbleDelete,
  };
};

export { useStudio };
