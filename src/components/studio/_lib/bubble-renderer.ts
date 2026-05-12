import { wrapText } from './canvas-primitives';
import {
  getBubbleOutlineSvgPath,
  getBubbleTailPoints,
  getThoughtTailDots,
  resolveBubbleStyle,
} from './bubble-style';
import { CANVAS_WIDTH } from './constants';
import type { Bubble, BubbleTailSide } from './types';
import type { BubbleTailPoint } from './bubble-style';

interface CanvasCornerRadii {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

const roundedRectWithCorners = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radii: CanvasCornerRadii,
): void => {
  const maxRadius = Math.min(width / 2, height / 2);
  const topLeft = Math.min(radii.topLeft, maxRadius);
  const topRight = Math.min(radii.topRight, maxRadius);
  const bottomRight = Math.min(radii.bottomRight, maxRadius);
  const bottomLeft = Math.min(radii.bottomLeft, maxRadius);

  ctx.beginPath();
  ctx.moveTo(x + topLeft, y);
  ctx.lineTo(x + width - topRight, y);
  ctx.arcTo(x + width, y, x + width, y + topRight, topRight);
  ctx.lineTo(x + width, y + height - bottomRight);
  ctx.arcTo(
    x + width,
    y + height,
    x + width - bottomRight,
    y + height,
    bottomRight,
  );
  ctx.lineTo(x + bottomLeft, y + height);
  ctx.arcTo(x, y + height, x, y + height - bottomLeft, bottomLeft);
  ctx.lineTo(x, y + topLeft);
  ctx.arcTo(x, y, x + topLeft, y, topLeft);
  ctx.closePath();
};

const pointToCanvas = (
  bubble: Bubble,
  offsetY: number,
  point: BubbleTailPoint,
): { x: number; y: number } => {
  return {
    x: bubble.x + (point.x / 100) * bubble.width,
    y: offsetY + bubble.y + (point.y / 100) * bubble.height,
  };
};

const appendSpeechTail = (
  ctx: CanvasRenderingContext2D,
  bubble: Bubble,
  offsetY: number,
  first: BubbleTailPoint,
  second: BubbleTailPoint,
  tip: BubbleTailPoint,
  side: BubbleTailSide,
): void => {
  const firstPoint = pointToCanvas(bubble, offsetY, first);
  const secondPoint = pointToCanvas(bubble, offsetY, second);
  const tipPoint = pointToCanvas(bubble, offsetY, tip);
  const baseSpan = Math.hypot(
    secondPoint.x - firstPoint.x,
    secondPoint.y - firstPoint.y,
  );
  const blend = Math.min(18, Math.max(5, baseSpan * 0.24));
  const tipPull = 0.28;
  let firstControl: { x: number; y: number };
  let firstTipControl: { x: number; y: number };
  let secondTipControl: { x: number; y: number };
  let secondControl: { x: number; y: number };

  if (side === 'top') {
    firstControl = { x: firstPoint.x + blend, y: firstPoint.y };
    firstTipControl = {
      x: tipPoint.x + (firstPoint.x - tipPoint.x) * tipPull,
      y: tipPoint.y + 6,
    };
    secondTipControl = {
      x: tipPoint.x + (secondPoint.x - tipPoint.x) * tipPull,
      y: tipPoint.y + 6,
    };
    secondControl = { x: secondPoint.x - blend, y: secondPoint.y };
  } else if (side === 'right') {
    firstControl = { x: firstPoint.x, y: firstPoint.y + blend };
    firstTipControl = {
      x: tipPoint.x - 6,
      y: tipPoint.y + (firstPoint.y - tipPoint.y) * tipPull,
    };
    secondTipControl = {
      x: tipPoint.x - 6,
      y: tipPoint.y + (secondPoint.y - tipPoint.y) * tipPull,
    };
    secondControl = { x: secondPoint.x, y: secondPoint.y - blend };
  } else if (side === 'left') {
    firstControl = { x: firstPoint.x, y: firstPoint.y - blend };
    firstTipControl = {
      x: tipPoint.x + 6,
      y: tipPoint.y + (firstPoint.y - tipPoint.y) * tipPull,
    };
    secondTipControl = {
      x: tipPoint.x + 6,
      y: tipPoint.y + (secondPoint.y - tipPoint.y) * tipPull,
    };
    secondControl = { x: secondPoint.x, y: secondPoint.y + blend };
  } else {
    firstControl = { x: firstPoint.x - blend, y: firstPoint.y };
    firstTipControl = {
      x: tipPoint.x + (firstPoint.x - tipPoint.x) * tipPull,
      y: tipPoint.y - 6,
    };
    secondTipControl = {
      x: tipPoint.x + (secondPoint.x - tipPoint.x) * tipPull,
      y: tipPoint.y - 6,
    };
    secondControl = { x: secondPoint.x + blend, y: secondPoint.y };
  }

  ctx.lineTo(firstPoint.x, firstPoint.y);
  ctx.bezierCurveTo(
    firstControl.x,
    firstControl.y,
    firstTipControl.x,
    firstTipControl.y,
    tipPoint.x,
    tipPoint.y,
  );
  ctx.bezierCurveTo(
    secondTipControl.x,
    secondTipControl.y,
    secondControl.x,
    secondControl.y,
    secondPoint.x,
    secondPoint.y,
  );
};

