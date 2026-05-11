import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

type BubbleType = 'speech' | 'monologue' | 'thought' | 'sfx';
type BubbleDragMode = 'move' | 'resize' | 'tail';
type BubbleResizeAnchor = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
type BubbleBorderStyle = 'solid' | 'dashed' | 'dotted';
type BubbleFontFamily = 'inter' | 'mono' | 'display' | 'serif';
type BubbleFontWeight = 'regular' | 'medium' | 'bold' | 'black';
type BubbleShape =
  | 'rounded'
  | 'pill'
  | 'cloud'
  | 'square'
  | 'sharp'
  | 'rough'
  | 'burst'
  | 'custom';
type BubbleTailSide = 'none' | 'top' | 'right' | 'bottom' | 'left';

type CandidateProvider = 'local-mock' | 'openai';

interface Candidate {
  id: string;
  imageUrl: string;
  createdAt: string;
  promptSnapshot: string;
  height: number;
  provider: CandidateProvider;
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
  height: number;
  prompt: string;
  candidates: Candidate[];
  selectedCandidateId: string | null;
  deletedCandidates: Candidate[];
  bubbles: Bubble[];
}

interface StudioState {
  commonPrompt: string;
  panels: Panel[];
  selectedPanelId: string;
  selectedBubbleId: string | null;
  panelGap: number;
  variantCount: number;
}

interface CreatePanelOverrides extends Partial<
  Pick<
    Panel,
    | 'title'
    | 'height'
    | 'prompt'
    | 'candidates'
    | 'selectedCandidateId'
    | 'bubbles'
  >
> {}

interface BubbleDrag {
  mode: BubbleDragMode;
  panelId: string;
  bubbleId: string;
  resizeAnchor?: BubbleResizeAnchor;
  rect: DOMRect;
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
}

interface LayerAction {
  type: BubbleType;
  label: string;
  icon: ReactNode;
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
  Candidate,
  CandidateProvider,
  CreatePanelOverrides,
  LayerAction,
  Panel,
  StudioState,
};
