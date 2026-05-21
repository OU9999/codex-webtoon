import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resources } from '../src/i18n/resources.ts';

test('new project default prompts are empty', () => {
  for (const language of ['ko', 'en'] as const) {
    const defaults = resources[language].translation.defaults;

    assert.equal(defaults.commonPrompt, '');
    assert.equal(defaults.panels.openingPrompt, '');
    assert.equal(defaults.panels.reactionPrompt, '');
    assert.equal(defaults.panels.longPausePrompt, '');
  }
});
