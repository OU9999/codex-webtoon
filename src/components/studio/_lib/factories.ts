import {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_ID,
  DEFAULT_PANEL_GAP_COLOR,
  WEBTOON_CANVAS_WIDTH,
} from '@shared/project-state';
import type {
  Bubble,
  BubbleType,
  CreateCanvasOverrides,
  CreatePanelOverrides,
  Panel,
  WebtoonCanvas,
} from './types';
import { DEFAULT_BUBBLE_STYLE, getBubbleShapePatch } from './bubble-style';

const createWebtoonCanvas = (
  overrides: CreateCanvasOverrides = {},
): WebtoonCanvas => {
  return {
    id: crypto.randomUUID(),
    title: overrides.title ?? 'Canvas',
    height: overrides.height ?? DEFAULT_CANVAS_HEIGHT,
    commonPrompt: overrides.commonPrompt ?? '',
    backgroundColor: overrides.backgroundColor ?? DEFAULT_PANEL_GAP_COLOR,
  };
};

const createPanel = (overrides: CreatePanelOverrides = {}): Panel => {
  return {
    id: crypto.randomUUID(),
    canvasId: overrides.canvasId ?? DEFAULT_CANVAS_ID,
    title: overrides.title ?? 'New panel',
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    width: overrides.width ?? WEBTOON_CANVAS_WIDTH,
    height: overrides.height ?? 420,
    prompt: overrides.prompt ?? '',
    candidates: overrides.candidates ?? [],
    selectedCandidateId: overrides.selectedCandidateId ?? null,
    deletedCandidates: [],
    referenceImages: overrides.referenceImages ?? [],
    bubbles: overrides.bubbles ?? [],
  };
};

const createBubble = (type: BubbleType): Bubble => {
  const defaults: Record<BubbleType, Omit<Bubble, 'id' | 'type'>> = {
    speech: {
      text: 'Dialogue',
      x: 58,
      y: 40,
      width: 210,
      height: 74,
      fontSize: 24,
    },
    monologue: {
      text: 'Narration',
      x: 46,
      y: 56,
      width: 250,
      height: 78,
      fontSize: 22,
      ...getBubbleShapePatch('square'),
    },
    thought: {
      text: 'Thought',
      x: 390,
      y: 54,
      width: 210,
      height: 76,
      fontSize: 22,
      borderStyle: 'dashed',
    },
    sfx: {
      text: 'Tap',
      x: 420,
      y: 170,
      width: 150,
      height: 82,
      fontSize: 48,
      borderWidth: 0,
      fontFamily: 'display',
      fontWeight: 'bold',
    },
  };

  return {
    id: crypto.randomUUID(),
    type,
    ...DEFAULT_BUBBLE_STYLE,
    ...defaults[type],
  };
};

export { createBubble, createPanel, createWebtoonCanvas };
