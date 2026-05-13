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
  panelId: string;
  candidateId: string;
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
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  prompt: string;
  candidates: Candidate[];
  selectedCandidateId: string | null;
  deletedCandidates: Candidate[];
  referenceImages: ReferenceImageRef[];
  bubbles: Bubble[];
}

interface StudioState {
  commonPrompt: string;
  panels: Panel[];
  selectedPanelId: string | null;
  selectedBubbleId: string | null;
  canvasHeight: number;
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
  rect: DOMRect;
  canvasHeight: number;
  historyStart: StudioState;
  pointerStartY: number;
}

interface CanvasResizeStartPayload {
  event: ReactPointerEvent<HTMLElement>;
  canvasHeight: number;
}

interface CreatePanelOverrides extends Partial<
  Pick<
    Panel,
    | 'title'
    | 'x'
    | 'y'
    | 'width'
    | 'height'
    | 'prompt'
    | 'candidates'
    | 'selectedCandidateId'
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
  pointerStartX: number;
  pointerStartY: number;
  bubbleStartX: number;
  bubbleStartY: number;
  bubbleStartWidth: number;
  bubbleStartHeight: number;
  offsetX: number;
  offsetY: number;
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
  offsetX: number;
  offsetY: number;
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
  | 'jagged'
  | 'box'
  | 'thought'
  | 'sfx';

interface LayerAction {
  id: LayerActionId;
  type: BubbleType;
  label: string;
  icon: ReactNode;
  patch?: Partial<Bubble>;
}

export type {
  Bubble,
  BubbleBorderStyle,
  BubbleDrag,
  BubbleDragMode,
  BubbleResizeAnchor,
  BubbleDragStartPayload,
  BubbleFontFamily,
  BubbleFontWeight,
  BubbleShape,
  BubbleTailSide,
  BubbleType,
  CanvasResize,
  CanvasResizeStartPayload,
  Candidate,
  CandidateProvider,
  CreatePanelOverrides,
  LayerAction,
  LayerActionId,
  Panel,
  PanelResizeHandle,
  PanelTransform,
  PanelTransformMode,
  PanelTransformStartPayload,
  ReferenceImageRef,
  StudioState,
  StudioStateSetter,
};
