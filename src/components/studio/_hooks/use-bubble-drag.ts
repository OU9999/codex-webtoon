import { useEffect, useRef } from 'react';
import { clamp } from '../_lib/canvas-primitives';
import { CANVAS_WIDTH } from '../_lib/constants';
import {
  getBubbleStartPositions,
  getPanelByBubbleId,
  getPrimarySelectionId,
  getSelectedBubbleIds,
  getSelectedPanelIds,
} from '../_lib/selection-state';
import type {
  Bubble,
  BubbleDrag,
  BubbleDragStartPosition,
  BubbleDragStartPayload,
  BubbleResizeAnchor,
  BubbleTailSide,
  PanelTransformStartPosition,
  StudioState,
  StudioStateSetter,
} from '../_lib/types';

const MIN_BUBBLE_WIDTH = 72;
const MIN_BUBBLE_HEIGHT = 44;
const TAIL_TIP_MIN = -120;
const TAIL_TIP_MAX = 220;
const TAIL_POSITION_MIN = 5;
const TAIL_POSITION_MAX = 95;

const moveBubble = (bubble: Bubble, drag: BubbleDrag, x: number, y: number) => {
  return {
    ...bubble,
    x: x - drag.offsetX,
    y: y - drag.offsetY,
  };
};

const moveBubbleByDelta = (
  bubble: Bubble,
  start: BubbleDragStartPosition,
  panelX: number,
  panelY: number,
  deltaX: number,
  deltaY: number,
): Bubble => {
  return {
    ...bubble,
    x: start.startStageX + deltaX - panelX,
    y: start.startStageY + deltaY - panelY,
  };
};

const keepBubbleStagePositions = (
  bubbles: Bubble[],
  deltaX: number,
  deltaY: number,
): Bubble[] => {
  if (deltaX === 0 && deltaY === 0) return bubbles;

  return bubbles.map((bubble) => ({
    ...bubble,
    x: bubble.x - deltaX,
    y: bubble.y - deltaY,
  }));
};

