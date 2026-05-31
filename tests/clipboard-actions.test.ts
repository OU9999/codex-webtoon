import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createClipboardItem,
  pasteClipboardItem,
} from '../src/components/studio/_lib/clipboard-actions.ts';
import type {
  Bubble,
  Panel,
  StudioState,
  WebtoonCanvas,
} from '../src/components/studio/_lib/types.ts';

const createCanvas = (id: string, height = 600): WebtoonCanvas => ({
  id,
  title: id,
  height,
  commonPrompt: '',
  backgroundColor: '#ffffff',
});

const createBubble = (overrides: Partial<Bubble> = {}): Bubble => ({
  id: 'bubble-a',
  type: 'speech',
  text: 'text',
  x: 10,
  y: 20,
  width: 120,
  height: 60,
  fontSize: 22,
  ...overrides,
});

const createPanel = (overrides: Partial<Panel> = {}): Panel => ({
  id: 'panel-a',
  canvasId: 'canvas-a',
  title: 'Panel A',
  x: 10,
  y: 20,
  width: 240,
  height: 100,
  prompt: 'prompt',
  candidates: [],
  selectedCandidateId: null,
  deletedCandidates: [],
  referenceImages: [],
  bubbles: [],
  ...overrides,
});

const createState = (overrides: Partial<StudioState> = {}): StudioState => ({
  commonPrompt: '',
  canvases: [createCanvas('canvas-a')],
  selectedCanvasId: 'canvas-a',
  panels: [],
  selectedPanelId: null,
  selectedBubbleId: null,
  panelGap: 0,
  panelGapColor: '#ffffff',
  variantCount: 1,
  ...overrides,
});

const pasteOptions = {
  getPanelCopyTitle: (title: string): string => `${title} copy`,
};

test('pasteClipboardItem duplicates a copied panel with fresh ids', () => {
  const sourcePanel = createPanel({
    bubbles: [createBubble()],
  });
  const state = createState({
    panels: [sourcePanel],
    selectedPanelId: sourcePanel.id,
  });
  const item = createClipboardItem(state);
  const next = pasteClipboardItem(state, item, pasteOptions);
  const duplicate = next.panels[1];

  assert.equal(item?.kind, 'panel');
  assert.equal(next.panels.length, 2);
  assert.ok(duplicate);
  assert.notEqual(duplicate.id, sourcePanel.id);
  assert.equal(duplicate.canvasId, sourcePanel.canvasId);
  assert.equal(duplicate.title, 'Panel A copy');
  assert.equal(duplicate.x, 34);
  assert.equal(duplicate.y, 44);
  assert.equal(duplicate.bubbles.length, 1);
  assert.notEqual(duplicate.bubbles[0]?.id, sourcePanel.bubbles[0]?.id);
  assert.equal(next.selectedPanelId, duplicate.id);
  assert.equal(next.selectedBubbleId, null);
});

test('pasteClipboardItem puts copied panels on the selected canvas', () => {
  const sourcePanel = createPanel();
  const state = createState({
    canvases: [createCanvas('canvas-a'), createCanvas('canvas-b', 80)],
    panels: [sourcePanel],
    selectedPanelId: sourcePanel.id,
  });
  const item = createClipboardItem(state);
  const next = pasteClipboardItem(
    {
      ...state,
      selectedCanvasId: 'canvas-b',
      selectedPanelId: null,
    },
    item,
    pasteOptions,
  );
  const duplicate = next.panels[1];

  assert.ok(duplicate);
  assert.equal(duplicate.canvasId, 'canvas-b');
  assert.equal(next.selectedCanvasId, 'canvas-b');
  assert.equal(
    next.canvases.find((canvas) => canvas.id === 'canvas-b')?.height,
    144,
  );
});

test('pasteClipboardItem duplicates selected bubbles and cascades repeated pastes', () => {
  const sourceBubble = createBubble();
  const sourcePanel = createPanel({
    bubbles: [sourceBubble],
  });
  const state = createState({
    panels: [sourcePanel],
    selectedBubbleId: sourceBubble.id,
  });
  const item = createClipboardItem(state);
  const next = pasteClipboardItem(state, item, pasteOptions);
  const firstDuplicate = next.panels[0]?.bubbles[1];
  const repeated = pasteClipboardItem(next, item, pasteOptions);
  const secondDuplicate = repeated.panels[0]?.bubbles[2];

  assert.equal(item?.kind, 'bubble');
  assert.ok(firstDuplicate);
  assert.notEqual(firstDuplicate.id, sourceBubble.id);
  assert.equal(firstDuplicate.x, 34);
  assert.equal(firstDuplicate.y, 44);
  assert.equal(next.selectedPanelId, null);
  assert.equal(next.selectedBubbleId, firstDuplicate.id);
  assert.ok(secondDuplicate);
  assert.equal(secondDuplicate.x, 58);
  assert.equal(secondDuplicate.y, 68);
  assert.equal(repeated.selectedBubbleId, secondDuplicate.id);
});

