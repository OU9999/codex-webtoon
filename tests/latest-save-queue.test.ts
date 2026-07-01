import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createLatestSaveQueue,
  finishLatestSave,
  queueLatestSave,
  startNextLatestSave,
} from '../src/components/studio/_lib/latest-save-queue.ts';

test('latest save queue coalesces pending writes while a save is in flight', () => {
  const queue = createLatestSaveQueue<string>();
  const first = queueLatestSave(queue, 'first');
  const startedFirst = startNextLatestSave(queue);
  const second = queueLatestSave(queue, 'second');
  const third = queueLatestSave(queue, 'third');

  assert.equal(startedFirst, first);
  assert.equal(second.sequence < third.sequence, true);
  assert.equal(startNextLatestSave(queue), null);

  const firstResult = finishLatestSave(queue, first);
  assert.equal(firstResult.isLatest, false);
  assert.equal(firstResult.next?.payload, 'third');

  const thirdResult = finishLatestSave(queue, third);
  assert.equal(thirdResult.isLatest, true);
  assert.equal(thirdResult.next, null);
});

test('latest save queue marks older completions stale after a newer enqueue', () => {
  const queue = createLatestSaveQueue<string>();
  const first = queueLatestSave(queue, 'first');
  const startedFirst = startNextLatestSave(queue);
  queueLatestSave(queue, 'second');

  assert.equal(startedFirst, first);
  assert.equal(finishLatestSave(queue, first).isLatest, false);
});
