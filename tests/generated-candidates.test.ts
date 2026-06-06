import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeGeneratedCandidates } from '../src/components/studio/_lib/generated-candidates.ts';
import type { Candidate, Panel } from '../src/components/studio/_lib/types.ts';

const createCandidate = (id: string): Candidate => ({
  id,
  imageUrl: `/projects/test/${id}.png`,
  createdAt: '2026-06-06T00:00:00.000Z',
  promptSnapshot: 'prompt',
  height: 420,
  provider: 'local-mock',
});

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

test('mergeGeneratedCandidates keeps the selected candidate when adding alternatives', () => {
  const existing = [createCandidate('old-1'), createCandidate('old-2')];
  const generated = [createCandidate('new-1'), createCandidate('new-2')];
  const result = mergeGeneratedCandidates(
    createPanel({
      candidates: existing,
      selectedCandidateId: 'old-1',
    }),
    generated,
  );

  assert.equal(result.selectedCandidateId, 'old-1');
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.id),
    ['old-1', 'old-2', 'new-1', 'new-2'],
  );
});

test('mergeGeneratedCandidates auto-selects first generated candidate for an empty panel', () => {
  const result = mergeGeneratedCandidates(createPanel(), [
    createCandidate('new-1'),
    createCandidate('new-2'),
  ]);

  assert.equal(result.selectedCandidateId, 'new-1');
});

test('mergeGeneratedCandidates keeps no selection when existing candidates have no applied image', () => {
  const result = mergeGeneratedCandidates(
    createPanel({
      candidates: [createCandidate('old-1')],
      selectedCandidateId: null,
    }),
    [createCandidate('new-1')],
  );

  assert.equal(result.selectedCandidateId, null);
});
