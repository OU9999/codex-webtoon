import type { PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/utils';
import type {
  Bubble,
  BubbleDragStartPayload,
  BubbleResizeAnchor,
  Panel,
} from '@/components/studio/_lib/types';

interface ResizeHandleDefinition {
  anchor: BubbleResizeAnchor;
  className: string;
  label: string;
}

interface TransformResizeHandleProps extends ResizeHandleDefinition {
  bubble: Bubble;
  panel: Panel;
  onDragStart: (payload: BubbleDragStartPayload) => void;
}

interface TransformHandlesProps {
  bubble: Bubble;
  panel: Panel;
  hasTailTip: boolean;
  onDragStart: (payload: BubbleDragStartPayload) => void;
}

const RESIZE_HANDLES: readonly ResizeHandleDefinition[] = [
  { anchor: 'nw', className: 'is-nw', label: '왼쪽 위 크기 조절' },
  { anchor: 'n', className: 'is-n', label: '위쪽 크기 조절' },
  { anchor: 'ne', className: 'is-ne', label: '오른쪽 위 크기 조절' },
  { anchor: 'e', className: 'is-e', label: '오른쪽 크기 조절' },
  { anchor: 'se', className: 'is-se', label: '오른쪽 아래 크기 조절' },
  { anchor: 's', className: 'is-s', label: '아래쪽 크기 조절' },
  { anchor: 'sw', className: 'is-sw', label: '왼쪽 아래 크기 조절' },
  { anchor: 'w', className: 'is-w', label: '왼쪽 크기 조절' },
];

const TransformResizeHandle = ({
  anchor,
  bubble,
  className,
  label,
  panel,
  onDragStart,
}: TransformResizeHandleProps) => {
  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    onDragStart({ event, bubble, panel, mode: 'resize', resizeAnchor: anchor });
  };

  return (
    <button
      type="button"
      className={cn('transform-handle', className)}
      onPointerDown={handlePointerDown}
    >
      <span className="sr-only">{label}</span>
    </button>
  );
};

const TransformHandles = ({
  bubble,
  panel,
  hasTailTip,
  onDragStart,
}: TransformHandlesProps) => {
  const handleTailPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    onDragStart({ event, bubble, panel, mode: 'tail' });
  };

  return (
    <aside className="transform-controls" aria-label="말풍선 변형 핸들">
      <span className="transform-box" aria-hidden="true" />
      {RESIZE_HANDLES.map((handle) => (
        <TransformResizeHandle
          key={handle.anchor}
          anchor={handle.anchor}
          bubble={bubble}
          className={handle.className}
          label={handle.label}
          panel={panel}
          onDragStart={onDragStart}
        />
      ))}
      {hasTailTip && (
        <button
          type="button"
          className="tail-tip-handle"
          onPointerDown={handleTailPointerDown}
        >
          <span className="sr-only">말풍선 꼬리 끝점 조절</span>
        </button>
      )}
    </aside>
  );
};

export { TransformHandles };
