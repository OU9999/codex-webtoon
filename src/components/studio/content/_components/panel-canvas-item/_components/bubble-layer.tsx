import type { PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { getBubbleClassName } from '@/components/studio/_lib/class-names';
import type {
  Bubble,
  BubbleDragStartPayload,
  Panel,
} from '@/components/studio/_lib/types';

interface BubbleLayerProps {
  bubble: Bubble;
  panel: Panel;
  isSelected: boolean;
  onDragStart: (payload: BubbleDragStartPayload) => void;
}

const BubbleLayer = ({
  bubble,
  panel,
  isSelected,
  onDragStart,
}: BubbleLayerProps) => {
  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    onDragStart({ event, bubble, panel, mode: 'move' });
  };

  const handleResizePointerDown = (
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    onDragStart({ event, bubble, panel, mode: 'resize' });
  };

  return (
    <section
      className={cn(
        'bubble-layer',
        bubble.type,
        getBubbleClassName(panel, bubble),
        isSelected && 'active',
      )}
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
    >
      <span>{bubble.text}</span>
      {isSelected && (
        <i className="resize-handle" onPointerDown={handleResizePointerDown} />
      )}
    </section>
  );
};

export { BubbleLayer };
