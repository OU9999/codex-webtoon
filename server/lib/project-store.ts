import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
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

const projectPath = (name: string): string => join(ensureProjectsRoot(), name);

const validateName = (name: string): void => {
  const trimmed = name.trim();
  if (!trimmed)
    throw new ProjectError('invalid_name', 'Project name is empty.');
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

const isProjectState = (value: unknown): value is ProjectState => {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.commonPrompt === 'string' &&
    Array.isArray(obj.panels) &&
    typeof obj.selectedPanelId === 'string' &&
    (obj.selectedBubbleId === null ||
      typeof obj.selectedBubbleId === 'string') &&
    typeof obj.panelGap === 'number'
  );
};

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
    return parsed;
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
  getProject,
  listProjects,
  loadState,
  saveState,
};