const resizeFromAnchor = (
  bubble: Bubble,
  drag: BubbleDrag,
  anchor: BubbleResizeAnchor,
  x: number,
  y: number,
): Bubble => {
  const deltaX = x - drag.pointerStartX;
  const deltaY = y - drag.pointerStartY;
  let nextX = drag.bubbleStartX;
  let nextY = drag.bubbleStartY;
  let nextWidth = drag.bubbleStartWidth;
  let nextHeight = drag.bubbleStartHeight;

  if (anchor.includes('e')) {
    nextWidth = Math.max(drag.bubbleStartWidth + deltaX, MIN_BUBBLE_WIDTH);
  }

  if (anchor.includes('s')) {
    nextHeight = Math.max(drag.bubbleStartHeight + deltaY, MIN_BUBBLE_HEIGHT);
  }

  if (anchor.includes('w')) {
    nextWidth = Math.max(drag.bubbleStartWidth - deltaX, MIN_BUBBLE_WIDTH);
    nextX = drag.bubbleStartX + drag.bubbleStartWidth - nextWidth;
  }

  if (anchor.includes('n')) {
    nextHeight = Math.max(drag.bubbleStartHeight - deltaY, MIN_BUBBLE_HEIGHT);
    nextY = drag.bubbleStartY + drag.bubbleStartHeight - nextHeight;
  }

  return {
    ...bubble,
    x: nextX,
    y: nextY,
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

const getSameCanvasBubbleIds = (
  state: StudioState,
  bubbleIds: string[],
  canvasId: string,
): string[] => {
  return bubbleIds.filter((bubbleId) => {
    const panel = getPanelByBubbleId(state, bubbleId);

    return panel?.canvasId === canvasId;
  });
};

const getSameCanvasPanelIds = (
  state: StudioState,
  panelIds: string[],
  canvasId: string,
): string[] => {
  const panelCanvasById = new Map(
    state.panels.map((panel) => [panel.id, panel.canvasId]),
  );

  return panelIds.filter((id) => panelCanvasById.get(id) === canvasId);
};

const getInteractionBubbleIds = (
  state: StudioState,
  bubbleId: string,
  canvasId: string,
  shiftKey: boolean,
): { bubbleIds: string[]; shouldStartDrag: boolean } => {
  const selectedIds = getSameCanvasBubbleIds(
    state,
    getSelectedBubbleIds(state),
    canvasId,
  );
  const isSelected = selectedIds.includes(bubbleId);

  if (!shiftKey) {
    return {
      bubbleIds:
        isSelected && selectedIds.length > 0 ? selectedIds : [bubbleId],
      shouldStartDrag: true,
    };
  }

  if (isSelected) {
    return {
      bubbleIds: selectedIds.filter((id) => id !== bubbleId),
      shouldStartDrag: false,
    };
  }

  return {
    bubbleIds: [...selectedIds, bubbleId],
    shouldStartDrag: true,
  };
};

const getPanelStartPositions = (
  state: StudioState,
  panelIds: string[],
): PanelTransformStartPosition[] => {
  const selectedIds = new Set(panelIds);

  return state.panels
    .filter((panel) => selectedIds.has(panel.id))
    .map((panel) => ({
      panelId: panel.id,
      startX: panel.x,
      startY: panel.y,
      startWidth: panel.width,
      startHeight: panel.height,
    }));
};

const getMoveDeltaBounds = (
  starts: PanelTransformStartPosition[],
  canvasHeight: number,
): { minX: number; maxX: number; minY: number; maxY: number } => {
  return starts.reduce(
    (bounds, start) => ({
      minX: Math.max(bounds.minX, -start.startX),
      maxX: Math.min(
        bounds.maxX,
        CANVAS_WIDTH - start.startX - start.startWidth,
      ),
      minY: Math.max(bounds.minY, -start.startY),
      maxY: Math.min(
        bounds.maxY,
        canvasHeight - start.startY - start.startHeight,
      ),
    }),
    {
      minX: Number.NEGATIVE_INFINITY,
      maxX: Number.POSITIVE_INFINITY,
      minY: Number.NEGATIVE_INFINITY,
      maxY: Number.POSITIVE_INFINITY,
    },
  );
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
    const snapshot = setState.getSnapshot();
    const interaction = getInteractionBubbleIds(
      snapshot,
      bubble.id,
      panel.canvasId,
      event.shiftKey,
    );
    const sameCanvasSelectedPanelIds = getSameCanvasPanelIds(
      snapshot,
      getSelectedPanelIds(snapshot),
      panel.canvasId,
    );
    const shouldKeepPanelSelection =
      event.shiftKey || getSelectedBubbleIds(snapshot).includes(bubble.id);
    const selectedPanelIds = shouldKeepPanelSelection
      ? sameCanvasSelectedPanelIds
      : [];
    const primaryBubbleId = getPrimarySelectionId(interaction.bubbleIds);
    const primaryPanelId =
      interaction.bubbleIds.length > 0
        ? null
        : getPrimarySelectionId(selectedPanelIds);

    setState((current) => ({
      ...current,
      selectedCanvasId: panel.canvasId,
      selectedPanelId: primaryPanelId,
      selectedPanelIds,
      selectedBubbleId: primaryBubbleId,
      selectedBubbleIds: interaction.bubbleIds,
    }));

    if (!interaction.shouldStartDrag) {
      dragRef.current = null;
      return;
    }

    const dragSnapshot = setState.getSnapshot();
    const bubbleStartPositions = getBubbleStartPositions(
      dragSnapshot,
      interaction.bubbleIds,
    );
    const panelStartPositions = getPanelStartPositions(
      dragSnapshot,
      selectedPanelIds,
    );
    if (bubbleStartPositions.length === 0) return;

    dragRef.current = {
      mode,
      panelId: panel.id,
      bubbleId: bubble.id,
      resizeAnchor,
      rect,
      canvasHeight,
      historyStart: dragSnapshot,
      panelX: panel.x,
      panelY: panel.y,
      panelHeight: panel.height,
      panelStartPositions,
      bubbleStartPositions,
      pointerStageStartX: pointerStageX,
      pointerStageStartY: pointerStageY,
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
      const rawMoveDeltaX = stageX - drag.pointerStageStartX;
      const rawMoveDeltaY = stageY - drag.pointerStageStartY;
      const bounds = getMoveDeltaBounds(
        drag.panelStartPositions,
        drag.canvasHeight,
      );
      const moveDeltaX =
        drag.panelStartPositions.length > 0
          ? clamp(rawMoveDeltaX, bounds.minX, bounds.maxX)
          : rawMoveDeltaX;
      const moveDeltaY =
        drag.panelStartPositions.length > 0
          ? clamp(rawMoveDeltaY, bounds.minY, bounds.maxY)
          : rawMoveDeltaY;
      const startById = new Map(
        drag.bubbleStartPositions.map((start) => [start.bubbleId, start]),
      );
      const panelStartById = new Map(
        drag.panelStartPositions.map((start) => [start.panelId, start]),
      );

      setState.transient((current) => ({
        ...current,
        panels: current.panels.map((panel) => {
          if (drag.mode === 'move') {
            const panelStart = panelStartById.get(panel.id);
            const nextX = panelStart ? panelStart.startX + moveDeltaX : panel.x;
            const nextY = panelStart ? panelStart.startY + moveDeltaY : panel.y;
            const panelDeltaX = nextX - panel.x;
            const panelDeltaY = nextY - panel.y;
            const stageKeptBubbles = panelStart
              ? keepBubbleStagePositions(
                  panel.bubbles,
                  panelDeltaX,
                  panelDeltaY,
                )
              : panel.bubbles;
            const bubbles = stageKeptBubbles.map((bubble) => {
              const start = startById.get(bubble.id);
              if (!start) return bubble;

              return moveBubbleByDelta(
                bubble,
                start,
                nextX,
                nextY,
                moveDeltaX,
                moveDeltaY,
              );
            });

            return {
              ...panel,
              x: nextX,
              y: nextY,
              bubbles,
            };
          }

          return {
            ...panel,
            bubbles: panel.bubbles.map((bubble) => {
              if (drag.mode === 'tail') {
                if (bubble.id !== drag.bubbleId) return bubble;

                return moveTail(bubble, x, y);
              }

              if (bubble.id !== drag.bubbleId) return bubble;

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

export { moveBubble, useBubbleDrag };
