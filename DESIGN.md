# Codex Webtoon — Design

A vertical-scroll comic editor with AI panel generation. Tone: a calm local instrument (Figma / Clip Studio), not a marketing SaaS. **White Hawk** brand: pristine ice-white surfaces, deep cobalt navy text, saturated sapphire accent.

---

## 1. Tokens

### Color (light mode)

| Token             | Hex                   | Use                                                |
| ----------------- | --------------------- | -------------------------------------------------- |
| `--bg`            | `#f4f7fb`             | App base                                           |
| `--bg-canvas`     | `#e6edf6`             | Center canvas (where comic lives)                  |
| `--bg-elevated`   | `#ffffff`             | Sidebars, title bar, toolbars                      |
| `--bg-panel`      | `#eef3f9`             | Sub-panel chrome (rail headers, inspector head)    |
| `--bg-input`      | `#ffffff`             | Inputs, candidate cards, panel cells               |
| `--bg-hover`      | `#e2eaf4`             | Hover surface                                      |
| `--bg-active`     | `#cfdbeb`             | Pressed / active surface                           |
| `--border`        | `#d4dfee`             | Default 1px borders                                |
| `--border-strong` | `#a8b8d0`             | Hairline emphasis                                  |
| `--border-subtle` | `#e3eaf4`             | Internal dividers                                  |
| `--fg`            | `#16335c`             | Primary text (deep cobalt navy)                    |
| `--fg-secondary`  | `#3a5680`             | Secondary text                                     |
| `--fg-muted`      | `#6b7e9a`             | Labels, mono captions                              |
| `--fg-faint`      | `#a8b3c4`             | Disabled / placeholder                             |
| `--accent`        | `#2860c8`             | **Sapphire** — selection, primary CTA, active step |
| `--accent-hover`  | `#3a73dc`             | Accent hover                                       |
| `--accent-soft`   | `rgba(40,96,200,.10)` | Selected row tint                                  |
| `--blue`          | `#2860c8`             | Status: prompt-only                                |
| `--green`         | `#4f9a7a`             | Status: done                                       |
| `--red`           | `#c25a78`             | Status: error                                      |
| `--yellow`        | `#c79b3a`             | Status: caution                                    |

Status dots: `empty` faint, `prompt-only` blue, `generating` accent + pulse + glow, `done` green, `error` red.

### Type

| Family                     | Use                                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| **Inter Tight**            | All UI                                                                   |
| **IBM Plex Mono**          | Labels, prompts, file paths, numeric meta — anything "instrument chrome" |
| **Bagel Fat One** (italic) | SFX only                                                                 |

Sizes are tight: 9.5–11px for mono labels, 11–12px for body UI, 14px for inspector titles. Letter-spacing `0.06–0.08em` on uppercase mono labels; `-0.01em` on titles.

### Geometry

`--radius: 4px` for most controls. `--radius-lg: 6px`. Panel cells deliberately use `1px` radius — closer to print panels. Borders are 1px hairlines; never thicker.

---

## 2. Layout — header + three panes + chrome

```
┌─ header  (68px desktop, --bg-elevated / --bg) ────────────────┐
├──────────┬─────────────────────────────────┬─────────────────┤
│  LEFT    │   CENTER (canvas)               │  RIGHT          │
│  280px   │   flex                          │  320px          │
│ rail     │   ┌ toolbar (32px) ────────────┐│  inspector      │
│ sections │   │ ruler 60px │ free stage     ││                 │
│          │   │            │  panels        ││                 │
│ • Project│   │            │  720px wide    ││                 │
│ • Story  │   │            │  (default)     ││                 │
│   prompt │   │                             ││                 │
│ • Panels │   └─────────────────────────────┘│                 │
├──────────┴─────────────────────────────────┴─────────────────┤
└─ statusbar (22px, mono) ──────────────────────────────────────┘
```

