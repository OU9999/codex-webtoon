import { buildFinalPrompt } from '../_lib/prompt';
import type { StudioState } from '../_lib/types';
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

  const selectedPanel =
    state.panels.find((panel) => panel.id === state.selectedPanelId) ??
    state.panels[0];
  const selectedCandidate = selectedPanel?.candidates.find(
    (candidate) => candidate.id === selectedPanel.selectedCandidateId,
  );
  const selectedBubble = selectedPanel?.bubbles.find(
    (bubble) => bubble.id === state.selectedBubbleId,
  );
  const finalPrompt = buildFinalPrompt({
    commonPrompt: state.commonPrompt,
    panel: selectedPanel,
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
  useDynamicStyles(state);
  useKeyboardShortcuts({
    onGenerate: generation.handleGenerateSelectedPanel,
    enabled: Boolean(selectedPanel) && !generation.isGenerating,
  });

  return {
    state,
    selectedPanel,
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
  };
};

export { useStudio };
