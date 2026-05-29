import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import type { ProjectState } from '../shared/types.js';

const testRoot = mkdtempSync(join(tmpdir(), 'wps-project-store-'));
const projectsRoot = join(testRoot, 'projects');
const configRoot = join(testRoot, 'config');

process.env.WPS_PROJECTS_ROOT = projectsRoot;
process.env.WPS_CONFIG_DIR = configRoot;
process.env.WPS_OAUTH = 'off';

const storePromise = import('../server/lib/project-store.js');

const createProjectState = (): ProjectState => ({
  commonPrompt: 'studio lighting',
  canvases: [
    {
      id: 'main',
      title: 'Main canvas',
      height: 900,
      commonPrompt: 'clean line art',
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
      height: 640,
      prompt: 'A rooftop establishing shot',
      candidates: [
        {
          id: 'candidate-1',
          imageUrl: '/projects/round-trip/panel-1/candidate-1.png',
          createdAt: '2026-05-18T00:00:00.000Z',
          promptSnapshot: 'A rooftop establishing shot',
          height: 640,
          provider: 'oauth',
        },
      ],
      selectedCandidateId: 'candidate-1',
      deletedCandidates: [],
      referenceImages: [],
      bubbles: [
        {
          id: 'bubble-1',
          type: 'speech',
          text: 'We start here.',
          x: 120,
          y: 80,
          width: 240,
          height: 96,
          fontSize: 18,
        },
      ],
    },
  ],
  selectedPanelId: 'panel-1',
  selectedBubbleId: null,
  panelGap: 24,
  panelGapColor: '#ffffff',
  variantCount: 2,
});

after(() => {
  rmSync(testRoot, { recursive: true, force: true });
});

test('createProject trims names and listProjects returns saved thumbnail', async () => {
  const { createProject, deleteProject, listProjects } = await storePromise;

  const created = createProject('  Round Trip  ');

  assert.equal(created.name, 'Round Trip');
  assert.equal(created.path, join(projectsRoot, 'Round Trip'));
  assert.equal(created.thumbnailUrl, null);
  assert.ok(existsSync(created.path));

  const summary = listProjects().find(
    (project) => project.name === created.name,
  );
  assert.ok(summary);
  assert.equal(summary.thumbnailUrl, null);

  deleteProject(created.name);
  assert.equal(existsSync(created.path), false);
});

test('saveState and loadState round-trip project data through disk', async () => {
  const { createProject, listProjects, loadState, saveState } =
    await storePromise;
  const project = createProject('State Round Trip');
  const state = createProjectState();
  const panel = state.panels[0];
  assert.ok(panel);
  panel.referenceImages = [
    {
      source: 'candidate',
      panelId: 'panel-1',
      candidateId: 'candidate-1',
    },
    {
      source: 'external',
      id: 'external-1',
      imageUrl: 'https://example.com/reference.png',
      title: 'reference.png',
      createdAt: '2026-05-18T00:00:00.000Z',
    },
  ];

  saveState(project.name, state);

  const loaded = loadState(project.name);
  assert.ok(loaded);
  assert.equal(loaded.commonPrompt, state.commonPrompt);
  assert.equal(loaded.selectedCanvasId, 'main');
  assert.equal(loaded.panels[0]?.title, 'Opening');
  assert.equal(loaded.panels[0]?.bubbles[0]?.text, 'We start here.');
  assert.deepEqual(loaded.panels[0]?.referenceImages, panel.referenceImages);
  assert.equal(loaded.variantCount, 2);

  const summary = listProjects().find(
    (candidate) => candidate.name === project.name,
  );
  assert.ok(summary);
  assert.equal(summary.thumbnailUrl, state.panels[0]?.candidates[0]?.imageUrl);
});

test('renameProject moves folders and rewrites project asset URLs', async () => {
  const { createProject, listProjects, loadState, renameProject, saveState } =
    await storePromise;
  const project = createProject('Rename Source');
  const state = createProjectState();
  const candidate = state.panels[0]?.candidates[0];
  assert.ok(candidate);
  candidate.imageUrl =
    '/projects/Rename%20Source/candidates/panel-1/candidate-1.png';

  saveState(project.name, state);

  const renamed = renameProject(project.name, 'Rename Target');

  assert.equal(renamed.name, 'Rename Target');
  assert.equal(renamed.path, join(projectsRoot, 'Rename Target'));
  assert.equal(existsSync(project.path), false);
  assert.equal(existsSync(renamed.path), true);

  const loaded = loadState(renamed.name);
  assert.ok(loaded);
  assert.equal(
    loaded.panels[0]?.candidates[0]?.imageUrl,
    '/projects/Rename%20Target/candidates/panel-1/candidate-1.png',
  );

  const summary = listProjects().find(
    (candidateProject) => candidateProject.name === renamed.name,
  );
  assert.ok(summary);
  assert.equal(summary.path, renamed.path);
});

test('project operations reject invalid names and invalid state shapes', async () => {
  const { ProjectError, createProject, renameProject, saveState } =
    await storePromise;
  const project = createProject('Validation');
  createProject('Validation Conflict');

  assert.throws(
    () => createProject('../outside'),
    (err: unknown) =>
      err instanceof ProjectError && err.code === 'invalid_name',
  );
  assert.throws(
    () => saveState(project.name, { panels: [] }),
    (err: unknown) =>
      err instanceof ProjectError && err.code === 'invalid_state',
  );
  assert.throws(
    () => renameProject(project.name, '../outside'),
    (err: unknown) =>
      err instanceof ProjectError && err.code === 'invalid_name',
  );
  assert.throws(
    () => renameProject(project.name, 'Validation Conflict'),
    (err: unknown) =>
      err instanceof ProjectError && err.code === 'project_exists',
  );
});

test('loadState quarantines corrupt state files', async () => {
  const { createProject, getProjectDir, loadState } = await storePromise;
  const project = createProject('Corrupt State');
  const dir = getProjectDir(project.name);
  const stateFile = join(dir, 'state.json');

  writeFileSync(stateFile, '{not-json');

  assert.equal(loadState(project.name), null);
  assert.equal(existsSync(stateFile), false);
  assert.ok(
    readdirSync(dir).some((fileName) =>
      fileName.startsWith('state.json.corrupt-'),
    ),
  );
});
