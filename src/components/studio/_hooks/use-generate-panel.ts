import { useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, generateCandidates } from '@/api/client';
import type { Candidate as ApiCandidate } from '@shared/types';
import type { Candidate, Panel, StudioState } from '../_lib/types';

interface GenerationErrorState {
  kind: 'canceled' | 'failed';
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
  const generationControllerRef = useRef<AbortController | null>(null);
  const [generationError, setGenerationError] =
    useState<GenerationErrorState | null>(null);

  const setPanelGenerationError = (
    panelId: string,
    message: string,
    kind: GenerationErrorState['kind'] = 'failed',
  ): void => {
    setGenerationError({ kind, message, panelId });
  };

  const handleGenerateSelectedPanel = async (): Promise<void> => {
    if (!selectedPanel) return;
    if (isGenerating) return;
    if (!finalPrompt.trim()) {
      setPanelGenerationError(
        selectedPanel.id,
        t('studioErrors.missingPrompt'),
      );
      return;
    }

    const targetPanelId = selectedPanel.id;
    const generationController = new AbortController();
    generationControllerRef.current = generationController;
    setIsGenerating(true);
    setGeneratingPanelId(targetPanelId);
    setGenerationError(null);

    try {
      const apiCandidates = await generateCandidates(
        {
          projectName,
          panelId: selectedPanel.id,
          prompt: finalPrompt,
          height: selectedPanel.height,
          count: state.variantCount,
          referenceImages: selectedPanel.referenceImages,
        },
        {
          signal: generationController.signal,
        },
      );
      const newCandidates = apiCandidates.map(toLocalCandidate);
      if (newCandidates.length === 0) {
        setPanelGenerationError(
          targetPanelId,
          t('studioErrors.emptyGeneration'),
        );
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
      if (generationController.signal.aborted) {
        setPanelGenerationError(
          targetPanelId,
          t('studioErrors.generationCanceled'),
          'canceled',
        );
        return;
      }

      setPanelGenerationError(targetPanelId, message);
    } finally {
      if (generationControllerRef.current === generationController) {
        generationControllerRef.current = null;
      }
      setIsGenerating(false);
      setGeneratingPanelId(null);
    }
  };

  const handleCancelGeneration = (): void => {
    generationControllerRef.current?.abort();
  };

  const dismissGenerationError = (): void => setGenerationError(null);
  const selectedPanelGenerationError =
    generationError && generationError.panelId === selectedPanel?.id
      ? generationError
      : null;

  return {
    handleCancelGeneration,
    handleGenerateSelectedPanel,
    isGenerating,
    generatingPanelId,
    generationError: selectedPanelGenerationError?.message ?? null,
    generationErrorKind: selectedPanelGenerationError?.kind ?? null,
    dismissGenerationError,
  };
};

export { useGeneratePanel };
