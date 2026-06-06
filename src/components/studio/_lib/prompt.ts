import type { Panel } from './types';

interface BuildPromptOptions {
  canvasCommonPrompt: string;
  panel?: Panel;
  projectCommonPrompt: string;
}

const getPanelOrientation = (panel: Panel): string => {
  const ratio = panel.width / panel.height;
  if (ratio > 1.15) return 'landscape';
  if (ratio < 0.85) return 'portrait';

  return 'square';
};

const getPanelSpecPrompt = (panel: Panel): string => {
  const orientation = getPanelOrientation(panel);

  return [
    `Panel spec: ${orientation} webtoon panel, target frame ${panel.width}px wide by ${panel.height}px tall.`,
    'Match the target aspect ratio and fill the entire frame edge-to-edge.',
    'Do not create blank margins, white gutters, borders, letterboxing, or pillarboxing inside the image.',
    'If reference images are used, adapt their subject and composition to the target frame instead of preserving their original canvas margins.',
    'No readable text in image.',
  ].join(' ');
};

const buildGenerationPromptInput = ({
  projectCommonPrompt,
  canvasCommonPrompt,
  panel,
}: BuildPromptOptions): string => {
  return [
    projectCommonPrompt.trim(),
    canvasCommonPrompt.trim(),
    panel?.prompt.trim() ?? '',
  ]
    .filter(Boolean)
    .join('\n\n');
};

const buildFinalPrompt = ({
  projectCommonPrompt,
  canvasCommonPrompt,
  panel,
}: BuildPromptOptions): string => {
  const generationPromptInput = buildGenerationPromptInput({
    projectCommonPrompt,
    canvasCommonPrompt,
    panel,
  });

  if (!panel) {
    return generationPromptInput;
  }

  return [generationPromptInput, getPanelSpecPrompt(panel)]
    .filter(Boolean)
    .join('\n\n');
};

export { buildFinalPrompt, buildGenerationPromptInput, getPanelSpecPrompt };
