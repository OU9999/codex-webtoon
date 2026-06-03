# codex-webtoon

**EN** | [KR](./README.kr.md)

<!-- TODO: Add the package logo here: assets/logo.png -->

Unofficial local-first AI webtoon studio that uses Codex CLI OAuth. It is not
affiliated with, endorsed by, or sponsored by OpenAI.

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
pnpm dlx codex-webtoon setup
pnpm dlx codex-webtoon serve
```

The server starts at <http://127.0.0.1:4321/> by default.

Available commands:

```bash
pnpm dlx codex-webtoon setup
pnpm dlx codex-webtoon serve
pnpm dlx codex-webtoon status
pnpm dlx codex-webtoon help
```

The package also keeps `wps` as a legacy CLI alias.

## Authentication

Image generation uses the local Codex OAuth proxy. `setup` runs the packaged
Codex CLI login flow and writes local config under the config directory:

```bash
pnpm dlx codex-webtoon setup
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
