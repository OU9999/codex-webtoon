import type { Candidate, Panel } from './types';

interface MergeGeneratedCandidatesResult {
  candidates: Candidate[];
  selectedCandidateId: string | null;
}

const getValidSelectedCandidateId = (panel: Panel): string | null => {
  if (!panel.selectedCandidateId) return null;
  const hasSelectedCandidate = panel.candidates.some(
    (candidate) => candidate.id === panel.selectedCandidateId,
  );

  return hasSelectedCandidate ? panel.selectedCandidateId : null;
};

const mergeGeneratedCandidates = (
  panel: Panel,
  generatedCandidates: Candidate[],
): MergeGeneratedCandidatesResult => {
  const selectedCandidateId = getValidSelectedCandidateId(panel);
  const nextSelectedCandidateId =
    selectedCandidateId ??
    (panel.candidates.length === 0
      ? (generatedCandidates[0]?.id ?? null)
      : null);

  return {
    candidates: [...panel.candidates, ...generatedCandidates],
    selectedCandidateId: nextSelectedCandidateId,
  };
};

export { getValidSelectedCandidateId, mergeGeneratedCandidates };
export type { MergeGeneratedCandidatesResult };
