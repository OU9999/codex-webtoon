import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ulid } from 'ulid';
import { config } from '../config.js';

const CANDIDATES_DIR = 'candidates';
const PANEL_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

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

const candidatesDir = (projectDir: string, panelId: string): string => {
  const dir = join(projectDir, CANDIDATES_DIR, ensurePanelId(panelId));
  mkdirSync(dir, { recursive: true });
  return dir;
};

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

const projectsStaticRoot = (): string => config.storage.projectsRoot;

export { CANDIDATES_DIR, ImageStoreError, projectsStaticRoot, saveCandidate };
export type { SavedCandidate };
