import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  MIN_PANEL_HEIGHT,
  MIN_PANEL_WIDTH,
  WEBTOON_CANVAS_WIDTH,
} from '@shared/project-state';
import { clamp } from '../_lib/canvas-primitives';
import type {
  PanelResizeHandle,
  PanelTransform,
  PanelTransformStartPayload,
  StudioState,
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

const usePanelTransform = (setState: Dispatch<SetStateAction<StudioState>>) => {
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

    setState((current) => ({
      ...current,
      selectedPanelId: panel.id,
      selectedBubbleId: null,
    }));
    transformRef.current = {
      mode,
      panelId: panel.id,
      resizeHandle: resizeHandle ?? null,
      rect,
      canvasHeight,
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

      setState((current) => ({
        ...current,
        panels: current.panels.map((panel) => {
          if (panel.id !== transform.panelId) return panel;

          if (transform.mode === 'move') {
            return {
              ...panel,
              x: quantize(
                clamp(
                  pointerX - transform.offsetX,
                  0,
                  WEBTOON_CANVAS_WIDTH - panel.width,
                ),
              ),
              y: quantize(
                clamp(
                  pointerY - transform.offsetY,
                  0,
                  current.canvasHeight - panel.height,
                ),
              ),
            };
          }

          const resizeHandle = transform.resizeHandle;
          const startLeft = transform.startX;
          const startTop = transform.startY;
          const startRight = transform.startX + transform.startWidth;
          const startBottom = transform.startY + transform.startHeight;
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
            ? clamp(pointerY, startTop + MIN_PANEL_HEIGHT, current.canvasHeight)
            : startBottom;

          return {
            ...panel,
            x: quantize(left),
            y: quantize(top),
            width: quantize(right - left),
            height: quantize(bottom - top),
          };
        }),
      }));
    };

    const handlePointerUp = (): void => {
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
