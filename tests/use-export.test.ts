import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_AUTO_SPLIT_HEIGHT,
  collectExportLayerItems,
  getExportHeight,
  getPngExportPartCount,
} from '../src/components/studio/_hooks/use-export.ts';
import { CANVAS_CONNECTOR_HEIGHT } from '../src/components/studio/_lib/constants.ts';
import type {
  Bubble,
  Panel,
  StudioState,
  WebtoonCanvas,
} from '../src/components/studio/_lib/types.ts';

const createCanvas = (
  id: string,
  height: number,
  backgroundColor = '#ffffff',
): WebtoonCanvas => ({
  id,
  title: id,
  height,
  commonPrompt: '',
  backgroundColor,
});

const createBubble = (overrides: Partial<Bubble> = {}): Bubble => ({
  id: 'bubble-a',
  type: 'monologue',
  text: 'Bubble',
  x: 0,
  y: 0,
  width: 120,
  height: 60,
  fontSize: 22,
  ...overrides,
});

const createPanel = (overrides: Partial<Panel> = {}): Panel => ({
  id: 'panel-a',
  canvasId: 'a',
  title: 'Panel A',
  x: 0,
  y: 0,
  width: 720,
  height: 100,
  prompt: '',
  candidates: [],
  selectedCandidateId: null,
  deletedCandidates: [],
  referenceImages: [],
  bubbles: [],
  ...overrides,
});

const createState = (
  canvases: WebtoonCanvas[],
  panels: Panel[] = [],
): StudioState => ({
  commonPrompt: '',
  canvases,
  selectedCanvasId: canvases[0]?.id ?? '',
  panels,
  selectedPanelId: null,
  selectedBubbleId: null,
  panelGap: 0,
  panelGapColor: '#ffffff',
  variantCount: 1,
});

test('getExportHeight excludes editor connector gaps between canvases', () => {
  const state = createState([createCanvas('a', 100), createCanvas('b', 200)]);

  assert.equal(getExportHeight(state), 300);
  assert.notEqual(getExportHeight(state), 300 + CANVAS_CONNECTOR_HEIGHT);
});

test('auto png split count uses the connected canvas height', () => {
  const state = createState([
    createCanvas('a', DEFAULT_AUTO_SPLIT_HEIGHT / 2),
    createCanvas('b', DEFAULT_AUTO_SPLIT_HEIGHT / 2),
  ]);

  assert.equal(getPngExportPartCount(state, { mode: 'auto-split' }), 1);
});

test('collectExportLayerItems keeps all bubbles above all panel images', () => {
  const state = createState(
    [createCanvas('a', 400)],
    [
      createPanel({
        id: 'panel-a',
        y: 0,
        bubbles: [createBubble({ id: 'bubble-a', y: 180 })],
      }),
      createPanel({
        id: 'panel-b',
        y: 150,
      }),
    ],
  );

  const layers = collectExportLayerItems(state, 0, 400);

  assert.deepEqual(
    layers.panels.map((item) => item.panel.id),
    ['panel-a', 'panel-b'],
  );
  assert.deepEqual(
    layers.bubbles.map((item) => item.bubble.id),
    ['bubble-a'],
  );
});

test('collectExportLayerItems exports moved bubbles even when source panel is outside the slice', () => {
  const state = createState(
    [createCanvas('a', 800)],
    [
      createPanel({
        id: 'panel-a',
        y: 0,
        bubbles: [createBubble({ id: 'bubble-a', y: 500 })],
      }),
    ],
  );

  const layers = collectExportLayerItems(state, 450, 120);

  assert.deepEqual(
    layers.panels.map((item) => item.panel.id),
    [],
  );
  assert.deepEqual(
    layers.bubbles.map((item) => item.bubble.id),
    ['bubble-a'],
  );
});