test('pasteClipboardItem duplicates a selected panel group', () => {
  const firstPanel = createPanel({ id: 'panel-a', x: 10, y: 20 });
  const secondPanel = createPanel({
    id: 'panel-b',
    title: 'Panel B',
    x: 40,
    y: 160,
  });
  const state = createState({
    panels: [firstPanel, secondPanel],
    selectedPanelId: secondPanel.id,
    selectedPanelIds: [firstPanel.id, secondPanel.id],
  });
  const item = createClipboardItem(state);
  const next = pasteClipboardItem(state, item, pasteOptions);
  const firstDuplicate = next.panels[2];
  const secondDuplicate = next.panels[3];

  assert.equal(item?.kind, 'panel-group');
  assert.equal(next.panels.length, 4);
  assert.ok(firstDuplicate);
  assert.ok(secondDuplicate);
  assert.notEqual(firstDuplicate.id, firstPanel.id);
  assert.notEqual(secondDuplicate.id, secondPanel.id);
  assert.equal(firstDuplicate.x, 34);
  assert.equal(firstDuplicate.y, 44);
  assert.equal(secondDuplicate.x, 64);
  assert.equal(secondDuplicate.y, 184);
  assert.deepEqual(next.selectedPanelIds, [
    firstDuplicate.id,
    secondDuplicate.id,
  ]);
  assert.equal(next.selectedPanelId, secondDuplicate.id);
  assert.equal(next.selectedBubbleId, null);
});

test('pasteClipboardItem duplicates a selected bubble group', () => {
  const firstBubble = createBubble({ id: 'bubble-a', x: 10, y: 20 });
  const secondBubble = createBubble({ id: 'bubble-b', x: 80, y: 90 });
  const sourcePanel = createPanel({
    bubbles: [firstBubble, secondBubble],
  });
  const state = createState({
    panels: [sourcePanel],
    selectedBubbleId: secondBubble.id,
    selectedBubbleIds: [firstBubble.id, secondBubble.id],
  });
  const item = createClipboardItem(state);
  const next = pasteClipboardItem(state, item, pasteOptions);
  const firstDuplicate = next.panels[0]?.bubbles[2];
  const secondDuplicate = next.panels[0]?.bubbles[3];

  assert.equal(item?.kind, 'bubble-group');
  assert.ok(firstDuplicate);
  assert.ok(secondDuplicate);
  assert.notEqual(firstDuplicate.id, firstBubble.id);
  assert.notEqual(secondDuplicate.id, secondBubble.id);
  assert.equal(firstDuplicate.x, 34);
  assert.equal(firstDuplicate.y, 44);
  assert.equal(secondDuplicate.x, 104);
  assert.equal(secondDuplicate.y, 114);
  assert.deepEqual(next.selectedBubbleIds, [
    firstDuplicate.id,
    secondDuplicate.id,
  ]);
  assert.equal(next.selectedPanelId, null);
  assert.equal(next.selectedBubbleId, secondDuplicate.id);
});

test('pasteClipboardItem duplicates mixed panel and bubble selections', () => {
  const panelBubble = createBubble({ id: 'bubble-a', x: 10, y: 20 });
  const independentBubble = createBubble({ id: 'bubble-b', x: 80, y: 90 });
  const firstPanel = createPanel({
    id: 'panel-a',
    bubbles: [panelBubble],
  });
  const secondPanel = createPanel({
    id: 'panel-b',
    title: 'Panel B',
    x: 320,
    y: 180,
    bubbles: [independentBubble],
  });
  const state = createState({
    panels: [firstPanel, secondPanel],
    selectedPanelId: firstPanel.id,
    selectedPanelIds: [firstPanel.id],
    selectedBubbleId: independentBubble.id,
    selectedBubbleIds: [independentBubble.id],
  });
  const item = createClipboardItem(state);

  assert.equal(item?.kind, 'mixed');
  if (item?.kind !== 'mixed') return;

  const next = pasteClipboardItem(state, item, pasteOptions);
  const duplicatePanel = next.panels[1];
  const updatedSecondPanel = next.panels[2];
  const duplicateBubble = updatedSecondPanel?.bubbles[1];

  assert.equal(next.panels.length, 3);
  assert.ok(duplicatePanel);
  assert.ok(updatedSecondPanel);
  assert.ok(duplicateBubble);
  assert.notEqual(duplicatePanel.id, firstPanel.id);
  assert.notEqual(duplicatePanel.bubbles[0]?.id, panelBubble.id);
  assert.notEqual(duplicateBubble.id, independentBubble.id);
  assert.equal(duplicateBubble.x, 104);
  assert.equal(duplicateBubble.y, 114);
  assert.deepEqual(next.selectedPanelIds, [duplicatePanel.id]);
  assert.deepEqual(next.selectedBubbleIds, [duplicateBubble.id]);
  assert.equal(next.selectedPanelId, duplicatePanel.id);
  assert.equal(next.selectedBubbleId, null);
});

test('createClipboardItem does not copy selected panel bubbles twice', () => {
  const sourceBubble = createBubble({ id: 'bubble-a' });
  const sourcePanel = createPanel({
    bubbles: [sourceBubble],
  });
  const state = createState({
    panels: [sourcePanel],
    selectedPanelId: sourcePanel.id,
    selectedPanelIds: [sourcePanel.id],
    selectedBubbleId: sourceBubble.id,
    selectedBubbleIds: [sourceBubble.id],
  });
  const item = createClipboardItem(state);

  assert.equal(item?.kind, 'panel');
});
