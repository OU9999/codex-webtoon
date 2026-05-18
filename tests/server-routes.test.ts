import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ProjectState } from '../shared/types.js';

const testRoot = mkdtempSync(join(tmpdir(), 'wps-server-routes-'));

process.env.WPS_PROJECTS_ROOT = join(testRoot, 'projects');
process.env.WPS_CONFIG_DIR = join(testRoot, 'config');
process.env.WPS_OAUTH = 'off';

let server: Server;
let baseUrl: string;

const jsonHeaders = { 'content-type': 'application/json' };

const createProjectState = (): ProjectState => ({
  commonPrompt: 'route test style',
  canvases: [
    {
      id: 'main',
      title: 'Main canvas',
      height: 900,
      commonPrompt: '',
      backgroundColor: '#ffffff',
    },
  ],
  selectedCanvasId: 'main',
  panels: [
    {
      id: 'panel-1',
      canvasId: 'main',
      title: 'Opening',
      x: 0,
      y: 0,
      width: 720,
      height: 600,
      prompt: 'City street',
      candidates: [
        {
          id: 'candidate-1',
          imageUrl:
            '/projects/route-project/candidates/panel-1/candidate-1.png',
          createdAt: '2026-05-18T00:00:00.000Z',
          promptSnapshot: 'City street',
          height: 600,
          provider: 'openai',
        },
      ],
      selectedCandidateId: 'candidate-1',
      deletedCandidates: [],
      referenceImages: [],
      bubbles: [],
    },
  ],
  selectedPanelId: 'panel-1',
  selectedBubbleId: null,
  panelGap: 24,
  panelGapColor: '#ffffff',
  variantCount: 1,
});

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${baseUrl}${path}`, init);
  assert.equal(res.ok, true);

  return (await res.json()) as T;
};

before(async () => {
  const { buildApp } = await import('../server/server.js');
  const app = buildApp({ startedAt: 1234567890, version: 'test-version' });

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  rmSync(testRoot, { recursive: true, force: true });
});

test('GET /api/health returns server metadata', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const body = (await res.json()) as {
    ok: boolean;
    startedAt: number;
    version: string;
  };

  assert.equal(res.status, 200);
  assert.deepEqual(body, {
    ok: true,
    startedAt: 1234567890,
    version: 'test-version',
  });
});

test('project routes create, list, save, load, and delete project data', async () => {
  const projectName = 'Route Project';
  const encodedName = encodeURIComponent(projectName);

  const created = await requestJson<{
    name: string;
    thumbnailUrl: string | null;
  }>('/api/projects', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name: projectName }),
  });

  assert.equal(created.name, projectName);
  assert.equal(created.thumbnailUrl, null);

  const listBeforeState =
    await requestJson<{ name: string; thumbnailUrl: string | null }[]>(
      '/api/projects',
    );
  assert.equal(
    listBeforeState.some((project) => project.name === projectName),
    true,
  );

  const emptyState = await fetch(
    `${baseUrl}/api/projects/${encodedName}/state`,
  );
  assert.equal(emptyState.status, 204);

  const state = createProjectState();
  const saveRes = await fetch(`${baseUrl}/api/projects/${encodedName}/state`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(state),
  });
  assert.equal(saveRes.status, 204);

  const loaded = await requestJson<ProjectState>(
    `/api/projects/${encodedName}/state`,
  );
  assert.equal(loaded.commonPrompt, state.commonPrompt);
  assert.equal(loaded.panels[0]?.title, 'Opening');
  assert.equal(loaded.panels[0]?.selectedCandidateId, 'candidate-1');

  const listAfterState =
    await requestJson<{ name: string; thumbnailUrl: string | null }[]>(
      '/api/projects',
    );
  const summary = listAfterState.find(
    (project) => project.name === projectName,
  );
  assert.ok(summary);
  assert.equal(summary.thumbnailUrl, state.panels[0]?.candidates[0]?.imageUrl);

  const deleteRes = await fetch(`${baseUrl}/api/projects/${encodedName}`, {
    method: 'DELETE',
  });
  assert.equal(deleteRes.status, 204);

  const getDeleted = await fetch(`${baseUrl}/api/projects/${encodedName}`);
  assert.equal(getDeleted.status, 404);
});

test('project routes return structured errors for invalid requests', async () => {
  const invalidName = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name: '../outside' }),
  });
  assert.equal(invalidName.status, 400);
  assert.equal((await invalidName.json()).error, 'invalid_name');

  const unsupportedMedia = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: 'plain text',
  });
  assert.equal(unsupportedMedia.status, 415);
  assert.equal((await unsupportedMedia.json()).error, 'unsupported_media_type');

  const invalidJson = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: jsonHeaders,
    body: '{not-json',
  });
  assert.equal(invalidJson.status, 400);
  assert.equal((await invalidJson.json()).error, 'invalid_json');
});
