import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_AUTO_SPLIT_HEIGHT,
  getExportHeight,
  getPngExportPartCount,
} from '../src/components/studio/_hooks/use-export.ts';
import { CANVAS_CONNECTOR_HEIGHT } from '../src/components/studio/_lib/constants.ts';
import type {
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

const createState = (canvases: WebtoonCanvas[]): StudioState => ({
  commonPrompt: '',
  canvases,
  selectedCanvasId: canvases[0]?.id ?? '',
  panels: [],
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
