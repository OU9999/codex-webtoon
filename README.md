<p align="center">
  <img src="./asset/favicon.png" alt="Codex Webtoon logo" width="96" height="96" />
</p>

<h1 align="center">codex-webtoon</h1>

<p align="center">
  Local-first AI webtoon studio powered by Codex CLI OAuth.
</p>

<p align="center">
  <strong>EN</strong> · <a href="./README.kr.md">KR</a>
</p>

<p align="center">
  <img src="./asset/main.png" alt="Codex Webtoon editor screenshot" />
</p>

> Unofficial project. codex-webtoon is not affiliated with, endorsed by, or
> sponsored by OpenAI.

codex-webtoon is a local-first studio for building vertical webtoon drafts. It
keeps projects on your machine, generates selected panels through a local Codex
OAuth proxy, stores panel-level candidates, and edits speech bubbles as separate
layers.

## Quick Start

Requirements:

- Node.js 22.13.0 or newer
- npm, included with Node.js

Install and run:

```bash
npm install -g codex-webtoon
codex-webtoon setup
codex-webtoon serve
```

Open <http://127.0.0.1:4321/> after the server starts.

Available commands:

```bash
codex-webtoon setup
codex-webtoon serve
codex-webtoon status
codex-webtoon help
```

The package also keeps `wps` as a legacy CLI alias.

## Screenshots

<p align="center">
  <img src="./asset/project.png" alt="Codex Webtoon project picker screenshot" />
</p>

## Features

- Vertical webtoon canvas with selectable panels
- Add, duplicate, delete, reorder, and resize panels
- Project-level common prompt and panel-level scene prompt
- Selected-panel generation with candidate history
- Editable speech, monologue, thought, and SFX layers
- Local JSON export and full-strip PNG export

## Authentication

Image generation uses a local Codex OAuth proxy. `setup` runs the packaged Codex
CLI login flow and writes local config under the config directory:

```bash
codex-webtoon setup
```

After setup, `serve` starts the local web server and launches the packaged
`openai-oauth` proxy when a Codex OAuth session is available.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `CODEX_WEBTOON_HOST` | `127.0.0.1` | Local server host. |
| `CODEX_WEBTOON_PORT` | `4321` | Local server port. |
| `CODEX_WEBTOON_CONFIG_DIR` | `~/.config/codex-webtoon` | Config and server advertisement directory. |
| config file | `~/.config/codex-webtoon/config.json` | Optional file layer written by `codex-webtoon setup`; env vars still win. |
| `CODEX_WEBTOON_PROJECTS_ROOT` | `~/WebtoonProjects` | Local project storage root. |
| `CODEX_WEBTOON_OAUTH` | `auto` | OAuth mode: `auto`, `on`, or `off`. |
| `CODEX_WEBTOON_OAUTH_PROXY_PORT` | `10531` | Local OAuth proxy port. |
| `CODEX_WEBTOON_OAUTH_STARTUP_TIMEOUT_MS` | `20000` | OAuth proxy startup timeout. |

Legacy `WPS_*` variables are still accepted as fallbacks. If no config
directory is configured and `~/.config/webtoon-panel-studio` already exists,
codex-webtoon reads it for compatibility.

## Development

This repo uses pnpm for development.

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

The Vite dev server runs at <http://127.0.0.1:5173/> and the API server runs at
<http://127.0.0.1:4321/>.

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
