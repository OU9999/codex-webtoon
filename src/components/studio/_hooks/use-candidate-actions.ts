import type { Dispatch, SetStateAction } from 'react';
import type { Panel, StudioState } from '../_lib/types';

const useCandidateActions = (
  setState: Dispatch<SetStateAction<StudioState>>,
  patchSelectedPanel: (patch: Partial<Panel>) => void,
) => {
  const handleCandidateSelect = (candidateId: string): void => {
    patchSelectedPanel({ selectedCandidateId: candidateId });
  };

  const handleCandidateDelete = (candidateId: string): void => {
    setState((current) => {
      const deletedPanelId = current.selectedPanelId;

      return {
        ...current,
        panels: current.panels.map((panel) => {
          const referenceImages = panel.referenceImages.filter(
            (reference) =>
              reference.panelId !== deletedPanelId ||
              reference.candidateId !== candidateId,
          );

          if (panel.id !== deletedPanelId) {
            return { ...panel, referenceImages };
          }

          const candidate = panel.candidates.find(
            (item) => item.id === candidateId,
          );
          const candidates = panel.candidates.filter(
            (item) => item.id !== candidateId,
          );
          return {
            ...panel,
            candidates,
            selectedCandidateId:
              panel.selectedCandidateId === candidateId
                ? (candidates[0]?.id ?? null)
                : panel.selectedCandidateId,
            deletedCandidates: candidate
              ? [candidate, ...panel.deletedCandidates].slice(0, 5)
              : panel.deletedCandidates,
            referenceImages,
          };
        }),
      };
    });
  };

  const handleRestoreCandidate = (): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;
        if (panel.deletedCandidates.length === 0) return panel;

        const [candidate, ...deletedCandidates] = panel.deletedCandidates;
        if (!candidate) return panel;

        return {
          ...panel,
          candidates: [candidate, ...panel.candidates],
          selectedCandidateId: candidate.id,
          deletedCandidates,
        };
      }),
    }));
  };

  return {
    handleCandidateDelete,
    handleCandidateSelect,
    handleRestoreCandidate,
  };
};

export { useCandidateActions };
