import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDynamicStyles } from '../src/components/studio/_lib/dynamic-styles.ts';
import type {
  StudioState,
  WebtoonCanvas,
} from '../src/components/studio/_lib/types.ts';

const createCanvas = (id: string, backgroundColor: string): WebtoonCanvas => ({
  id,
  title: id,
  height: 1000,
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

test('dynamic canvas styles put gradients on canvas edges only', () => {
  const styles = buildDynamicStyles(
    createState([
      createCanvas('canvas-a', '#111111'),
      createCanvas('canvas-b', '#eeeeee'),
    ]),
  );
  const firstCanvasRule = styles.match(
    /\.codex-webtoon-canvas-canvas-a\{[^}]+\}/,
  )?.[0];
  const secondCanvasRule = styles.match(
    /\.codex-webtoon-canvas-canvas-b\{[^}]+\}/,
  )?.[0];

  assert.ok(firstCanvasRule);
  assert.ok(secondCanvasRule);
  assert.match(
    styles,
    /\.codex-webtoon-canvas-connector\{height:56px;max-width:720px;background:transparent;\}/,
  );
  assert.doesNotMatch(
    styles,
    /\.codex-webtoon-canvas-connector-1\{background-image/,
  );
  assert.match(
    firstCanvasRule,
    /background-image:linear-gradient\(180deg,#111111 0%,#808080 100%\);/,
  );
  assert.match(firstCanvasRule, /background-position:bottom;/);
  assert.match(
    secondCanvasRule,
    /background-image:linear-gradient\(180deg,#808080 0%,#eeeeee 100%\);/,
  );
  assert.match(secondCanvasRule, /background-position:top;/);
});
