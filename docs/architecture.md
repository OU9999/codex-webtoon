# Architecture

**EN** | [KR](./architecture.kr.md)

codex-webtoon is a local webtoon creation tool. Users install the CLI with npm,
then the CLI runs a local Express server and a Codex OAuth proxy. The browser UI
connects to that local server to save projects, generate images, manage
candidates, and export JSON or PNG files.

`openai-oauth` is the OAuth proxy used by this project. It is a third-party
package, not an official OpenAI product, SDK, API endpoint, or supported OpenAI
API path. It is licensed AGPL-3.0-only; see
[Third-party notices](./third-party-notices.md).

## Components

| Area         | Main files                                                 | Role                                                                               |
| ------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| CLI          | `bin/codex-webtoon.ts`                                     | Handles `setup`, `serve`, `status`, and `help`                                     |
| Config       | `server/config.ts`                                         | Merges environment variables, config file values, and defaults                     |
| Server       | `server/server.ts`                                         | Builds the Express app, serves static UI, and mounts API routes                    |
| Auth         | `server/lib/auth/*`                                        | Detects Codex OAuth, starts third-party `openai-oauth`, and calls image generation |
| API          | `server/routes/*`                                          | Project, auth status, and image generation APIs                                    |
| Storage      | `server/lib/project-store.ts`, `server/lib/image-store.ts` | Stores project JSON and candidate PNG/metadata files                               |
| Shared types | `shared/*`                                                 | State, types, and normalization logic shared by server and UI                      |
| Web UI       | `src/*`                                                    | React project picker and studio screens                                            |

## Runtime Flow

### 1. Install

The user-facing install path is a global npm install.

```bash
npm install -g codex-webtoon
```

The package includes the built CLI, server code, Vite static output, and README
image assets. Runtime dependencies include `@openai/codex` and `openai-oauth`,
so users do not need to install the Codex CLI or OAuth proxy package separately.
`openai-oauth` is a third-party runtime dependency licensed AGPL-3.0-only.

### 2. Setup

```bash
codex-webtoon setup
```

`setup` checks the current Codex OAuth session. If no session exists, it first
tries the package-local `codex` CLI and falls back to
`npx --yes @openai/codex login` if needed.

After authentication is confirmed, it writes OAuth mode to the config file.

```text
~/.config/codex-webtoon/config.json
```

On Windows, the corresponding config path under the user home directory is used.

### 3. Serve

```bash
codex-webtoon serve
```

`serve` runs the built server entrypoint at `build/server/server.js`. On server
startup, it checks Codex authentication and, when OAuth mode is enabled, starts a
local OpenAI-compatible proxy using the package-local `openai-oauth` executable
first. "OpenAI-compatible" describes the local HTTP interface shape only; this
is not the official OpenAI API path.

```text
http://127.0.0.1:4321
```

The browser UI and API are served by the same local server.

## API Flow

### Projects

Project APIs store project metadata and state JSON on the local file system.

| API                             | Role               |
| ------------------------------- | ------------------ |
| `GET /api/projects`             | List projects      |
| `POST /api/projects`            | Create project     |
| `GET /api/projects/:name/state` | Load project state |
| `PUT /api/projects/:name/state` | Save project state |
| `PATCH /api/projects/:name`     | Rename project     |
| `DELETE /api/projects/:name`    | Delete project     |

The default project root is:

```text
~/WebtoonProjects
```

### Auth Status

```text
GET /api/auth/status
```

The response includes the Codex session state, OAuth proxy state, and recommended
provider. The UI `OAuth` badge is based on this API.

### Image Generation

```text
POST /api/generate
```

Generation requests are handled in this order:

1. Validate request body.
2. Resolve the project directory.
3. Resolve provider (`auto` or `oauth`).
4. Read reference image files when present.
5. Send the prompt and any reference image data through the `openai-oauth`
   proxy.
6. Save the generated PNG.
7. Save candidate metadata.
8. Return the candidate list to the UI.

Local-first storage does not make generation offline. Prompt text and selected
reference image data leave the local app through the `openai-oauth` proxy as an
external model request.

Saved files use this shape:

```text
~/WebtoonProjects/<project>/candidates/<panel-id>/<candidate-id>.png
~/WebtoonProjects/<project>/candidates/<panel-id>/<candidate-id>.json
```

Candidate metadata includes the prompt snapshot, provider, model, size, and
reference image information.

## State Model

The core UI state is `StudioState`. Key fields are:

- `commonPrompt`: project-level common prompt
- `canvases`: webtoon canvas list
- `panels`: panel list with candidate images, bubbles, and reference images
- `selectedPanelId`, `selectedPanelIds`: current panel selection
- `selectedBubbleId`, `selectedBubbleIds`: current bubble selection
- `panelGap`, `panelGapColor`: canvas layout settings
- `variantCount`: number of candidates to generate

When the server saves state, normalization logic in `shared/project-state.ts`
repairs legacy state and invalid geometry.

## Platform Handling

The package targets macOS, Linux, and Windows.

- Windows checks `.cmd` shims first.
- Package-local `node_modules/.bin/codex.cmd` and `openai-oauth.cmd` are used.
- If package-local executables are missing, the CLI falls back to `npx --yes`.
- Native Windows PowerShell testing passed setup, serve, OAuth readiness, image
  generation, PNG saving, and Edge rendering.

## Published Package Contents

The npm package payload is controlled by the `files` list in `package.json`.
Standard npm metadata and legal/readme files, including `package.json`,
`README.md`, `README.kr.md`, and `LICENSE`, may also be included by npm. The key
packaged paths are:

- `asset`
- `build`
- `docs`
- `dist`
- `README.md`
- `README.kr.md`

Source TS/TSX files, tests, `.docs` planning documents, and temporary artifacts
are not included in the npm package.

## Security And Scope

- The app runs as a local server; the default host is `127.0.0.1`.
- Project files and generated images are stored on the user's local disk.
- "Local-first" means project storage, candidate image storage, and exports are
  local by default.
- Image generation uses the user's Codex OAuth session and sends prompt text and
  selected reference image data through `openai-oauth` to external model
  services.
- `openai-oauth` is a third-party OAuth proxy licensed AGPL-3.0-only, not an
  official OpenAI product or official OpenAI API path.
- This project is not an official OpenAI product and is not affiliated with,
  endorsed by, or sponsored by OpenAI.
