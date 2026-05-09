import { roundedRect, wrapText } from './canvas-primitives';
import { CANVAS_WIDTH } from './constants';
import type { Bubble } from './types';

const drawEmptyPanel = (
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
): void => {
  ctx.fillStyle = '#eceee8';
  ctx.fillRect(0, y, CANVAS_WIDTH, height);
  ctx.strokeStyle = '#ced4cb';
  ctx.lineWidth = 2;
  for (let i = -height; i < CANVAS_WIDTH; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, y + height);
    ctx.lineTo(i + height, y);
    ctx.stroke();
  }
};

const drawBubbleToCanvas = (
  ctx: CanvasRenderingContext2D,
  bubble: Bubble,
  offsetY: number,
): void => {
  ctx.save();
  ctx.font = `700 ${bubble.fontSize}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (bubble.type === 'sfx') {
    ctx.fillStyle = '#111417';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.font = `900 ${bubble.fontSize}px Inter, Arial, sans-serif`;
    ctx.strokeText(
      bubble.text,
      bubble.x + bubble.width / 2,
      offsetY + bubble.y + bubble.height / 2,
    );
    ctx.fillText(
      bubble.text,
      bubble.x + bubble.width / 2,
      offsetY + bubble.y + bubble.height / 2,
    );
    ctx.restore();
    return;
  }

  ctx.fillStyle = bubble.type === 'monologue' ? '#fff4cf' : '#ffffff';
  ctx.strokeStyle = '#1e2225';
  ctx.lineWidth = 4;
  roundedRect(
    ctx,
    bubble.x,
    offsetY + bubble.y,
    bubble.width,
    bubble.height,
    bubble.type === 'monologue' ? 6 : 34,
  );
  ctx.fill();
  ctx.stroke();

  if (bubble.type === 'speech') {
    ctx.beginPath();
    ctx.moveTo(
      bubble.x + bubble.width * 0.62,
      offsetY + bubble.y + bubble.height - 2,
    );
    ctx.lineTo(
      bubble.x + bubble.width * 0.72,
      offsetY + bubble.y + bubble.height + 34,
    );
    ctx.lineTo(
      bubble.x + bubble.width * 0.49,
      offsetY + bubble.y + bubble.height - 6,
    );
    ctx.fill();
    ctx.stroke();
  }

  const lines = wrapText(ctx, bubble.text, bubble.width - 28).slice(0, 4);
  ctx.fillStyle = '#111417';
  lines.forEach((line, index) => {
    const lineHeight = bubble.fontSize * 1.15;
    const lineY =
      offsetY +
      bubble.y +
      bubble.height / 2 +
      (index - (lines.length - 1) / 2) * lineHeight;
    ctx.fillText(line, bubble.x + bubble.width / 2, lineY);
  });
  ctx.restore();
};

export { drawBubbleToCanvas, drawEmptyPanel };
