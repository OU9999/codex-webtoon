import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_ID,
  DEFAULT_CANVAS_TITLE,
  DEFAULT_PANEL_GAP_COLOR,
  WEBTOON_CANVAS_WIDTH,
  normalizePanelGeometry,
  normalizeProjectCanvases,
  normalizeSelectedCanvasId,
} from '../shared/project-state.js';

test('normalizeProjectCanvases creates a default canvas for legacy state', () => {
  const panels = [
    { id: 'panel-1', height: 500 },
    { id: 'panel-2', height: 700 },
  ];

  const canvases = normalizeProjectCanvases(
    undefined,
    panels,
    24,
    undefined,
    '#ABCDEF',
  );

  assert.deepEqual(canvases, [
    {
      id: DEFAULT_CANVAS_ID,
      title: DEFAULT_CANVAS_TITLE,
      height: DEFAULT_CANVAS_HEIGHT,
      commonPrompt: '',
      backgroundColor: '#abcdef',
    },
  ]);
});

test('normalizeProjectCanvases deduplicates ids and normalizes invalid values', () => {
  const canvases = normalizeProjectCanvases(
    [
      {
        id: 'main',
        title: 'Main',
        height: 800,
        commonPrompt: 'clean line art',
        backgroundColor: 'not-a-color',
      },
      {
        id: 'main',
        title: '',
        height: Number.POSITIVE_INFINITY,
        backgroundColor: '#010203',
      },
    ],
    [],
    0,
    undefined,
  );

  assert.deepEqual(canvases, [
    {
      id: 'main',
      title: 'Main',
      height: 800,
      commonPrompt: 'clean line art',
      backgroundColor: DEFAULT_PANEL_GAP_COLOR,
    },
    {
      id: 'main-2',
      title: 'Canvas 2',
      height: DEFAULT_CANVAS_HEIGHT,
      commonPrompt: '',
      backgroundColor: '#010203',
    },
  ]);
});

test('normalizePanelGeometry clamps panel bounds to the canvas', () => {
  assert.deepEqual(
    normalizePanelGeometry(
      { x: 9999, y: -20, width: 9999, height: 80 },
      500,
      700,
    ),
    {
      x: 0,
      y: 0,
      width: WEBTOON_CANVAS_WIDTH,
      height: 120,
    },
  );

  assert.deepEqual(normalizePanelGeometry({ height: 200 }, 650, 700), {
    x: 0,
    y: 500,
    width: WEBTOON_CANVAS_WIDTH,
    height: 200,
  });
});

test('normalizeSelectedCanvasId follows the selected panel when needed', () => {
  const canvases = [
    {
      id: 'canvas-a',
      title: 'Canvas A',
      height: 900,
      commonPrompt: '',
      backgroundColor: '#ffffff',
    },
    {
      id: 'canvas-b',
      title: 'Canvas B',
      height: 900,
      commonPrompt: '',
      backgroundColor: '#ffffff',
    },
  ];
  const panels = [{ id: 'panel-1', canvasId: 'canvas-b', height: 320 }];

  assert.equal(
    normalizeSelectedCanvasId('missing', canvases, panels, 'panel-1'),
    'canvas-b',
  );
  assert.equal(
    normalizeSelectedCanvasId('canvas-a', canvases, panels, 'panel-1'),
    'canvas-a',
  );
});
