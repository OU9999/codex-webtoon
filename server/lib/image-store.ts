import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { ulid } from 'ulid';
import { config } from '../config.js';
import type { ReferenceImageRef } from '../../shared/types.js';

const CANDIDATES_DIR = 'candidates';
const PANEL_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const CANDIDATE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

class ImageStoreError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ImageStoreError';
  }
}

const ensurePanelId = (panelId: string): string => {
  if (!PANEL_ID_PATTERN.test(panelId)) {
    throw new ImageStoreError('invalid_panel_id', 'panelId is invalid.');
  }
  return panelId;
};

const ensureCandidateId = (candidateId: string): string => {
  if (!CANDIDATE_ID_PATTERN.test(candidateId)) {
    throw new ImageStoreError(
      'invalid_candidate_id',
      'candidateId is invalid.',
    );
  }
  return candidateId;
};

const candidatesDir = (projectDir: string, panelId: string): string => {
  const dir = join(projectDir, CANDIDATES_DIR, ensurePanelId(panelId));
  mkdirSync(dir, { recursive: true });
  return dir;
};

const candidatePngPath = (
  projectDir: string,
  panelId: string,
  candidateId: string,
): string =>
  join(
    projectDir,
    CANDIDATES_DIR,
    ensurePanelId(panelId),
    `${ensureCandidateId(candidateId)}.png`,
  );

const findCandidatePngPath = (
  projectDir: string,
  candidateId: string,
): string | null => {
  const safeCandidateId = ensureCandidateId(candidateId);
  const root = join(projectDir, CANDIDATES_DIR);
  if (!existsSync(root)) return null;

  const panelDirs = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const panelDir of panelDirs) {
    const pngPath = join(root, panelDir, `${safeCandidateId}.png`);
    if (existsSync(pngPath)) return pngPath;
  }

  return null;
};

interface ReadCandidatePngInput {
  projectDir: string;
  panelId: string;
  candidateId: string;
}

interface SaveCandidateInput {
  projectName: string;
  projectDir: string;
  panelId: string;
  pngBuffer: Buffer;
  metadata: {
    promptSnapshot: string;
    height: number;
    provider: string;
    model: string;
    size: string;
    referenceImages?: ReferenceImageRef[];
  };
}

interface SavedCandidate {
  id: string;
  imageUrl: string;
  createdAt: string;
  promptSnapshot: string;
  height: number;
  provider: string;
}

const saveCandidate = (input: SaveCandidateInput): SavedCandidate => {
  const { projectName, projectDir, panelId, pngBuffer, metadata } = input;
  const dir = candidatesDir(projectDir, panelId);
  const id = ulid();
  const pngPath = join(dir, `${id}.png`);
  const metaPath = join(dir, `${id}.json`);
  const createdAt = new Date().toISOString();

  writeFileSync(pngPath, pngBuffer);
  const metaPayload = {
    id,
    createdAt,
    panelId,
    ...metadata,
  };
  writeFileSync(metaPath, JSON.stringify(metaPayload, null, 2));

  const encodedProject = encodeURIComponent(projectName);
  const encodedPanel = encodeURIComponent(panelId);
  const imageUrl = `/projects/${encodedProject}/${CANDIDATES_DIR}/${encodedPanel}/${id}.png`;

  return {
    id,
    imageUrl,
    createdAt,
    promptSnapshot: metadata.promptSnapshot,
    height: metadata.height,
    provider: metadata.provider,
  };
};

const readCandidatePng = (input: ReadCandidatePngInput): Buffer => {
  try {
    return readFileSync(
      candidatePngPath(input.projectDir, input.panelId, input.candidateId),
    );
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === 'ENOENT'
    ) {
      const fallbackPath = findCandidatePngPath(
        input.projectDir,
        input.candidateId,
      );
      if (fallbackPath) return readFileSync(fallbackPath);

      throw new ImageStoreError(
        'reference_image_not_found',
        'Reference image was not found.',
      );
    }

    throw err;
  }
};

const projectsStaticRoot = (): string => config.storage.projectsRoot;

export {
  CANDIDATES_DIR,
  ImageStoreError,
  projectsStaticRoot,
  readCandidatePng,
  saveCandidate,
};
export type { SavedCandidate };
