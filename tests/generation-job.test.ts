import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clearGenerationJob,
  createGenerationJobRegistry,
  isActiveGenerationJob,
  startGenerationJob,
} from '../src/components/studio/_lib/generation-job.ts';

test('generation jobs treat the newest request as active and abort the superseded job', () => {
  const registry = createGenerationJobRegistry();
  const first = startGenerationJob(registry, {
    panelId: 'panel-1',
    projectName: 'Project',
  });
  const second = startGenerationJob(registry, {
    panelId: 'panel-1',
    projectName: 'Project',
  });

  assert.equal(first.controller.signal.aborted, true);
  assert.equal(isActiveGenerationJob(registry, first), false);
  assert.equal(isActiveGenerationJob(registry, second), true);
});

test('generation jobs ignore stale cleanup from superseded requests', () => {
  const registry = createGenerationJobRegistry();
  const first = startGenerationJob(registry, {
    panelId: 'panel-1',
    projectName: 'Project',
  });
  const second = startGenerationJob(registry, {
    panelId: 'panel-2',
    projectName: 'Project',
  });

  assert.equal(clearGenerationJob(registry, first), false);
  assert.equal(isActiveGenerationJob(registry, second), true);
  assert.equal(clearGenerationJob(registry, second), true);
  assert.equal(isActiveGenerationJob(registry, second), false);
});
