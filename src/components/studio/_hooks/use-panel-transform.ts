import { useEffect, useRef } from 'react';
import {
  MIN_PANEL_HEIGHT,
  MIN_PANEL_WIDTH,
  WEBTOON_CANVAS_WIDTH,
} from '@shared/project-state';
import { clamp } from '../_lib/canvas-primitives';
import { getPanelCanvasHeight } from '../_lib/canvas-state';
import {
  getPrimarySelectionId,
  getSelectedPanelIds,
} from '../_lib/selection-state';
import type {
  Bubble,
  PanelResizeHandle,
  PanelTransform,
  PanelTransformStartPosition,
  PanelTransformStartPayload,
  StudioState,
  StudioStateSetter,
} from '../_lib/types';

const quantize = (value: number): number => Math.round(value);

const handleTouchesWest = (handle: PanelResizeHandle | null): boolean =>
  handle === 'w' || handle === 'nw' || handle === 'sw';

const handleTouchesEast = (handle: PanelResizeHandle | null): boolean =>
  handle === 'e' || handle === 'ne' || handle === 'se';

const handleTouchesNorth = (handle: PanelResizeHandle | null): boolean =>
  handle === 'n' || handle === 'ne' || handle === 'nw';

const handleTouchesSouth = (handle: PanelResizeHandle | null): boolean =>
  handle === 's' || handle === 'se' || handle === 'sw';

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

const getInteractionPanelIds = (
  state: StudioState,
  panelId: string,
  canvasId: string,
  shiftKey: boolean,
): { panelIds: string[]; shouldStartDrag: boolean } => {
  const selectedIds = getSameCanvasPanelIds(
    state,
    getSelectedPanelIds(state),
    canvasId,
  );
  const isSelected = selectedIds.includes(panelId);

  if (!shiftKey) {
    return {
      panelIds: isSelected && selectedIds.length > 0 ? selectedIds : [panelId],
      shouldStartDrag: true,
    };
  }

  if (isSelected) {
    return {
      panelIds: selectedIds.filter((id) => id !== panelId),
      shouldStartDrag: false,
    };
  }

  return {
    panelIds: [...selectedIds, panelId],
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
        WEBTOON_CANVAS_WIDTH - start.startX - start.startWidth,
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

const usePanelTransform = (setState: StudioStateSetter) => {
  const transformRef = useRef<PanelTransform | null>(null);

  const handlePanelTransformStart = ({
    event,
    panel,
    mode,
    resizeHandle,
    canvasHeight,
  }: PanelTransformStartPayload): void => {
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {}

    const stage = event.currentTarget.closest<HTMLElement>('.webtoon-stage');
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const pointerX =
      ((event.clientX - rect.left) / rect.width) * WEBTOON_CANVAS_WIDTH;
    const pointerY = ((event.clientY - rect.top) / rect.height) * canvasHeight;
    const snapshot = setState.getSnapshot();
    const interaction = getInteractionPanelIds(
      snapshot,
      panel.id,
      panel.canvasId,
      event.shiftKey,
    );
    const primaryPanelId = getPrimarySelectionId(interaction.panelIds);

    setState((current) => ({
      ...current,
      selectedCanvasId: panel.canvasId,
      selectedPanelId: primaryPanelId,
      selectedPanelIds: interaction.panelIds,
      selectedBubbleId: null,
      selectedBubbleIds: [],
    }));

    if (!interaction.shouldStartDrag) {
      transformRef.current = null;
      return;
    }

    const dragSnapshot = setState.getSnapshot();
    const panelStartPositions = getPanelStartPositions(
      dragSnapshot,
      interaction.panelIds,
    );
    if (panelStartPositions.length === 0) return;

    transformRef.current = {
      mode,
      panelId: panel.id,
      resizeHandle: resizeHandle ?? null,
      rect,
      canvasHeight,
      historyStart: dragSnapshot,
      panelStartPositions,
      offsetX: pointerX - panel.x,
      offsetY: pointerY - panel.y,
      startX: panel.x,
      startY: panel.y,
      startWidth: panel.width,
      startHeight: panel.height,
    };
  };

  /**
   * Tracks global pointer movement while a panel is moved or resized inside the webtoon stage.
   */
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const transform = transformRef.current;
      if (!transform) return;

      const pointerX = clamp(
        ((event.clientX - transform.rect.left) / transform.rect.width) *
          WEBTOON_CANVAS_WIDTH,
        0,
        WEBTOON_CANVAS_WIDTH,
      );
      const pointerY = clamp(
        ((event.clientY - transform.rect.top) / transform.rect.height) *
          transform.canvasHeight,
        0,
        transform.canvasHeight,
      );
      const startById = new Map(
        transform.panelStartPositions.map((start) => [start.panelId, start]),
      );
      const bounds = getMoveDeltaBounds(
        transform.panelStartPositions,
        transform.canvasHeight,
      );
      const rawMoveDeltaX = pointerX - transform.offsetX - transform.startX;
      const rawMoveDeltaY = pointerY - transform.offsetY - transform.startY;
      const moveDeltaX = quantize(
        clamp(rawMoveDeltaX, bounds.minX, bounds.maxX),
      );
      const moveDeltaY = quantize(
        clamp(rawMoveDeltaY, bounds.minY, bounds.maxY),
      );

      setState.transient((current) => ({
        ...current,
        panels: current.panels.map((panel) => {
          if (transform.mode === 'move') {
            const start = startById.get(panel.id);
            if (!start) return panel;

            const x = start.startX + moveDeltaX;
            const y = start.startY + moveDeltaY;
            const panelDeltaX = x - panel.x;
            const panelDeltaY = y - panel.y;

            return {
              ...panel,
              x,
              y,
              bubbles: keepBubbleStagePositions(
                panel.bubbles,
                panelDeltaX,
                panelDeltaY,
              ),
            };
          }

          if (panel.id !== transform.panelId) return panel;

          const resizeHandle = transform.resizeHandle;
          const startLeft = transform.startX;
          const startTop = transform.startY;
          const startRight = transform.startX + transform.startWidth;
          const startBottom = transform.startY + transform.startHeight;
          const canvasHeight = getPanelCanvasHeight(current, panel);
          const left = handleTouchesWest(resizeHandle)
            ? clamp(pointerX, 0, startRight - MIN_PANEL_WIDTH)
            : startLeft;
          const right = handleTouchesEast(resizeHandle)
            ? clamp(pointerX, startLeft + MIN_PANEL_WIDTH, WEBTOON_CANVAS_WIDTH)
            : startRight;
          const top = handleTouchesNorth(resizeHandle)
            ? clamp(pointerY, 0, startBottom - MIN_PANEL_HEIGHT)
            : startTop;
          const bottom = handleTouchesSouth(resizeHandle)
            ? clamp(pointerY, startTop + MIN_PANEL_HEIGHT, canvasHeight)
            : startBottom;

          const x = quantize(left);
          const y = quantize(top);
          const deltaX = x - panel.x;
          const deltaY = y - panel.y;

          return {
            ...panel,
            x,
            y,
            width: quantize(right - left),
            height: quantize(bottom - top),
            bubbles: keepBubbleStagePositions(panel.bubbles, deltaX, deltaY),
          };
        }),
      }));
    };

    const handlePointerUp = (): void => {
      const transform = transformRef.current;
      if (!transform) return;

      setState.commitHistory(transform.historyStart);
      transformRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [setState]);

  return { handlePanelTransformStart };
};

export { usePanelTransform };
