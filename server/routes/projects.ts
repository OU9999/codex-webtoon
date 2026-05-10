import { Router } from 'express';
import {
  ProjectError,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  loadState,
  saveState,
} from '../lib/project-store.js';
import type { ApiError, CreateProjectRequest } from '../../shared/types.js';

const errorStatus: Record<string, number> = {
  invalid_name: 400,
  invalid_state: 400,
  project_exists: 409,
  project_not_found: 404,
};

const sendError = (res: import('express').Response, err: unknown): void => {
  if (err instanceof ProjectError) {
    const status = errorStatus[err.code] ?? 500;
    const body: ApiError = { error: err.code, message: err.message };
    res.status(status).json(body);
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  const body: ApiError = { error: 'internal', message };
  res.status(500).json(body);
};

const projectsRouter = Router();

projectsRouter.get('/', (_req, res) => {
  try {
    res.json(listProjects());
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.post('/', (req, res) => {
  const { name } = (req.body ?? {}) as Partial<CreateProjectRequest>;
  if (typeof name !== 'string') {
    const body: ApiError = {
      error: 'invalid_name',
      message: 'name must be a string.',
    };
    res.status(400).json(body);
    return;
  }

  try {
    res.status(201).json(createProject(name));
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.get('/:name', (req, res) => {
  try {
    res.json(getProject(req.params.name));
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.get('/:name/state', (req, res) => {
  try {
    const state = loadState(req.params.name);
    if (!state) {
      res.status(204).end();
      return;
    }
    res.json(state);
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.put('/:name/state', (req, res) => {
  try {
    saveState(req.params.name, req.body);
    res.status(204).end();
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.delete('/:name', (req, res) => {
  try {
    deleteProject(req.params.name);
    res.status(204).end();
  } catch (err) {
    sendError(res, err);
  }
});

export { projectsRouter };
