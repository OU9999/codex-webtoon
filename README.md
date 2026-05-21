# webtoon-panel-studio

**EN** | [KR](./README.kr.md)

<!-- TODO: Add the package logo here: assets/logo.png -->

Local-first AI webtoon panel editor.

Build a vertical webtoon canvas, generate selected panels, keep panel-level
candidates, and edit speech bubbles as separate layers. The app runs locally and
stores projects on the user's machine.

<!-- TODO: Add the main studio screenshot here: assets/screenshots/studio-overview.png -->

## Requirements

- Node.js 22.13.0 or newer
- pnpm 11

## Use The CLI

After the package is published:

```bash
pnpm dlx webtoon-panel-studio
```

The server starts at <http://127.0.0.1:4321/> by default.

Available commands:

```bash
pnpm dlx webtoon-panel-studio serve
pnpm dlx webtoon-panel-studio status
pnpm dlx webtoon-panel-studio help
```

## Authentication

Image generation uses the local Codex OAuth proxy. Install and authenticate the
Codex CLI before starting the server:

```bash
npx @openai/codex login
```

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `WPS_HOST` | `127.0.0.1` | Local server host. |
| `WPS_PORT` | `4321` | Local server port. |
| `WPS_CONFIG_DIR` | `~/.config/webtoon-panel-studio` | Config and server advertisement directory. |
| `WPS_PROJECTS_ROOT` | `~/WebtoonProjects` | Local project storage root. |
| `WPS_OAUTH` | `auto` | OAuth mode: `auto`, `on`, or `off`. |
| `WPS_OAUTH_PROXY_PORT` | `10531` | Local OAuth proxy port. |
| `WPS_OAUTH_STARTUP_TIMEOUT_MS` | `20000` | OAuth proxy startup timeout. |

## Development

Use the pinned Node.js version before installing dependencies:

```bash
nvm use
```

Tools that read `.node-version` can switch to the same `22.13.0` baseline
automatically.

```bash
pnpm install
pnpm dev
```

The Vite dev server runs at <http://127.0.0.1:5173/> and the API server runs
at <http://127.0.0.1:4321/>.

## Features

<!--
TODO: Add workflow screenshots in or near this section:
- assets/screenshots/panel-generation.png
- assets/screenshots/speech-bubbles.png
- assets/screenshots/png-export.png
-->

- Vertical webtoon canvas with selectable panels
- Add, duplicate, delete, reorder, and resize panels
- Project-level common prompt and panel-level scene prompt
- Selected-panel mock generation with candidate history
- Editable speech, monologue, thought, and SFX layers
- Local JSON export and full-strip PNG export

## Stack

- pnpm
- Vite + React + TypeScript
- Tailwind CSS v4
- shadcn/ui-style local components

## Checks

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```
