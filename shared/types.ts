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
  thumbnailUrl: string | null;
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
type AuthProviderRecommendation = 'oauth' | null;

interface AuthStatus {
  codex: {
    authed: boolean;
    probe: CodexProbe;
    platform: string;
  };
  oauth: {
    state: OAuthState;
    lastError: string | null;
  };
  recommendedProvider: AuthProviderRecommendation;
  loginCommand: string;
}

type BubbleType = 'speech' | 'monologue' | 'thought' | 'sfx';
type BubbleBorderStyle = 'solid' | 'dashed' | 'dotted';
type BubbleFontFamily = 'inter' | 'mono' | 'display' | 'serif';
type BubbleFontWeight = 'regular' | 'medium' | 'bold';
type BubbleShape =
  | 'rounded'
  | 'oval'
  | 'pill'
  | 'cloud'
  | 'square'
  | 'sharp'
  | 'rough'
  | 'jagged'
  | 'custom';
type BubbleTailSide = 'none' | 'top' | 'right' | 'bottom' | 'left';

interface Bubble {
  id: string;
  type: BubbleType;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fillColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: BubbleBorderStyle;
  fontFamily?: BubbleFontFamily;
  fontWeight?: BubbleFontWeight;
  shape?: BubbleShape;
  radiusTopLeft?: number;
  radiusTopRight?: number;
  radiusBottomRight?: number;
  radiusBottomLeft?: number;
  tailSide?: BubbleTailSide;
  tailPosition?: number;
  tailWidth?: number;
  tailHeight?: number;
  tailSkew?: number;
  tailTipX?: number;
  tailTipY?: number;
}

interface Candidate {
  id: string;
  imageUrl: string;
  createdAt: string;
  promptSnapshot: string;
  height: number;
  provider: string;
}

interface ReferenceImageRef {
  source?: 'candidate' | 'external';
  panelId?: string;
  candidateId?: string;
  id?: string;
  imageUrl?: string;
  title?: string;
  createdAt?: string;
}

interface WebtoonCanvas {
  id: string;
  title: string;
  height: number;
  commonPrompt: string;
  backgroundColor: string;
}

type PanelFitMode = 'cover' | 'contain' | 'fill';

interface Panel {
  id: string;
  canvasId?: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  prompt: string;
  candidates: Candidate[];
  selectedCandidateId: string | null;
  fitMode?: PanelFitMode;
  deletedCandidates: Candidate[];
  referenceImages: ReferenceImageRef[];
  bubbles: Bubble[];
}

interface ProjectState {
  commonPrompt: string;
  canvases?: WebtoonCanvas[];
  selectedCanvasId?: string | null;
  panels: Panel[];
  selectedPanelId: string | null;
  selectedBubbleId: string | null;
  canvasHeight?: number;
  panelGap: number;
  panelGapColor: string;
  variantCount: number;
}

export type {
  ApiError,
  AuthProviderRecommendation,
  AuthStatus,
  Bubble,
  BubbleBorderStyle,
  BubbleFontFamily,
  BubbleFontWeight,
  BubbleShape,
  BubbleTailSide,
  BubbleType,
  Candidate,
  CodexProbe,
  CreateProjectRequest,
  HealthResponse,
  OAuthState,
  Panel,
  PanelFitMode,
  ProjectMeta,
  ProjectState,
  ProjectSummary,
  ReferenceImageRef,
  ServerAdvertisement,
  WebtoonCanvas,
};
