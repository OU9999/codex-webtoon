import type {
  ApiError,
  AuthStatus,
  Candidate,
  ProjectMeta,
  ProjectState,
  ProjectSummary,
  ReferenceImageRef,
} from '../../shared/types';

interface GenerateCandidateRequest {
  projectName: string;
  panelId: string;
  prompt: string;
  height: number;
  count?: number;
  provider?: 'auto' | 'oauth';
  referenceImages?: ReferenceImageRef[];
}

class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const parseError = async (response: Response): Promise<ApiClientError> => {
  let payload: Partial<ApiError> = {};
  try {
    payload = (await response.json()) as Partial<ApiError>;
  } catch {}

  return new ApiClientError(
    response.status,
    payload.error ?? `http_${response.status}`,
    payload.message ?? response.statusText,
  );
};

const requestJson = async <T>(
  input: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
};

const requestVoid = async (
  input: string,
  init?: RequestInit,
): Promise<void> => {
  const response = await fetch(input, init);
  if (!response.ok) throw await parseError(response);
};

const listProjects = (): Promise<ProjectSummary[]> =>
  requestJson<ProjectSummary[]>('/api/projects');

const createProject = (name: string): Promise<ProjectSummary> =>
  requestJson<ProjectSummary>('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

const renameProject = (
  currentName: string,
  nextName: string,
): Promise<ProjectSummary> =>
  requestJson<ProjectSummary>(
    `/api/projects/${encodeURIComponent(currentName)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nextName }),
    },
  );

const getProject = (name: string): Promise<ProjectMeta> =>
  requestJson<ProjectMeta>(`/api/projects/${encodeURIComponent(name)}`);

const loadProjectState = async (name: string): Promise<ProjectState | null> => {
  const response = await fetch(
    `/api/projects/${encodeURIComponent(name)}/state`,
  );
  if (response.status === 204) return null;
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as ProjectState;
};

const saveProjectState = (name: string, state: ProjectState): Promise<void> =>
  requestVoid(`/api/projects/${encodeURIComponent(name)}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });

const generateCandidates = (
  request: GenerateCandidateRequest,
): Promise<Candidate[]> =>
  requestJson<Candidate[]>('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

const deleteProject = (name: string): Promise<void> =>
  requestVoid(`/api/projects/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });

const getAuthStatus = (): Promise<AuthStatus> =>
  requestJson<AuthStatus>('/api/auth/status');

export {
  ApiClientError,
  createProject,
  deleteProject,
  generateCandidates,
  getAuthStatus,
  getProject,
  listProjects,
  loadProjectState,
  renameProject,
  saveProjectState,
};
export type { GenerateCandidateRequest };
