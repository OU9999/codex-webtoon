import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
  labelKey: string;
}

interface TransformResizeHandleProps extends ResizeHandleDefinition {
  bubble: Bubble;
  canvasHeight: number;
  panel: Panel;
  onDragStart: (payload: BubbleDragStartPayload) => void;
}

interface TransformHandlesProps {
  bubble: Bubble;
  canvasHeight: number;
  panel: Panel;
  hasTailTip: boolean;
  onDragStart: (payload: BubbleDragStartPayload) => void;
}

const RESIZE_HANDLES: readonly ResizeHandleDefinition[] = [
  {
    anchor: 'nw',
    className: 'is-nw',
    labelKey: 'bubbles.transform.resizeNorthwest',
  },
  { anchor: 'n', className: 'is-n', labelKey: 'bubbles.transform.resizeNorth' },
  {
    anchor: 'ne',
    className: 'is-ne',
    labelKey: 'bubbles.transform.resizeNortheast',
  },
  { anchor: 'e', className: 'is-e', labelKey: 'bubbles.transform.resizeEast' },
  {
    anchor: 'se',
    className: 'is-se',
    labelKey: 'bubbles.transform.resizeSoutheast',
  },
  { anchor: 's', className: 'is-s', labelKey: 'bubbles.transform.resizeSouth' },
  {
    anchor: 'sw',
    className: 'is-sw',
    labelKey: 'bubbles.transform.resizeSouthwest',
  },
  { anchor: 'w', className: 'is-w', labelKey: 'bubbles.transform.resizeWest' },
];

const TransformResizeHandle = ({
  anchor,
  bubble,
  canvasHeight,
  className,
  labelKey,
  panel,
  onDragStart,
}: TransformResizeHandleProps) => {
  const { t } = useTranslation();

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    onDragStart({
      event,
      bubble,
      panel,
      mode: 'resize',
      resizeAnchor: anchor,
      canvasHeight,
    });
  };

  return (
    <button
      type="button"
      className={cn('transform-handle', className)}
      onPointerDown={handlePointerDown}
    >
      <span className="sr-only">{t(labelKey)}</span>
    </button>
  );
};

const TransformHandles = ({
  bubble,
  canvasHeight,
  panel,
  hasTailTip,
  onDragStart,
}: TransformHandlesProps) => {
  const { t } = useTranslation();

  const handleTailPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    onDragStart({ event, bubble, panel, mode: 'tail', canvasHeight });
  };

  return (
    <aside
      className="transform-controls"
      aria-label={t('bubbles.transform.controls')}
    >
      <span className="transform-box" aria-hidden="true" />
      {RESIZE_HANDLES.map((handle) => (
        <TransformResizeHandle
          key={handle.anchor}
          anchor={handle.anchor}
          bubble={bubble}
          canvasHeight={canvasHeight}
          className={handle.className}
          labelKey={handle.labelKey}
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
          <span className="sr-only">{t('bubbles.transform.tailTip')}</span>
        </button>
      )}
    </aside>
  );
};

export { TransformHandles };