const speechBubblePathWithTail = (
  ctx: CanvasRenderingContext2D,
  bubble: Bubble,
  offsetY: number,
  radii: CanvasCornerRadii,
  points: BubbleTailPoint[] | null,
  tailSide: BubbleTailSide,
): void => {
  const maxRadius = Math.min(bubble.width / 2, bubble.height / 2);
  const topLeft = Math.min(radii.topLeft, maxRadius);
  const topRight = Math.min(radii.topRight, maxRadius);
  const bottomRight = Math.min(radii.bottomRight, maxRadius);
  const bottomLeft = Math.min(radii.bottomLeft, maxRadius);
  const [first, second, tip] = points ?? [];
  const hasTail = Boolean(first && second && tip);
  const x = bubble.x;
  const y = offsetY + bubble.y;
  const width = bubble.width;
  const height = bubble.height;

  ctx.beginPath();
  ctx.moveTo(x + topLeft, y);

  if (hasTail && tailSide === 'top') {
    appendSpeechTail(ctx, bubble, offsetY, first, second, tip, tailSide);
  }

  ctx.lineTo(x + width - topRight, y);
  ctx.arcTo(x + width, y, x + width, y + topRight, topRight);

  if (hasTail && tailSide === 'right') {
    appendSpeechTail(ctx, bubble, offsetY, first, second, tip, tailSide);
  }

  ctx.lineTo(x + width, y + height - bottomRight);
  ctx.arcTo(
    x + width,
    y + height,
    x + width - bottomRight,
    y + height,
    bottomRight,
  );

  if (hasTail && tailSide === 'bottom') {
    appendSpeechTail(ctx, bubble, offsetY, second, first, tip, tailSide);
  }

  ctx.lineTo(x + bottomLeft, y + height);
  ctx.arcTo(x, y + height, x, y + height - bottomLeft, bottomLeft);

  if (hasTail && tailSide === 'left') {
    appendSpeechTail(ctx, bubble, offsetY, second, first, tip, tailSide);
  }

  ctx.lineTo(x, y + topLeft);
  ctx.arcTo(x, y, x + topLeft, y, topLeft);
  ctx.closePath();
};

const drawEmptyPanel = (
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  x = 0,
  width = CANVAS_WIDTH,
): void => {
  ctx.fillStyle = '#eceee8';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#ced4cb';
  ctx.lineWidth = 2;
  for (let i = -height; i < width; i += 28) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + height);
    ctx.lineTo(x + i + height, y);
    ctx.stroke();
  }
};

