import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { clamp } from '../_lib/canvas-primitives';
import { CANVAS_WIDTH } from '../_lib/constants';
import type {
  BubbleDrag,
  BubbleDragStartPayload,
  StudioState,
} from '../_lib/types';

const useBubbleDrag = (setState: Dispatch<SetStateAction<StudioState>>) => {
  const dragRef = useRef<BubbleDrag | null>(null);

  const handleBubbleDragStart = ({
    event,
    bubble,
    panel,
    mode,
  }: BubbleDragStartPayload): void => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const frame = event.currentTarget.closest<HTMLElement>('.panel-frame');
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const pointerY = ((event.clientY - rect.top) / rect.height) * panel.height;

    setState((current) => ({
      ...current,
      selectedPanelId: panel.id,
      selectedBubbleId: bubble.id,
    }));
    dragRef.current = {
      mode,
      panelId: panel.id,
      bubbleId: bubble.id,
      rect,
      panelHeight: panel.height,
      offsetX: pointerX - bubble.x,
      offsetY: pointerY - bubble.y,
    };
  };

  /**
   * Handles global pointer movement while a canvas bubble layer is being dragged or resized.
   */
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const drag = dragRef.current;
      if (!drag) return;

      const x = clamp(
        ((event.clientX - drag.rect.left) / drag.rect.width) * CANVAS_WIDTH,
        0,
        CANVAS_WIDTH - 24,
      );
      const y = clamp(
        ((event.clientY - drag.rect.top) / drag.rect.height) * drag.panelHeight,
        0,
        drag.panelHeight - 24,
      );

      setState((current) => ({
        ...current,
        panels: current.panels.map((panel) => {
          if (panel.id !== drag.panelId) return panel;

          return {
            ...panel,
            bubbles: panel.bubbles.map((bubble) => {
              if (bubble.id !== drag.bubbleId) return bubble;
              if (drag.mode === 'move') {
                return {
                  ...bubble,
                  x: clamp(x - drag.offsetX, 0, CANVAS_WIDTH - bubble.width),
                  y: clamp(y - drag.offsetY, 0, panel.height - bubble.height),
                };
              }

              return {
                ...bubble,
                width: clamp(x - bubble.x, 72, CANVAS_WIDTH - bubble.x),
                height: clamp(y - bubble.y, 44, panel.height - bubble.y),
              };
            }),
          };
        }),
      }));
    };

    const handlePointerUp = (): void => {
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
