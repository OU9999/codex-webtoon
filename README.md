# image2-webtoon-ui

Local-first AI webtoon panel editor.

This repository will start as a local MVP for building a vertical webtoon canvas where users can create panels, generate selected cuts, keep panel-level candidates, and edit speech bubbles as separate layers.

## Run

```bash
pnpm install
pnpm dev
```

Open <http://127.0.0.1:5173/>.

## Current MVP

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
pnpm typecheck
pnpm build
```