- **Header** contains project identity, navigation back to projects, auth/save state, export actions, and the primary selected-panel generation action. Do not include decorative desktop traffic lights.
- **Status bar** is mono, low-contrast meta only (cursor coords, token count, save state).
- **Center** is the only scrolling region for the comic itself; panels are positioned as free assets inside the webtoon stage.

### Canvas

- Background `--bg-canvas` with a subtle 24px dot grid (`rgba(26,31,48,0.07)`) — visual texture, never decorative.
- Webtoon stage width is **720px**. Stage height is editable; panels can move and resize freely inside this background.
- Panel gaps use an editable episode background color. Default **#ffffff** to match published webtoon gutters; the same color must render in the editor stage and exported PNG.
- Ruler: dashed right edge, mono ticks every 100px, height labels in `--fg-muted`.

---

## 3. Panel cell — the unit

A panel is a vertical-aspect rectangle with `border-radius: 1px`. Overlays are absolutely positioned, all `z-index: 3–4`:

- **Number badge** (top-left): mono, ivory text on dark translucent navy `rgba(26,31,48,.65)` with `backdrop-filter: blur(4px)`.
- **Hover meta** (bottom-right): same chip style; appears on hover or when selected.
- **Tag stripe** (bottom-left): optional category label.

### States

Each panel renders exactly one of:

| State         | Treatment                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `empty`       | Diagonal hatch (45°, 1px every 9px, 3.5% navy). Dashed circular icon + uppercase mono label. Use when neither prompt nor image exists.                                           |
| `prompt-only` | Soft blue surface `#dde5ee` + 45° hatch overlay. Centered prompt text in mono. Floating "Generate" CTA pinned bottom-center.                                                     |
| `generating`  | Blurred preview behind a diagonal shimmer sweep (`shim` keyframe, 1.6s). Foreground: a frosted ivory chip with spinner + step text. Bottom 2px progress bar in accent with glow. |
| `done`        | Final image. Number/meta overlays only. Selection adds glow per Tweak.                                                                                                           |
| `error`       | (red status dot in list; in cell, treat as `prompt-only` styling with red CTA).                                                                                                  |

### Selection (Tweak: `selection_style`)

- `border` — 2px sapphire border around the cell
- `offset` — cell inset 2px with sapphire backplate
- `label` — small "SELECTED" mono pill, top-right

Default: `border`.

---

## 4. Left rail

Three sections, each with a 26px header (`--bg-panel`, mono uppercase title `9.5px / 0.08em`):

1. **Project** — 30×30 gradient project icon (`linear-gradient(135deg, #b8d2e2, #7aa6c4)`, mono initials), name + sub.
2. **Story prompt** — small mono label, scrollable mono body in input surface, character count in `--fg-muted`.
3. **Panels** — list of items: 14px grip · 22px number · 44×32 thumb · title + meta. Selected row: `accent-soft` background, accent border tint, accent number. Thumb shows mini SVG, shimmer when generating, small empty glyph when truly empty.

---

## 5. Right inspector — the prompt → candidates → balloons flow

Header (`--bg-panel`):

- Mono eyebrow `PANEL 03 / 12` in **accent** uppercase
- Bold 14px title
- Right-side icon buttons (duplicate, delete)
- **Stepper** below: `1 PROMPT — 2 CANDIDATES — 3 BALLOONS`. Active step: filled accent disc, white numeral; inactive: hairline circle, 0.45 opacity.

Sections divide by `--border` and dim to 0.55 opacity until their step is reachable.

### Section 1 — Prompt

Mono textarea on white, character/token meta below. Three sliders (label width 56px, 4px track, accent fill): `style strength`, `seed`, `aspect`. Bottom row: full-width `Generate 4` primary + ghost `Reuse seed`.

### Section 2 — Candidates

2×2 grid of candidate cards, 4:3 thumbnails. Selected card: 2px accent border + soft accent shadow + small accent check disc top-right. Empty state: dashed input panel with centered mono message.

