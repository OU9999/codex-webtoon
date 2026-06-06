import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, generateCandidates } from '@/api/client';
import type { Candidate as ApiCandidate } from '@shared/types';
import type { Candidate, Panel, StudioState } from '../_lib/types';

interface GenerationErrorState {
  message: string;
  panelId: string;
}

const toLocalCandidate = (candidate: ApiCandidate): Candidate => ({
  id: candidate.id,
  imageUrl: candidate.imageUrl,
  createdAt: candidate.createdAt,
  promptSnapshot: candidate.promptSnapshot,
  height: candidate.height,
  provider:
    candidate.provider === 'openai' || candidate.provider === 'oauth'
      ? candidate.provider
      : 'local-mock',
});

const useGeneratePanel = (
  state: StudioState,
  setState: Dispatch<SetStateAction<StudioState>>,
  selectedPanel: Panel | null,
  finalPrompt: string,
  projectName: string,
) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPanelId, setGeneratingPanelId] = useState<string | null>(
    null,
  );
  const [generationError, setGenerationError] =
    useState<GenerationErrorState | null>(null);

  const handleGenerateSelectedPanel = async (): Promise<void> => {
    if (!selectedPanel) return;
    if (isGenerating) return;
    if (!finalPrompt.trim()) {
      setGenerationError({
        message: t('studioErrors.missingPrompt'),
        panelId: selectedPanel.id,
      });
      return;
    }

    const targetPanelId = selectedPanel.id;
    setIsGenerating(true);
    setGeneratingPanelId(targetPanelId);
    setGenerationError(null);

    try {
      const apiCandidates = await generateCandidates({
        projectName,
        panelId: selectedPanel.id,
        prompt: finalPrompt,
        height: selectedPanel.height,
        count: state.variantCount,
        referenceImages: selectedPanel.referenceImages,
      });
      const newCandidates = apiCandidates.map(toLocalCandidate);
      if (newCandidates.length === 0) {
        setGenerationError({
          message: t('studioErrors.emptyGeneration'),
          panelId: targetPanelId,
        });
        return;
      }

      setState((current) => ({
        ...current,
        panels: current.panels.map((panel) =>
          panel.id === targetPanelId
            ? {
                ...panel,
                candidates: [...newCandidates, ...panel.candidates],
                selectedCandidateId: newCandidates[0].id,
              }
            : panel,
        ),
      }));
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('studioErrors.generateFailed');
      setGenerationError({ message, panelId: targetPanelId });
    } finally {
      setIsGenerating(false);
      setGeneratingPanelId(null);
    }
  };

  const dismissGenerationError = (): void => setGenerationError(null);
  const selectedPanelGenerationError =
    generationError && generationError.panelId === selectedPanel?.id
      ? generationError.message
      : null;

  return {
    handleGenerateSelectedPanel,
    isGenerating,
    generatingPanelId,
    generationError: selectedPanelGenerationError,
    dismissGenerationError,
  };
};

export { useGeneratePanel };
