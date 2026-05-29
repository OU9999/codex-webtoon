import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFinalPrompt } from '../src/components/studio/_lib/prompt.ts';
import type { Panel } from '../src/components/studio/_lib/types.ts';

const createPanel = (overrides: Partial<Panel> = {}): Panel => ({
  id: 'panel-1',
  canvasId: 'canvas-1',
  title: 'Panel 1',
  x: 0,
  y: 0,
  width: 720,
  height: 420,
  prompt: 'quiet close-up',
  candidates: [],
  selectedCandidateId: null,
  deletedCandidates: [],
  referenceImages: [],
  bubbles: [],
  ...overrides,
});

test('buildFinalPrompt describes landscape panels without vertical framing', () => {
  const prompt = buildFinalPrompt({
    projectCommonPrompt: '',
    canvasCommonPrompt: '',
    panel: createPanel(),
  });

  assert.match(prompt, /landscape webtoon panel/);
  assert.match(prompt, /fill the entire frame edge-to-edge/);
  assert.match(prompt, /Do not create blank margins/);
  assert.doesNotMatch(prompt, /vertical webtoon panel/);
});

test('buildFinalPrompt describes portrait panels by actual aspect ratio', () => {
  const prompt = buildFinalPrompt({
    projectCommonPrompt: '',
    canvasCommonPrompt: '',
    panel: createPanel({ width: 420, height: 720 }),
  });

  assert.match(prompt, /portrait webtoon panel/);
  assert.match(prompt, /420px wide by 720px tall/);
});
