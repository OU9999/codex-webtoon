import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

type BubbleType = 'speech' | 'monologue' | 'thought' | 'sfx';
type BubbleDragMode = 'move' | 'resize';

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
  rect: DOMRect;
  panelHeight: number;
  offsetX: number;
  offsetY: number;
}

interface BubbleDragStartPayload {
  event: ReactPointerEvent<HTMLElement>;
  bubble: Bubble;
  panel: Panel;
  mode: BubbleDragMode;
}

interface LayerAction {
  type: BubbleType;
  label: string;
  icon: ReactNode;
}

export type {
  Bubble,
  BubbleDrag,
  BubbleDragMode,
  BubbleDragStartPayload,
  BubbleType,
  Candidate,
  CandidateProvider,
  CreatePanelOverrides,
  LayerAction,
  Panel,
  StudioState,
};
