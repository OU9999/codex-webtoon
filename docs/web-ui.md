# Web UI

**EN** | [KR](./web-ui.kr.md)

The codex-webtoon web UI is split into a project picker and a studio screen.
Users create or open projects, edit panels in the studio, generate images for
selected panels, and manage candidates.

## User Flow

1. Run `codex-webtoon serve`.
2. Open `http://127.0.0.1:4321` in a browser.
3. Create a new project or open an existing one from the project picker.
4. Select a panel in the studio.
5. Enter a panel prompt.
6. Generate an image.
7. Select or delete candidate images.
8. Edit speech bubble layers.
9. Export JSON or PNG.

## Project Picker

The project picker is implemented in `src/components/project-picker/*`.

Main elements:

- App header
- Language selector
- OAuth status badge
- Recent project hero
- New project button
- Recent project search
- Project list
- New project modal

Creating a project calls `POST /api/projects` to create the project folder and
metadata. Opening a project makes `ProjectShell` load its state JSON; if no state
exists, it creates the default studio state.

## Studio Screen

The studio lives under `src/components/studio/*` and is composed of four main
areas.

| Area         | Role                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| Header       | Project navigation, OAuth state, save state, language, JSON/PNG export |
| Left Sidebar | Project, canvas, panel, bubble tools, and history                      |
| Canvas Stage | Work area for selecting and transforming webtoon canvases and panels   |
| Inspector    | Detail settings for the selected panel or bubble                       |

## Header

The header is implemented in `src/components/studio/header/*`.

Main features:

- Return to project list
- Show OAuth state
- Show save state
- Switch language
- Export JSON
- Export PNG

PNG export supports full strip, automatic split, and canvas file modes. Long
webtoons can use split export to avoid browser canvas limits.

## Left Sidebar

The sidebar is the fast project-structure editing area.

### Project Section

- Show project name and metadata
- Rename project
- Edit project common prompt

### Canvas Section

- List canvases
- Add, delete, and reorder canvases
- Adjust canvas height
- Edit canvas common prompt
- Edit canvas background color

### Panel List

- Show panels in the selected canvas
- Add panel
- Auto-align panels on Y
- Select panel
- Reorder panels
- Delete panel

### Bubble Tools

Add layers to the selected panel.

- Speech
- Oval
- Cloud
- Jagged
- Box
- Thought
- SFX

### History

Shows edit history and undo availability.

## Canvas Stage

The canvas stage is the central work area that displays the actual webtoon
canvas.

Characteristics:

- The default panel width is 720px.
- Multiple canvases are shown as a vertical stack.
- Panels can be selected, moved, and resized.
- A loading overlay appears on a panel while generation is running.
- The selected candidate renders as the panel background image.
- Bubble layers render above panel images.

Selection supports both single and multiple selection. Panels and bubbles keep
separate selection state.

## Inspector

The inspector is the right panel. It shows different forms based on the current
selection.

### Panel Selected

`PanelForm`, `CandidateGrid`, and `LayerSection` are shown.

Panel form:

- Panel name
- Panel width
- Panel height
- Reference images
- Panel prompt
- Variant count
- Generate or regenerate image
- Final generation prompt preview

Candidate area:

- Generated candidate list
- Selected candidate state
- Candidate deletion

Layer area:

- Bubble and SFX layers in the panel
- Layer selection and deletion

### Bubble Selected

`BubbleForm` is shown.

Main settings:

- Text
- Font size
- Font family
- Font weight
- Fill color
- Text color
- Stroke color
- Stroke style
- Bubble shape

## Image Generation UI Flow

Image generation runs against the selected panel.

1. The user selects a panel.
2. The user enters a panel prompt in the inspector.
3. The user selects reference images if needed.
4. The user chooses variant count.
5. The user clicks `Generate image`.
6. The UI changes the button to `Generating` and shows a loading overlay on the
   panel.
7. When `POST /api/generate` succeeds, candidates are added.
8. The first candidate is automatically selected and rendered in the panel.
9. The button changes to `Regenerate image`.

If the prompt is empty, the UI does not send a generation request and shows an
error message.

## Saving

Studio state is saved as project state JSON.

Saved data:

- Project common prompt
- Canvas list and settings
- Panel geometry and prompts
- Candidate image references
- Bubble layers
- Selection state
- Variant count

Save state is shown in the header.

## Export

### JSON

Downloads the current project state as JSON.

### PNG

Uses browser canvas to render the webtoon as PNG.

Supported modes:

- Full strip
- Automatic split
- Manual split
- Canvas files

Rendering order is panel images first and bubble layers above them.

## Localization

The UI supports Korean and English.

- Resources: `src/i18n/resources.ts`
- Initial language: localStorage or browser language
- Language switcher: header language switcher

The selected language is saved to localStorage.

## Accessibility And Testing

Key interaction elements use native roles such as button, textbox, and combobox.
This lets Playwright CLI snapshot tests verify flows such as:

- Create a new project
- Enter a panel prompt
- Click image generation
- Confirm candidate image rendering
- Confirm `/api/generate` returns `201 Created`

Actual image generation has been verified on both macOS and native Windows
PowerShell.
