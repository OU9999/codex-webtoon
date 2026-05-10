import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { config } from '../config.js';
import type {
  ProjectMeta,
  ProjectState,
  ProjectSummary,
} from '../../shared/types.js';

const PROJECT_FILE = 'project.json';
const STATE_FILE = 'state.json';
const NAME_PATTERN = /^[\p{L}\p{N}_\-. ]{1,64}$/u;

class ProjectError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ProjectError';
  }
}

const ensureProjectsRoot = (): string => {
  const root = config.storage.projectsRoot;
  mkdirSync(root, { recursive: true });
  return root;
};

const projectPath = (name: string): string => {
  validateName(name);
  const root = resolve(ensureProjectsRoot());
  const candidate = resolve(root, name.trim());
  if (dirname(candidate) !== root) {
    throw new ProjectError(
      'invalid_name',
      'Project name resolves outside the projects directory.',
    );
  }
  return candidate;
};

const validateName = (name: string): void => {
  const trimmed = name.trim();
  if (!trimmed)
    throw new ProjectError('invalid_name', 'Project name is empty.');
  if (trimmed === '.' || trimmed === '..') {
    throw new ProjectError(
      'invalid_name',
      'Project name cannot be "." or "..".',
    );
  }
  if (!NAME_PATTERN.test(trimmed)) {
    throw new ProjectError(
      'invalid_name',
      'Project name may only contain letters, numbers, spaces, dot, dash, and underscore (1–64 chars).',
    );
  }
};

const readProjectMeta = (dir: string): ProjectMeta | null => {
  const file = join(dir, PROJECT_FILE);
  if (!existsSync(file)) return null;

  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as ProjectMeta;
  } catch {
    return null;
  }
};

const writeProjectMeta = (dir: string, meta: ProjectMeta): void => {
  writeFileSync(join(dir, PROJECT_FILE), JSON.stringify(meta, null, 2));
};

const createProject = (rawName: string): ProjectSummary => {
  validateName(rawName);
  const name = rawName.trim();
  const dir = projectPath(name);

  if (existsSync(dir)) {
    throw new ProjectError(
      'project_exists',
      `Project "${name}" already exists.`,
    );
  }

  mkdirSync(dir, { recursive: true });
  const now = Date.now();
  const meta: ProjectMeta = {
    name,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  writeProjectMeta(dir, meta);

  return {
    name,
    path: dir,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
  };
};

const listProjects = (): ProjectSummary[] => {
  const root = ensureProjectsRoot();
  const entries = readdirSync(root, { withFileTypes: true });
  const summaries: ProjectSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const dir = join(root, entry.name);
    const meta = readProjectMeta(dir);
    if (!meta) continue;

    summaries.push({
      name: meta.name,
      path: dir,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
    });
  }

  summaries.sort((a, b) => b.updatedAt - a.updatedAt);
  return summaries;
};

const getProject = (name: string): ProjectMeta => {
  validateName(name);
  const dir = projectPath(name.trim());
  const meta = readProjectMeta(dir);
  if (!meta)
    throw new ProjectError('project_not_found', `Project "${name}" not found.`);

  const stat = statSync(join(dir, PROJECT_FILE));
  meta.updatedAt = stat.mtimeMs;
  return meta;
};

const getProjectDir = (name: string): string => {
  validateName(name);
  const dir = projectPath(name.trim());
  if (!readProjectMeta(dir)) {
    throw new ProjectError('project_not_found', `Project "${name}" not found.`);
  }
  return dir;
};

const touchProject = (name: string): void => {
  const dir = projectPath(name.trim());
  const meta = readProjectMeta(dir);
  if (!meta) return;
  meta.updatedAt = Date.now();
  writeProjectMeta(dir, meta);
};

const deleteProject = (name: string): void => {
  validateName(name);
  const dir = projectPath(name.trim());
  if (!readProjectMeta(dir)) {
    throw new ProjectError('project_not_found', `Project "${name}" not found.`);
  }
  rmSync(dir, { recursive: true, force: true });
};

const isBubble = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.type === 'string' &&
    typeof b.text === 'string' &&
    typeof b.x === 'number' &&
    typeof b.y === 'number' &&
    typeof b.width === 'number' &&
    typeof b.height === 'number' &&
    typeof b.fontSize === 'number'
  );
};

const isCandidate = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.imageUrl === 'string' &&
    typeof c.createdAt === 'string' &&
    typeof c.promptSnapshot === 'string' &&
    typeof c.height === 'number' &&
    typeof c.provider === 'string'
  );
};

const isPanel = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.title === 'string' &&
    typeof p.height === 'number' &&
    typeof p.prompt === 'string' &&
    Array.isArray(p.candidates) &&
    p.candidates.every(isCandidate) &&
    (p.selectedCandidateId === null ||
      typeof p.selectedCandidateId === 'string') &&
    Array.isArray(p.deletedCandidates) &&
    p.deletedCandidates.every(isCandidate) &&
    Array.isArray(p.bubbles) &&
    p.bubbles.every(isBubble)
  );
};

const isProjectState = (value: unknown): value is ProjectState => {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.commonPrompt === 'string' &&
    Array.isArray(obj.panels) &&
    obj.panels.every(isPanel) &&
    typeof obj.selectedPanelId === 'string' &&
    (obj.selectedBubbleId === null ||
      typeof obj.selectedBubbleId === 'string') &&
    typeof obj.panelGap === 'number' &&
    (obj.variantCount === undefined || typeof obj.variantCount === 'number')
  );
};

const normalizeProjectState = (state: ProjectState): ProjectState => ({
  ...state,
  variantCount:
    typeof state.variantCount === 'number' && state.variantCount >= 1
      ? Math.min(4, Math.trunc(state.variantCount))
      : 1,
});

const loadState = (name: string): ProjectState | null => {
  validateName(name);
  const dir = projectPath(name.trim());
  if (!readProjectMeta(dir)) {
    throw new ProjectError('project_not_found', `Project "${name}" not found.`);
  }

  const file = join(dir, STATE_FILE);
  if (!existsSync(file)) return null;

  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as unknown;
    if (!isProjectState(parsed)) {
      throw new ProjectError(
        'invalid_state',
        `Project "${name}" has corrupted state.`,
      );
    }
    return normalizeProjectState(parsed);
  } catch (err) {
    if (err instanceof ProjectError) throw err;
    throw new ProjectError(
      'invalid_state',
      `Failed to read state for "${name}".`,
    );
  }
};

const saveState = (name: string, state: unknown): void => {
  validateName(name);
  if (!isProjectState(state)) {
    throw new ProjectError('invalid_state', 'Project state shape is invalid.');
  }

  const dir = projectPath(name.trim());
  const meta = readProjectMeta(dir);
  if (!meta) {
    throw new ProjectError('project_not_found', `Project "${name}" not found.`);
  }

  writeFileSync(join(dir, STATE_FILE), JSON.stringify(state, null, 2));
  meta.updatedAt = Date.now();
  writeProjectMeta(dir, meta);
};

export {
  ProjectError,
  createProject,
  deleteProject,
  getProject,
  getProjectDir,
  listProjects,
  loadState,
  saveState,
  touchProject,
};
