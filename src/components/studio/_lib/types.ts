import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  SetStateAction,
} from 'react';

type BubbleType = 'speech' | 'monologue' | 'thought' | 'sfx';
type BubbleDragMode = 'move' | 'resize' | 'tail';
type BubbleResizeAnchor = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
type BubbleBorderStyle = 'solid' | 'dashed' | 'dotted';
type BubbleFontFamily = 'inter' | 'mono' | 'display' | 'serif';
type BubbleFontWeight = 'regular' | 'medium' | 'bold';
type BubbleImpactStyle =
  | 'impact-thought-thick'
  | 'shock-thought-thick'
  | 'simple-thought-thick';
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
type PanelTransformMode = 'move' | 'resize';
type PanelResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
type PanelFitMode = 'cover' | 'contain' | 'fill';
type SidebarDropPosition = 'before' | 'after';

type CandidateProvider = 'local-mock' | 'oauth' | 'openai';

interface Candidate {
  id: string;
  imageUrl: string;
  createdAt: string;
  promptSnapshot: string;
  height: number;
  provider: CandidateProvider;
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
  impactStyle?: BubbleImpactStyle;
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

interface Panel {
  id: string;
  canvasId: string;
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

interface StudioState {
  commonPrompt: string;
  canvases: WebtoonCanvas[];
  selectedCanvasId: string;
  panels: Panel[];
  selectedPanelId: string | null;
  selectedBubbleId: string | null;
  selectedPanelIds?: string[];
  selectedBubbleIds?: string[];
  panelGap: number;
  panelGapColor: string;
  variantCount: number;
}

interface StudioStateSetter {
  (action: SetStateAction<StudioState>): void;
  transient: (action: SetStateAction<StudioState>) => void;
  commitHistory: (previous: StudioState) => void;
  getSnapshot: () => StudioState;
}

interface CanvasResize {
  canvasId: string;
  rect: DOMRect;
  canvasHeight: number;
  historyStart: StudioState;
  lastClientY: number;
  pointerStartY: number;
  scrollContainer: HTMLElement | null;
  scrollFrame: number | null;
  scrollStartTop: number;
}

interface CanvasResizeStartPayload {
  event: ReactPointerEvent<HTMLElement>;
  canvasId: string;
  canvasHeight: number;
}

interface CreateCanvasOverrides extends Partial<
  Pick<WebtoonCanvas, 'title' | 'height' | 'commonPrompt' | 'backgroundColor'>
> {}

interface CreatePanelOverrides extends Partial<
  Pick<
    Panel,
    | 'canvasId'
    | 'title'
    | 'x'
    | 'y'
    | 'width'
    | 'height'
    | 'prompt'
    | 'candidates'
    | 'selectedCandidateId'
    | 'fitMode'
    | 'referenceImages'
    | 'bubbles'
  >
> {}

interface BubbleDrag {
  mode: BubbleDragMode;
  panelId: string;
  bubbleId: string;
  resizeAnchor?: BubbleResizeAnchor;
  rect: DOMRect;
  canvasHeight: number;
  historyStart: StudioState;
  panelX: number;
  panelY: number;
  panelHeight: number;
  panelStartPositions: PanelTransformStartPosition[];
  bubbleStartPositions: BubbleDragStartPosition[];
  pointerStageStartX: number;
  pointerStageStartY: number;
  pointerStartX: number;
  pointerStartY: number;
  bubbleStartX: number;
  bubbleStartY: number;
  bubbleStartWidth: number;
  bubbleStartHeight: number;
  offsetX: number;
  offsetY: number;
}

interface BubbleDragStartPosition {
  bubbleId: string;
  panelId: string;
  startX: number;
  startY: number;
  startStageX: number;
  startStageY: number;
}

interface BubbleDragStartPayload {
  event: ReactPointerEvent<HTMLElement>;
  bubble: Bubble;
  panel: Panel;
  mode: BubbleDragMode;
  resizeAnchor?: BubbleResizeAnchor;
  canvasHeight: number;
}

interface PanelTransform {
  mode: PanelTransformMode;
  panelId: string;
  resizeHandle: PanelResizeHandle | null;
  rect: DOMRect;
  canvasHeight: number;
  historyStart: StudioState;
  panelStartPositions: PanelTransformStartPosition[];
  bubbleStartPositions: BubbleDragStartPosition[];
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

interface PanelTransformStartPosition {
  panelId: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

interface PanelTransformStartPayload {
  event: ReactPointerEvent<HTMLElement>;
  panel: Panel;
  mode: PanelTransformMode;
  resizeHandle?: PanelResizeHandle;
  canvasHeight: number;
}

type LayerActionId =
  | 'speech'
  | 'oval'
  | 'cloud'
  | 'impact-thought-thick'
  | 'shock-thought-thick'
  | 'simple-thought-thick'
  | 'box'
  | 'thought'
  | 'sfx';

interface LayerAction {
  id: LayerActionId;
  type: BubbleType;
  label: string;
  labelKey?: string;
  icon: ReactNode;
  patch?: Partial<Bubble>;
}

export type {
  Bubble,
  BubbleBorderStyle,
  BubbleDrag,
  BubbleDragStartPosition,
  BubbleDragMode,
  BubbleResizeAnchor,
  BubbleDragStartPayload,
  BubbleFontFamily,
  BubbleFontWeight,
  BubbleImpactStyle,
  BubbleShape,
  BubbleTailSide,
  BubbleType,
  CanvasResize,
  CanvasResizeStartPayload,
  Candidate,
  CandidateProvider,
  CreateCanvasOverrides,
  CreatePanelOverrides,
  LayerAction,
  LayerActionId,
  Panel,
  PanelFitMode,
  PanelResizeHandle,
  PanelTransform,
  PanelTransformStartPosition,
  PanelTransformMode,
  SidebarDropPosition,
  PanelTransformStartPayload,
  ReferenceImageRef,
  StudioState,
  StudioStateSetter,
  WebtoonCanvas,
};
