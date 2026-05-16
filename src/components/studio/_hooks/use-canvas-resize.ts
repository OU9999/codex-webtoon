import { useEffect, useRef } from 'react';
import { MIN_CANVAS_HEIGHT } from '@shared/project-state';
import { clamp } from '../_lib/canvas-primitives';
import { getCanvasPanels } from '../_lib/canvas-state';
import { getMinimumCanvasHeightForContent } from '../_lib/panel-geometry';
import type {
  CanvasResize,
  CanvasResizeStartPayload,
  StudioStateSetter,
} from '../_lib/types';

const MAX_CANVAS_HEIGHT = 3600;
const AUTO_SCROLL_EDGE_SIZE = 96;
const AUTO_SCROLL_MAX_STEP = 18;

const quantize = (value: number): number => Math.round(value);

const getAutoScrollStep = (
  scrollContainer: HTMLElement,
  clientY: number,
): number => {
  const rect = scrollContainer.getBoundingClientRect();
  const bottomDistance = rect.bottom - clientY;
  if (bottomDistance < AUTO_SCROLL_EDGE_SIZE) {
    const intensity = clamp(
      (AUTO_SCROLL_EDGE_SIZE - bottomDistance) / AUTO_SCROLL_EDGE_SIZE,
      0,
      1,
    );
    return intensity * AUTO_SCROLL_MAX_STEP;
  }

  const topDistance = clientY - rect.top;
  if (topDistance < AUTO_SCROLL_EDGE_SIZE) {
    const intensity = clamp(
      (AUTO_SCROLL_EDGE_SIZE - topDistance) / AUTO_SCROLL_EDGE_SIZE,
      0,
      1,
    );
    return -intensity * AUTO_SCROLL_MAX_STEP;
  }

  return 0;
};

const calculateCanvasHeight = (resize: CanvasResize): number => {
  const scrollDelta = resize.scrollContainer
    ? resize.scrollContainer.scrollTop - resize.scrollStartTop
    : 0;
  const pointerDelta = resize.lastClientY - resize.pointerStartY + scrollDelta;
  const deltaY = (pointerDelta / resize.rect.height) * resize.canvasHeight;

  return quantize(
    clamp(resize.canvasHeight + deltaY, MIN_CANVAS_HEIGHT, MAX_CANVAS_HEIGHT),
  );
};

const useCanvasResize = (setState: StudioStateSetter) => {
  const resizeRef = useRef<CanvasResize | null>(null);

  const handleCanvasResizeStart = ({
    event,
    canvasId,
    canvasHeight,
  }: CanvasResizeStartPayload): void => {
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {}

    const stage = event.currentTarget.closest<HTMLElement>('.webtoon-stage');
    if (!stage) return;
    const scrollContainer = stage.closest<HTMLElement>(
      '[data-canvas-scroll-container]',
    );

    resizeRef.current = {
      canvasId,
      rect: stage.getBoundingClientRect(),
      canvasHeight,
      historyStart: setState.getSnapshot(),
      lastClientY: event.clientY,
      pointerStartY: event.clientY,
      scrollContainer,
      scrollFrame: null,
      scrollStartTop: scrollContainer?.scrollTop ?? 0,
    };
  };

  /**
   * Tracks global pointer movement while the webtoon stage height is resized from its bottom grip.
   */
  useEffect(() => {
    const applyCanvasResize = (resize: CanvasResize): void => {
      const requestedCanvasHeight = calculateCanvasHeight(resize);

      setState.transient((current) => ({
        ...current,
        canvases: current.canvases.map((canvas) =>
          canvas.id === resize.canvasId
            ? {
                ...canvas,
                height: Math.max(
                  requestedCanvasHeight,
                  getMinimumCanvasHeightForContent(
                    getCanvasPanels(current, canvas.id),
                  ),
                ),
              }
            : canvas,
        ),
      }));
    };

    const stopAutoScroll = (resize: CanvasResize): void => {
      if (resize.scrollFrame === null) return;

      cancelAnimationFrame(resize.scrollFrame);
      resize.scrollFrame = null;
    };

    const runAutoScroll = (): void => {
      const resize = resizeRef.current;
      if (!resize || !resize.scrollContainer) return;

      const step = getAutoScrollStep(
        resize.scrollContainer,
        resize.lastClientY,
      );
      if (Math.abs(step) < 0.1) {
        stopAutoScroll(resize);
        return;
      }

      const previousScrollTop = resize.scrollContainer.scrollTop;
      resize.scrollContainer.scrollTop += step;
      if (resize.scrollContainer.scrollTop !== previousScrollTop) {
        applyCanvasResize(resize);
        resize.scrollFrame = requestAnimationFrame(runAutoScroll);
        return;
      }

      stopAutoScroll(resize);
    };

    const startAutoScroll = (resize: CanvasResize): void => {
      if (!resize.scrollContainer) return;
      if (resize.scrollFrame !== null) return;

      const step = getAutoScrollStep(
        resize.scrollContainer,
        resize.lastClientY,
      );
      if (Math.abs(step) < 0.1) return;

      resize.scrollFrame = requestAnimationFrame(runAutoScroll);
    };

    const handlePointerMove = (event: PointerEvent): void => {
      const resize = resizeRef.current;
      if (!resize) return;

      event.preventDefault();
      resize.lastClientY = event.clientY;
      applyCanvasResize(resize);
      startAutoScroll(resize);
    };

    const handlePointerUp = (): void => {
      const resize = resizeRef.current;
      if (!resize) return;

      stopAutoScroll(resize);
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
