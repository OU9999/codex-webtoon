import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ApiClientError, generateCandidate } from '@/api/client';
import type { Candidate as ApiCandidate } from '../../../../shared/types';
import type { Candidate, Panel, StudioState } from '../_lib/types';

const toLocalCandidate = (candidate: ApiCandidate): Candidate => ({
  id: candidate.id,
  imageUrl: candidate.imageUrl,
  createdAt: candidate.createdAt,
  promptSnapshot: candidate.promptSnapshot,
  height: candidate.height,
  provider: candidate.provider === 'openai' ? 'openai' : 'local-mock',
});

const useGeneratePanel = (
  _state: StudioState,
  setState: Dispatch<SetStateAction<StudioState>>,
  selectedPanel: Panel | undefined,
  finalPrompt: string,
  projectName: string,
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateSelectedPanel = async (): Promise<void> => {
    if (!selectedPanel) return;
    if (isGenerating) return;
    if (!finalPrompt.trim()) {
      setGenerationError('프롬프트를 입력하세요.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const apiCandidate = await generateCandidate({
        projectName,
        panelId: selectedPanel.id,
        prompt: finalPrompt,
        height: selectedPanel.height,
      });
      const candidate = toLocalCandidate(apiCandidate);

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
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : '이미지 생성에 실패했습니다.';
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const dismissGenerationError = (): void => setGenerationError(null);

  return {
    handleGenerateSelectedPanel,
    isGenerating,
    generationError,
    dismissGenerationError,
  };
};

export { useGeneratePanel };