const drawOutlinePathToCanvas = (
  ctx: CanvasRenderingContext2D,
  bubble: Bubble,
  offsetY: number,
  path: string,
  borderWidth: number,
): void => {
  const sourcePath = new Path2D(path);

  if (typeof DOMMatrix === 'function') {
    const matrix = new DOMMatrix()
      .translateSelf(bubble.x, offsetY + bubble.y)
      .scaleSelf(bubble.width / 100, bubble.height / 100);
    const canvasPath = new Path2D();
    canvasPath.addPath(sourcePath, matrix);
    ctx.fill(canvasPath);
    if (borderWidth > 0) ctx.stroke(canvasPath);
    return;
  }

  ctx.save();
  ctx.translate(bubble.x, offsetY + bubble.y);
  ctx.scale(bubble.width / 100, bubble.height / 100);
  ctx.fill(sourcePath);
  if (borderWidth > 0) ctx.stroke(sourcePath);
  ctx.restore();
};

const drawThoughtTailDots = (
  ctx: CanvasRenderingContext2D,
  bubble: Bubble,
  offsetY: number,
  borderWidth: number,
): void => {
  const dots = getThoughtTailDots(bubble);
  if (!dots) return;

  const large = pointToCanvas(bubble, offsetY, dots.large);
  const small = pointToCanvas(bubble, offsetY, dots.small);
  const dotStrokeWidth = Math.max(borderWidth, 1);

  [
    { point: large, radius: 8 },
    { point: small, radius: 4 },
  ].forEach(({ point, radius }) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (borderWidth > 0) {
      ctx.lineWidth = dotStrokeWidth;
      ctx.stroke();
    }
  });
};

const drawBubbleToCanvas = (
  ctx: CanvasRenderingContext2D,
  bubble: Bubble,
  offsetY: number,
): void => {
  ctx.save();
  const style = resolveBubbleStyle(bubble);
  const fontStyle =
    bubble.type === 'sfx' || bubble.type === 'monologue' ? 'italic ' : '';
  ctx.font = `${fontStyle}${style.cssFontWeight} ${bubble.fontSize}px ${style.canvasFontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (bubble.type === 'sfx') {
    ctx.fillStyle = style.textColor;
    ctx.strokeStyle = style.fillColor;
    ctx.lineWidth = Math.max(4, style.borderWidth * 2);
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

  ctx.fillStyle = style.fillColor;
  ctx.strokeStyle = style.borderColor;
  ctx.lineWidth = style.borderWidth;
  if (style.borderStyle === 'dashed') ctx.setLineDash([10, 7]);
  if (style.borderStyle === 'dotted') ctx.setLineDash([2, 6]);

  const cornerRadii = {
    topLeft: style.radiusTopLeft,
    topRight: style.radiusTopRight,
    bottomRight: style.radiusBottomRight,
    bottomLeft: style.radiusBottomLeft,
  };
  const outlinePath = getBubbleOutlineSvgPath(bubble);

  if (outlinePath) {
    drawOutlinePathToCanvas(
      ctx,
      bubble,
      offsetY,
      outlinePath.path,
      style.borderWidth,
    );
    if (bubble.type === 'thought') {
      drawThoughtTailDots(ctx, bubble, offsetY, style.borderWidth);
    }
  } else {
    if (bubble.type === 'speech') {
      speechBubblePathWithTail(
        ctx,
        bubble,
        offsetY,
        cornerRadii,
        getBubbleTailPoints(bubble),
        style.tailSide,
      );
    } else {
      roundedRectWithCorners(
        ctx,
        bubble.x,
        offsetY + bubble.y,
        bubble.width,
        bubble.height,
        cornerRadii,
      );
    }

    ctx.fill();
    if (style.borderWidth > 0) ctx.stroke();
  }

  ctx.setLineDash([]);
  const lines = wrapText(ctx, bubble.text, bubble.width - 28).slice(0, 4);
  ctx.fillStyle = style.textColor;
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
