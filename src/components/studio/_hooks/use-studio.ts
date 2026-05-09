import { buildFinalPrompt } from '../_lib/prompt';
import { useBubbleDrag } from './use-bubble-drag';
import { useCandidateActions } from './use-candidate-actions';
import { useDynamicStyles } from './use-dynamic-styles';
import { useExport } from './use-export';
import { useGeneratePanel } from './use-generate-panel';
import { useLayerActions } from './use-layer-actions';
import { usePanelActions } from './use-panel-actions';
import { useStudioState } from './use-studio-state';

const useStudio = () => {
  const [state, setState] = useStudioState();

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
  );
  const candidates = useCandidateActions(setState, panels.patchSelectedPanel);
  const layers = useLayerActions(setState);
  const drag = useBubbleDrag(setState);
  const exporting = useExport(state);
  useDynamicStyles(state);

  return {
    state,
    selectedPanel,
    selectedCandidate,
    selectedBubble,
    finalPrompt,
    ...panels,
    ...generation,
    ...candidates,
    ...layers,
    ...drag,
    ...exporting,
  };
};

export { useStudio };
