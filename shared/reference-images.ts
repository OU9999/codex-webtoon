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

interface ExternalReferenceImageInput {
  id?: string;
  imageUrl: string;
  title?: string;
  createdAt?: string;
}

const CANDIDATE_IMAGE_URL_PATTERN =
  /\/candidates\/([^/?#]+)\/([^/?#]+)\.png(?:[?#].*)?$/;

const isExternalReferenceImage = (reference: ReferenceImageRef): boolean =>
  reference.source === 'external';

const isCandidateReferenceImage = (reference: ReferenceImageRef): boolean =>
  reference.source !== 'external' &&
  typeof reference.panelId === 'string' &&
  typeof reference.candidateId === 'string';

const decodeUrlPart = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const normalizeExternalReferenceImage = (
  reference: ExternalReferenceImageInput,
): ReferenceImageRef => {
  const imageUrl = reference.imageUrl.trim();
  const id = reference.id?.trim() || imageUrl;
  const title = reference.title?.trim();
  const createdAt = reference.createdAt?.trim();

  return {
    source: 'external',
    id,
    imageUrl,
    ...(title ? { title } : {}),
    ...(createdAt ? { createdAt } : {}),
  };
};

const getReferenceImageKey = (reference: ReferenceImageRef): string => {
  if (isExternalReferenceImage(reference)) {
    return `external:${reference.id ?? reference.imageUrl ?? ''}`;
  }

  return `candidate:${reference.panelId ?? ''}:${reference.candidateId ?? ''}`;
};

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
  if (!location) {
    return { source: 'candidate', panelId, candidateId: candidate.id };
  }
  if (location.candidateId !== candidate.id) {
    return { source: 'candidate', panelId, candidateId: candidate.id };
  }

  return {
    source: 'candidate',
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
    if (isExternalReferenceImage(reference)) {
      if (
        typeof reference.imageUrl !== 'string' ||
        !reference.imageUrl.trim()
      ) {
        return;
      }

      const externalReference = normalizeExternalReferenceImage({
        id: reference.id,
        imageUrl: reference.imageUrl,
        title: reference.title,
        createdAt: reference.createdAt,
      });
      const externalKey = getReferenceImageKey(externalReference);
      if (seen.has(externalKey)) return;

      seen.add(externalKey);
      normalized.push(externalReference);
      return;
    }

    if (!isCandidateReferenceImage(reference)) return;

    const canonical = lookup.get(getReferenceImageKey(reference));
    if (!canonical) return;

    const key = getReferenceImageKey(canonical);
    if (seen.has(key)) return;

    seen.add(key);
    normalized.push(canonical);
  });

  return normalized;
};

const isReferenceImageRef = (value: unknown): value is ReferenceImageRef => {
  if (!value || typeof value !== 'object') return false;
  const reference = value as Record<string, unknown>;

  if (reference.source === 'external') {
    return (
      typeof reference.imageUrl === 'string' &&
      (reference.id === undefined || typeof reference.id === 'string') &&
      (reference.title === undefined || typeof reference.title === 'string') &&
      (reference.createdAt === undefined ||
        typeof reference.createdAt === 'string')
    );
  }

  return (
    (reference.source === undefined || reference.source === 'candidate') &&
    typeof reference.panelId === 'string' &&
    typeof reference.candidateId === 'string'
  );
};

export {
  buildReferenceImageLookup,
  getCandidateReference,
  getReferenceImageKey,
  isCandidateReferenceImage,
  isExternalReferenceImage,
  isReferenceImageRef,
  normalizeReferenceImageRefs,
  normalizeExternalReferenceImage,
  parseCandidateImageUrl,
};
export type { CandidateImageLocation, ExternalReferenceImageInput };
