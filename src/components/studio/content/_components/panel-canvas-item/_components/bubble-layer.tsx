import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { getBubbleClassName } from '@/components/studio/_lib/class-names';
import {
  getBubbleOutlineSvgPath,
  getBubbleTailPoints,
  resolveBubbleStyle,
} from '@/components/studio/_lib/bubble-style';
import type {
  Bubble,
  BubbleDragStartPayload,
  Panel,
} from '@/components/studio/_lib/types';
import { TransformHandles } from './transform-handles';

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
  const style = resolveBubbleStyle(bubble);
  const outlinePath = getBubbleOutlineSvgPath(bubble);
  const tailPoints = getBubbleTailPoints(bubble);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    onDragStart({ event, bubble, panel, mode: 'move' });
  };

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  return (
    <section
      className={cn(
        'bubble-layer',
        bubble.type,
        `shape-${style.shape}`,
        `tail-${style.tailSide}`,
        getBubbleClassName(panel, bubble),
        isSelected && 'active',
      )}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {outlinePath && (
        <svg
          className="bubble-outline-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="bubble-outline-shape" d={outlinePath.path} />
        </svg>
      )}
      <span>{bubble.text}</span>
      {isSelected && (
        <TransformHandles
          bubble={bubble}
          panel={panel}
          hasTailTip={Boolean(tailPoints)}
          onDragStart={onDragStart}
        />
      )}
    </section>
  );
};

export { BubbleLayer };
