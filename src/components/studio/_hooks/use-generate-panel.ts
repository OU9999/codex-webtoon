import { useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, generateCandidates } from '@/api/client';
import type { Candidate as ApiCandidate } from '@shared/types';
import {
  getValidSelectedCandidateId,
  mergeGeneratedCandidates,
} from '../_lib/generated-candidates';
import {
  clearGenerationJob,
  createGenerationJobRegistry,
  getActiveGenerationJob,
  isActiveGenerationJob,
  startGenerationJob,
} from '../_lib/generation-job';
import type { GenerationJobRegistry } from '../_lib/generation-job';
import type { Candidate, Panel, StudioState } from '../_lib/types';

interface GenerationErrorState {
  kind: 'canceled' | 'failed';
  message: string;
  panelId: string;
}

interface LatestGeneratedCandidatesState {
  candidateIds: string[];
  panelId: string;
  preservedCandidateId: string | null;
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

const getGenerationJobRegistry = (
  registry: GenerationJobRegistry | null,
): GenerationJobRegistry => registry ?? createGenerationJobRegistry();

const useGeneratePanel = (
  state: StudioState,
  setState: Dispatch<SetStateAction<StudioState>>,
  selectedPanel: Panel | null,
  finalPrompt: string,
  hasGenerationPrompt: boolean,
  projectName: string,
) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPanelId, setGeneratingPanelId] = useState<string | null>(
    null,
  );
  const generationJobRegistryRef = useRef<GenerationJobRegistry | null>(null);
  const [generationError, setGenerationError] =
    useState<GenerationErrorState | null>(null);
  const [latestGeneratedCandidates, setLatestGeneratedCandidates] =
    useState<LatestGeneratedCandidatesState | null>(null);

  generationJobRegistryRef.current = getGenerationJobRegistry(
    generationJobRegistryRef.current,
  );

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
    if (!hasGenerationPrompt) {
      setPanelGenerationError(
        selectedPanel.id,
        t('studioErrors.missingPrompt'),
      );
      return;
    }

    const targetPanelId = selectedPanel.id;
    const generationRegistry = getGenerationJobRegistry(
      generationJobRegistryRef.current,
    );
    generationJobRegistryRef.current = generationRegistry;
    const generationJob = startGenerationJob(generationRegistry, {
      panelId: targetPanelId,
      projectName,
    });
    setIsGenerating(true);
    setGeneratingPanelId(targetPanelId);
    setGenerationError(null);
    setLatestGeneratedCandidates(null);

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
          signal: generationJob.controller.signal,
        },
      );
      if (!isActiveGenerationJob(generationRegistry, generationJob)) return;

      const newCandidates = apiCandidates.map(toLocalCandidate);
      if (newCandidates.length === 0) {
        setPanelGenerationError(
          targetPanelId,
          t('studioErrors.emptyGeneration'),
        );
        return;
      }

      setState((current) => {
        if (!isActiveGenerationJob(generationRegistry, generationJob)) {
          return current;
        }

        return {
          ...current,
          panels: current.panels.map((panel) =>
            panel.id === targetPanelId
              ? { ...panel, ...mergeGeneratedCandidates(panel, newCandidates) }
              : panel,
          ),
        };
      });
      if (!isActiveGenerationJob(generationRegistry, generationJob)) return;

      setLatestGeneratedCandidates({
        candidateIds: newCandidates.map((candidate) => candidate.id),
        panelId: targetPanelId,
        preservedCandidateId: getValidSelectedCandidateId(selectedPanel),
      });
    } catch (err) {
      if (!isActiveGenerationJob(generationRegistry, generationJob)) return;

      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('studioErrors.generateFailed');
      if (generationJob.controller.signal.aborted) {
        setPanelGenerationError(
          targetPanelId,
          t('studioErrors.generationCanceled'),
          'canceled',
        );
        return;
      }

      setPanelGenerationError(targetPanelId, message);
    } finally {
      if (clearGenerationJob(generationRegistry, generationJob)) {
        setIsGenerating(false);
        setGeneratingPanelId(null);
      }
    }
  };

  const handleCancelGeneration = (): void => {
    const generationRegistry = getGenerationJobRegistry(
      generationJobRegistryRef.current,
    );
    generationJobRegistryRef.current = generationRegistry;

    getActiveGenerationJob(generationRegistry)?.controller.abort();
  };

  const dismissGenerationError = (): void => setGenerationError(null);
  const selectedPanelGenerationError =
    generationError && generationError.panelId === selectedPanel?.id
      ? generationError
      : null;
  const selectedPanelLatestGeneratedCandidates =
    latestGeneratedCandidates?.panelId === selectedPanel?.id
      ? latestGeneratedCandidates
      : null;

  return {
    handleCancelGeneration,
    handleGenerateSelectedPanel,
    isGenerating,
    generatingPanelId,
    generationError: selectedPanelGenerationError?.message ?? null,
    generationErrorKind: selectedPanelGenerationError?.kind ?? null,
    latestGeneratedCandidateIds:
      selectedPanelLatestGeneratedCandidates?.candidateIds ?? [],
    latestGenerationPreservedCandidateId:
      selectedPanelLatestGeneratedCandidates?.preservedCandidateId ?? null,
    dismissGenerationError,
  };
};

export { useGeneratePanel };
