import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { generatePanelImage } from '../_lib/panel-renderer';
import type { Candidate, Panel, StudioState } from '../_lib/types';

const useGeneratePanel = (
  state: StudioState,
  setState: Dispatch<SetStateAction<StudioState>>,
  selectedPanel: Panel | undefined,
  finalPrompt: string,
) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSelectedPanel = async (): Promise<void> => {
    if (!selectedPanel) return;
    if (isGenerating) return;

    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 450));
    const imageUrl = generatePanelImage({
      panel: selectedPanel,
      commonPrompt: state.commonPrompt,
    });
    const candidate: Candidate = {
      id: crypto.randomUUID(),
      imageUrl,
      createdAt: new Date().toISOString(),
      promptSnapshot: finalPrompt,
      height: selectedPanel.height,
      provider: 'local-mock',
    };

    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) =>
        panel.id === current.selectedPanelId
          ? {
              ...panel,
              candidates: [candidate, ...panel.candidates],
              selectedCandidateId: candidate.id,
            }
          : panel,
      ),
    }));
    setIsGenerating(false);
  };

  return { handleGenerateSelectedPanel, isGenerating };
};

export { useGeneratePanel };
