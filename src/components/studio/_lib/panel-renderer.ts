import { hashString, roundedRect, withAlpha } from './canvas-primitives';
import { CANVAS_WIDTH } from './constants';
import type { Palette, Panel } from './types';

const pickPalette = (seed: number): Palette => {
  const palettes: Palette[] = [
    {
      sky: '#f7d9c4',
      mid: '#9cc7bf',
      ground: '#4b6f68',
      accent: '#ef775f',
      skin: '#f4c9a8',
      hair: '#2d2a2c',
      ink: '#202427',
    },
    {
      sky: '#c9e6e0',
      mid: '#f0c96f',
      ground: '#6e8063',
      accent: '#3f7f93',
      skin: '#ecc09d',
      hair: '#31313a',
      ink: '#1f2828',
    },
    {
      sky: '#efc7bd',
      mid: '#e9e0a9',
      ground: '#58717b',
      accent: '#b75e69',
      skin: '#f1c7ad',
      hair: '#29272b',
      ink: '#242629',
    },
    {
      sky: '#d6d5ef',
      mid: '#9fcbbb',
      ground: '#67755f',
      accent: '#d98745',
      skin: '#eec3a4',
      hair: '#23282e',
      ink: '#20252a',
    },
  ];

  return palettes[seed % palettes.length]!;
};

const drawSpeedLines = (
  ctx: CanvasRenderingContext2D,
  seed: number,
  height: number,
  ink: string,
): void => {
  ctx.save();
  ctx.strokeStyle = withAlpha(ink, 0.12);
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i += 1) {
    const x = (seed * (i + 3)) % CANVAS_WIDTH;
    const y = (seed >> (i % 15)) % Math.max(height, 1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 80 + (i % 3) * 32, y + 24 + (i % 4) * 8);
    ctx.stroke();
  }
  ctx.restore();
};

const drawCharacter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  palette: Palette,
  seed: number,
  mirrored = false,
): void => {
  ctx.save();
  ctx.translate(x, baseline);
  ctx.scale(mirrored ? -1 : 1, 1);

  ctx.fillStyle = palette.accent;
  roundedRect(ctx, -58, -152, 116, 142, 58);
  ctx.fill();

  ctx.fillStyle = palette.skin;
  ctx.beginPath();
  ctx.ellipse(0, -190, 48, 56, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.hair;
  ctx.beginPath();
  ctx.ellipse(-6, -208, 54, 48, -0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-48, -206, 96, 36);

  ctx.strokeStyle = withAlpha(palette.ink, 0.5);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-24, -190);
  ctx.quadraticCurveTo(-8, -182 + (seed % 6), 8, -190);
  ctx.moveTo(18, -190);
  ctx.quadraticCurveTo(30, -184, 40, -190);
  ctx.stroke();

  ctx.fillStyle = withAlpha(palette.ink, 0.84);
  ctx.beginPath();
  ctx.ellipse(-15, -197, 4, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(23, -197, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = withAlpha(palette.ink, 0.4);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-66, -122);
  ctx.lineTo(-108, -64);
  ctx.moveTo(66, -122);
  ctx.lineTo(102, -68);
  ctx.stroke();

  ctx.restore();
};

const drawForeground = (
  ctx: CanvasRenderingContext2D,
  height: number,
  palette: Palette,
): void => {
  ctx.fillStyle = withAlpha(palette.ink, 0.16);
  ctx.fillRect(0, height - 34, CANVAS_WIDTH, 34);
  ctx.strokeStyle = withAlpha(palette.ink, 0.2);
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    const y = height - 28 + i * 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y + (i % 2 ? 3 : -2));
    ctx.stroke();
  }
};

const generatePanelImage = ({
  panel,
  commonPrompt,
}: {
  panel: Panel;
  commonPrompt: string;
}): string => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = panel.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  const seed = hashString(`${commonPrompt}|${panel.prompt}|${Date.now()}`);
  const palette = pickPalette(seed);
  const horizon = Math.max(panel.height * 0.35, 128);

  const sky = ctx.createLinearGradient(0, 0, 0, panel.height);
  sky.addColorStop(0, palette.sky);
  sky.addColorStop(0.52, palette.mid);
  sky.addColorStop(1, palette.ground);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, panel.height);

  ctx.fillStyle = withAlpha(palette.ink, 0.12);
  for (let i = 0; i < 9; i += 1) {
    const x = ((seed >> (i % 12)) % 640) - 60 + i * 22;
    const w = 58 + ((seed + i * 37) % 86);
    const h = 90 + ((seed + i * 53) % 170);
    ctx.fillRect(x, horizon - h + 24, w, h);
  }

  drawSpeedLines(ctx, seed, panel.height, palette.ink);
  drawCharacter(
    ctx,
    260 + (seed % 90),
    Math.min(panel.height - 42, horizon + 210),
    palette,
    seed,
  );
  drawCharacter(
    ctx,
    448 - (seed % 70),
    Math.min(panel.height - 36, horizon + 230),
    palette,
    seed + 19,
    true,
  );
  drawForeground(ctx, panel.height, palette);

  ctx.lineWidth = 7;
  ctx.strokeStyle = withAlpha(palette.ink, 0.58);
  ctx.strokeRect(18, 18, CANVAS_WIDTH - 36, panel.height - 36);

  return canvas.toDataURL('image/png');
};

export { generatePanelImage };
