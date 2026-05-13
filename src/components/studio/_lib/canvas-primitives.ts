const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const lines: string[] = [];
  const hardLines = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  hardLines.forEach((hardLine) => {
    const words = hardLine.split(/[^\S\n]+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      return;
    }

    let line = '';
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) {
        line = next;
        return;
      }

      lines.push(line);
      line = word;
    });

    lines.push(line);
  });

  return lines.length > 0 ? lines : [''];
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export { clamp, roundedRect, wrapText };
