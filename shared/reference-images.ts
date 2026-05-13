import type { ReferenceImageRef } from './types.js';

interface CandidateImageSource {
  id: string;
  imageUrl: string;
}

interface PanelCandidateSource {
  id: string;
  candidates: CandidateImageSource[];
}

interface CandidateImageLocation {
  panelId: string;
  candidateId: string;
}

const CANDIDATE_IMAGE_URL_PATTERN =
  /\/candidates\/([^/?#]+)\/([^/?#]+)\.png(?:[?#].*)?$/;

const decodeUrlPart = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const getReferenceImageKey = (reference: ReferenceImageRef): string =>
  `${reference.panelId}:${reference.candidateId}`;

const parseCandidateImageUrl = (
  imageUrl: string,
): CandidateImageLocation | null => {
  const match = imageUrl.match(CANDIDATE_IMAGE_URL_PATTERN);
  if (!match) return null;

  const [, rawPanelId, rawCandidateId] = match;
  if (!rawPanelId || !rawCandidateId) return null;

  const panelId = decodeUrlPart(rawPanelId);
  const candidateId = decodeUrlPart(rawCandidateId);
  if (!panelId || !candidateId) return null;

  return { panelId, candidateId };
};

const getCandidateReference = (
  panelId: string,
  candidate: CandidateImageSource,
): ReferenceImageRef => {
  const location = parseCandidateImageUrl(candidate.imageUrl);
  if (!location) return { panelId, candidateId: candidate.id };
  if (location.candidateId !== candidate.id) {
    return { panelId, candidateId: candidate.id };
  }

  return {
    panelId: location.panelId,
    candidateId: location.candidateId,
  };
};

const buildReferenceImageLookup = (
  panels: PanelCandidateSource[],
): Map<string, ReferenceImageRef> => {
  const lookup = new Map<string, ReferenceImageRef>();

  panels.forEach((panel) => {
    panel.candidates.forEach((candidate) => {
      const canonical = getCandidateReference(panel.id, candidate);
      const legacy = { panelId: panel.id, candidateId: candidate.id };

      lookup.set(getReferenceImageKey(canonical), canonical);
      lookup.set(getReferenceImageKey(legacy), canonical);
    });
  });

  return lookup;
};

const normalizeReferenceImageRefs = (
  references: ReferenceImageRef[],
  lookup: Map<string, ReferenceImageRef>,
): ReferenceImageRef[] => {
  const normalized: ReferenceImageRef[] = [];
  const seen = new Set<string>();

  references.forEach((reference) => {
    const canonical = lookup.get(getReferenceImageKey(reference));
    if (!canonical) return;

    const key = getReferenceImageKey(canonical);
    if (seen.has(key)) return;

    seen.add(key);
    normalized.push(canonical);
  });

  return normalized;
};

export {
  buildReferenceImageLookup,
  getCandidateReference,
  getReferenceImageKey,
  normalizeReferenceImageRefs,
  parseCandidateImageUrl,
};
export type { CandidateImageLocation };
