interface ServerAdvertisement {
  port: number;
  url: string;
  pid: number;
  startedAt: number;
  version: string;
}

interface HealthResponse {
  ok: true;
  version: string;
  startedAt: number;
}

interface ProjectMeta {
  name: string;
  version: 1;
  createdAt: number;
  updatedAt: number;
}

interface ProjectSummary {
  name: string;
  path: string;
  createdAt: number;
  updatedAt: number;
}

interface CreateProjectRequest {
  name: string;
}

interface ApiError {
  error: string;
  message: string;
}

type CodexProbe = 'authed' | 'unauthed' | 'missing';
type OAuthState = 'disabled' | 'pending' | 'ready' | 'failed';
type AuthProviderRecommendation = 'oauth' | 'openai' | null;

interface AuthStatus {
  codex: {
    authed: boolean;
    probe: CodexProbe;
    platform: string;
  };
  oauth: {
    state: OAuthState;
    url: string | null;
    port: number | null;
    lastError: string | null;
  };
  apiKey: { available: boolean };
  recommendedProvider: AuthProviderRecommendation;
  loginCommand: string;
}

type BubbleType = 'speech' | 'monologue' | 'thought' | 'sfx';

interface Bubble {
  id: string;
  type: BubbleType;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

interface Candidate {
  id: string;
  imageUrl: string;
  createdAt: string;
  promptSnapshot: string;
  height: number;
  provider: string;
}

interface Panel {
  id: string;
  title: string;
  height: number;
  prompt: string;
  candidates: Candidate[];
  selectedCandidateId: string | null;
  deletedCandidates: Candidate[];
  bubbles: Bubble[];
}

interface ProjectState {
  commonPrompt: string;
  panels: Panel[];
  selectedPanelId: string;
  selectedBubbleId: string | null;
  panelGap: number;
  variantCount: number;
}

export type {
  ApiError,
  AuthProviderRecommendation,
  AuthStatus,
  Bubble,
  BubbleType,
  Candidate,
  CodexProbe,
  CreateProjectRequest,
  HealthResponse,
  OAuthState,
  Panel,
  ProjectMeta,
  ProjectState,
  ProjectSummary,
  ServerAdvertisement,
};