### Section 3 — Balloons & SFX

Layer toolbar (2-col grid of ghost buttons: `+ Speech`, `+ Narration`, `+ Thought`, `+ SFX`).
Layer list rows: type icon · uppercase mono type · text preview · row actions. Capped at 200px scroll.
Balloon style switcher (Tweak `balloon_style`): mono pills `classic / sharp / rough`, active pill in `accent-soft` + accent text.

### Empty inspector

When no panel is selected: muted icon + 12px center text. No CTA.

---

## 6. Balloons & SFX (rendered into the panel)

All balloons:

- Body: warm cream `#fbf9f0`, **1.5px navy `#1a1f30` border**, `border-radius: 14px`
- Text: Inter Tight 12.5px, `#1a1f30`
- Tail: SVG arrow with double drop-shadow stroke (mimics ink overlap)

Variants:

- **Speech** — solid border, rounded
- **Narration** — `#e6eef6` pale-blue rectangle, italic, near-square corners, no tail
- **Thought** — dashed border, larger radius; small detached cream circles for the trail
- Tweak `balloon_style`:
  - `classic` — defaults above
  - `sharp` — radius drops to `2px`
  - `rough` — asymmetric radius `14px 22px 16px 28px / 18px 14px 26px 16px`, 2px border (and dashed if thought)

**SFX**: Bagel Fat One italic, 28px+, navy fill with 2px ivory text-stroke + 2px ivory text-shadow (for legibility on any image). Always rendered inside the panel, never outside.

---

## 7. Buttons

| Variant            | Style                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `primary`          | Solid `--accent`, ivory `#f5f2e8` text, 30px tall, 12px padding, weight 600                       |
| `ghost`            | White surface, `--fg-secondary`, 1px `--border`. Hover: `--bg-hover` + `--fg` + `--border-strong` |
| `iconbtn`          | 20×20 transparent square, hover `--bg-hover`                                                      |
| `iconbtn-tb`       | Toolbar version: 22px tall, 8px padding, white surface + border                                   |
| `titlebar primary` | Soft accent (`--accent-soft`) chip with accent text                                               |

All transitions: `120ms` on `background, color, border-color`. No motion beyond this except shimmer (1.6s) and pulse (1.2s) on generation states.

---

## 8. Tweaks (in-design controls)

Title the panel **Tweaks** (lower-right floating). Persisted via `__edit_mode_set_keys`.

| Key                | Type   | Options                       | Default   |
| ------------------ | ------ | ----------------------------- | --------- |
| `selection_style`  | radio  | `border` / `offset` / `label` | `border`  |
| `canvas_height`    | slider | 360–3600 px                   | `1440`    |
| `right_pane_width` | slider | 280–400 px                    | 320       |
| `panel_gap_color`  | color  | Hex color                     | `#ffffff` |
| `balloon_style`    | radio  | `classic` / `sharp` / `rough` | `classic` |

---

## 9. Voice / copywriting

- Mono labels uppercase: `STORY PROMPT`, `PANEL 03 / 12`, `CANDIDATES`, `LAYERS`.
- Microcopy is terse and toolic: `Generate 4`, `Reuse seed`, `Regenerate`, `+ Speech`, not `Create new speech bubble`.
- Status text in mono: `idle · 1842 tok`, `generating · step 3/4`.
- Avoid emoji, sparkles, "AI magic" framing. The tool does not announce itself.

---

## 10. Don'ts

- No gradients in UI chrome (only the project-icon swatch and atmospheric canvas options).
- No drop shadows beyond hairline `0 1px 0 rgba(26,31,48,.06)` on panels and the frosted generating chip.
- No rounded-card SaaS treatments. Borders are 1px, radii are tight.
- No decorative iconography. Every icon resolves to an action.
- No accent color on body copy, only on selected state, primary CTA, active step, and key counts.
