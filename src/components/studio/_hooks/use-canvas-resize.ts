import { useEffect, useRef } from 'react';
import { MIN_CANVAS_HEIGHT } from '@shared/project-state';
import { clamp } from '../_lib/canvas-primitives';
import { clampPanelToCanvas } from '../_lib/panel-geometry';
import type {
  CanvasResize,
  CanvasResizeStartPayload,
  StudioStateSetter,
} from '../_lib/types';

const MAX_CANVAS_HEIGHT = 3600;

const quantize = (value: number): number => Math.round(value);

const useCanvasResize = (setState: StudioStateSetter) => {
  const resizeRef = useRef<CanvasResize | null>(null);

  const handleCanvasResizeStart = ({
    event,
    canvasHeight,
  }: CanvasResizeStartPayload): void => {
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {}

    const stage = event.currentTarget.closest<HTMLElement>('.webtoon-stage');
    if (!stage) return;

    resizeRef.current = {
      rect: stage.getBoundingClientRect(),
      canvasHeight,
      historyStart: setState.getSnapshot(),
      pointerStartY: event.clientY,
    };
  };

  /**
   * Tracks global pointer movement while the webtoon stage height is resized from its bottom grip.
   */
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const resize = resizeRef.current;
      if (!resize) return;

      const deltaY =
        ((event.clientY - resize.pointerStartY) / resize.rect.height) *
        resize.canvasHeight;
      const canvasHeight = quantize(
        clamp(
          resize.canvasHeight + deltaY,
          MIN_CANVAS_HEIGHT,
          MAX_CANVAS_HEIGHT,
        ),
      );

      setState.transient((current) => ({
        ...current,
        canvasHeight,
        panels: current.panels.map((panel) =>
          clampPanelToCanvas(panel, canvasHeight),
        ),
      }));
    };

    const handlePointerUp = (): void => {
      const resize = resizeRef.current;
      if (!resize) return;

      setState.commitHistory(resize.historyStart);
      resizeRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [setState]);

  return { handleCanvasResizeStart };
};

export { useCanvasResize };
