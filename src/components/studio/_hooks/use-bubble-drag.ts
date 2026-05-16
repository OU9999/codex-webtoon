import { useEffect, useRef } from 'react';
import { clamp } from '../_lib/canvas-primitives';
import { CANVAS_WIDTH } from '../_lib/constants';
import type {
  Bubble,
  BubbleDrag,
  BubbleDragStartPayload,
  BubbleResizeAnchor,
  BubbleTailSide,
  StudioStateSetter,
} from '../_lib/types';

const MIN_BUBBLE_WIDTH = 72;
const MIN_BUBBLE_HEIGHT = 44;
const TAIL_TIP_MIN = -120;
const TAIL_TIP_MAX = 220;
const TAIL_POSITION_MIN = 5;
const TAIL_POSITION_MAX = 95;

const resizeFromAnchor = (
  bubble: Bubble,
  drag: BubbleDrag,
  anchor: BubbleResizeAnchor,
  x: number,
  y: number,
): Bubble => {
  const deltaX = x - drag.pointerStartX;
  const deltaY = y - drag.pointerStartY;
  const maxWidth = CANVAS_WIDTH * 2;
  const maxHeight = drag.panelHeight * 2;
  let nextX = drag.bubbleStartX;
  let nextY = drag.bubbleStartY;
  let nextWidth = drag.bubbleStartWidth;
  let nextHeight = drag.bubbleStartHeight;

  if (anchor.includes('e')) {
    nextWidth = clamp(
      drag.bubbleStartWidth + deltaX,
      MIN_BUBBLE_WIDTH,
      maxWidth,
    );
  }

  if (anchor.includes('s')) {
    nextHeight = clamp(
      drag.bubbleStartHeight + deltaY,
      MIN_BUBBLE_HEIGHT,
      maxHeight,
    );
  }

  if (anchor.includes('w')) {
    nextWidth = clamp(
      drag.bubbleStartWidth - deltaX,
      MIN_BUBBLE_WIDTH,
      maxWidth,
    );
    nextX = drag.bubbleStartX + drag.bubbleStartWidth - nextWidth;
  }

  if (anchor.includes('n')) {
    nextHeight = clamp(
      drag.bubbleStartHeight - deltaY,
      MIN_BUBBLE_HEIGHT,
      maxHeight,
    );
    nextY = drag.bubbleStartY + drag.bubbleStartHeight - nextHeight;
  }

  return {
    ...bubble,
    x: clamp(nextX, -CANVAS_WIDTH, CANVAS_WIDTH * 2),
    y: clamp(nextY, -drag.panelHeight, drag.panelHeight * 2),
    width: nextWidth,
    height: nextHeight,
  };
};

const resolveTailSide = (
  bubble: Bubble,
  x: number,
  y: number,
): BubbleTailSide => {
  const centerX = bubble.x + bubble.width / 2;
  const centerY = bubble.y + bubble.height / 2;
  const normalizedX = (x - centerX) / Math.max(bubble.width / 2, 1);
  const normalizedY = (y - centerY) / Math.max(bubble.height / 2, 1);

  if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
    return normalizedX >= 0 ? 'right' : 'left';
  }

  return normalizedY >= 0 ? 'bottom' : 'top';
};

const resolveTailPosition = (
  side: BubbleTailSide,
  tipX: number,
  tipY: number,
): number => {
  if (side === 'left' || side === 'right') {
    return clamp(tipY, TAIL_POSITION_MIN, TAIL_POSITION_MAX);
  }

  return clamp(tipX, TAIL_POSITION_MIN, TAIL_POSITION_MAX);
};

const moveTail = (bubble: Bubble, x: number, y: number): Bubble => {
  if (bubble.width <= 0) return bubble;
  if (bubble.height <= 0) return bubble;

  const tailTipX = clamp(
    ((x - bubble.x) / bubble.width) * 100,
    TAIL_TIP_MIN,
    TAIL_TIP_MAX,
  );
  const tailTipY = clamp(
    ((y - bubble.y) / bubble.height) * 100,
    TAIL_TIP_MIN,
    TAIL_TIP_MAX,
  );
  const tailSide = resolveTailSide(bubble, x, y);

  return {
    ...bubble,
    tailSide,
    tailPosition: resolveTailPosition(tailSide, tailTipX, tailTipY),
    tailTipX,
    tailTipY,
  };
};

const useBubbleDrag = (setState: StudioStateSetter) => {
  const dragRef = useRef<BubbleDrag | null>(null);

  const handleBubbleDragStart = ({
    event,
    bubble,
    panel,
    mode,
    resizeAnchor,
    canvasHeight,
  }: BubbleDragStartPayload): void => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const stage = event.currentTarget.closest<HTMLElement>('.webtoon-stage');
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const pointerStageX =
      ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const pointerStageY =
      ((event.clientY - rect.top) / rect.height) * canvasHeight;
    const pointerX = pointerStageX - panel.x;
    const pointerY = pointerStageY - panel.y;

    setState((current) => ({
      ...current,
      selectedCanvasId: panel.canvasId,
      selectedPanelId: null,
      selectedBubbleId: bubble.id,
    }));
    dragRef.current = {
      mode,
      panelId: panel.id,
      bubbleId: bubble.id,
      resizeAnchor,
      rect,
      canvasHeight,
      historyStart: setState.getSnapshot(),
      panelX: panel.x,
      panelY: panel.y,
      panelHeight: panel.height,
      pointerStartX: pointerX,
      pointerStartY: pointerY,
      bubbleStartX: bubble.x,
      bubbleStartY: bubble.y,
      bubbleStartWidth: bubble.width,
      bubbleStartHeight: bubble.height,
      offsetX: pointerX - bubble.x,
      offsetY: pointerY - bubble.y,
    };
  };

  /**
   * Handles global pointer movement while a canvas bubble layer is being moved, resized, or tail-edited.
   */
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const drag = dragRef.current;
      if (!drag) return;

      const stageX =
        ((event.clientX - drag.rect.left) / drag.rect.width) * CANVAS_WIDTH;
      const stageY =
        ((event.clientY - drag.rect.top) / drag.rect.height) *
        drag.canvasHeight;
      const x = stageX - drag.panelX;
      const y = stageY - drag.panelY;
      const minX = -CANVAS_WIDTH;
      const maxX = CANVAS_WIDTH * 2;
      const minY = -drag.panelHeight;
      const maxY = drag.panelHeight * 2;

      setState.transient((current) => ({
        ...current,
        panels: current.panels.map((panel) => {
          if (panel.id !== drag.panelId) return panel;

          return {
            ...panel,
            bubbles: panel.bubbles.map((bubble) => {
              if (bubble.id !== drag.bubbleId) return bubble;

              if (drag.mode === 'tail') {
                return moveTail(bubble, x, y);
              }

              if (drag.mode === 'move') {
                return {
                  ...bubble,
                  x: clamp(x - drag.offsetX, minX, maxX),
                  y: clamp(y - drag.offsetY, minY, maxY),
                };
              }

              return resizeFromAnchor(
                bubble,
                drag,
                drag.resizeAnchor ?? 'se',
                x,
                y,
              );
            }),
          };
        }),
      }));
    };

    const handlePointerUp = (): void => {
      const drag = dragRef.current;
      if (!drag) return;

      setState.commitHistory(drag.historyStart);
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [setState]);

  return { handleBubbleDragStart };
};

export { useBubbleDrag };
