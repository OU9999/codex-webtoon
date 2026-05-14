import { CANVAS_WIDTH } from './constants';
import type { Panel } from './types';

const buildFinalPrompt = ({
  projectCommonPrompt,
  canvasCommonPrompt,
  panel,
}: {
  projectCommonPrompt: string;
  canvasCommonPrompt: string;
  panel?: Panel;
}): string => {
  if (!panel) {
    return [projectCommonPrompt.trim(), canvasCommonPrompt.trim()]
      .filter(Boolean)
      .join('\n\n');
  }

  return [
    projectCommonPrompt.trim(),
    canvasCommonPrompt.trim(),
    panel.prompt.trim(),
    `Panel spec: vertical webtoon panel, output width ${CANVAS_WIDTH}px, panel height ${panel.height}px, no readable text in image.`,
  ]
    .filter(Boolean)
    .join('\n\n');
};

export { buildFinalPrompt };
