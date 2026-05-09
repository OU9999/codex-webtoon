import { CANVAS_WIDTH } from './constants';
import type { Panel } from './types';

const buildFinalPrompt = ({
  commonPrompt,
  panel,
}: {
  commonPrompt: string;
  panel?: Panel;
}): string => {
  if (!panel) return commonPrompt.trim();

  return [
    commonPrompt.trim(),
    panel.prompt.trim(),
    `Panel spec: vertical webtoon panel, output width ${CANVAS_WIDTH}px, panel height ${panel.height}px, no readable text in image.`,
  ]
    .filter(Boolean)
    .join('\n\n');
};

export { buildFinalPrompt };
