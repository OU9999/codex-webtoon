import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moveBubble } from '../src/components/studio/_hooks/use-bubble-drag.ts';
import type {
  Bubble,
  BubbleDrag,
} from '../src/components/studio/_lib/types.ts';

const createBubble = (): Bubble => ({
  id: 'bubble-1',
  type: 'monologue',
  text: 'Line',
  x: 74,
  y: 840,
  width: 320,
  height: 154,
  fontSize: 22,
});

const createDrag = (): BubbleDrag =>
  ({
    offsetX: 120,
    offsetY: 40,
  }) as BubbleDrag;

test('moveBubble does not clamp movement to the source panel', () => {
  const moved = moveBubble(createBubble(), createDrag(), 220, 1400);

  assert.equal(moved.x, 100);
  assert.equal(moved.y, 1360);
});

test('moveBubble keeps negative positions when dragged above the panel', () => {
  const moved = moveBubble(createBubble(), createDrag(), 220, -900);

  assert.equal(moved.x, 100);
  assert.equal(moved.y, -940);
});
