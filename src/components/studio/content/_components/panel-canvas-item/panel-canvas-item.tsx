import { ImagePlus } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { getPanelClassName } from '@/components/studio/_lib/class-names';
import type {
  Panel,
  PanelResizeHandle,
  PanelTransformStartPayload,
} from '@/components/studio/_lib/types';

interface PanelResizeHandleControl {
  handle: PanelResizeHandle;
  className: string;
  label: string;
}

interface PanelCanvasItemProps {
  panel: Panel;
  index: number;
  canvasHeight: number;
  isSelected: boolean;
  onTransformStart: (payload: PanelTransformStartPayload) => void;
}

const PANEL_RESIZE_HANDLES: PanelResizeHandleControl[] = [
  { handle: 'nw', className: 'nw', label: 'Resize panel northwest' },
  { handle: 'n', className: 'n', label: 'Resize panel north' },
  { handle: 'ne', className: 'ne', label: 'Resize panel northeast' },
  { handle: 'e', className: 'e', label: 'Resize panel east' },
  { handle: 'se', className: 'se', label: 'Resize panel southeast' },
  { handle: 's', className: 's', label: 'Resize panel south' },
  { handle: 'sw', className: 'sw', label: 'Resize panel southwest' },
  { handle: 'w', className: 'w', label: 'Resize panel west' },
];

const PanelCanvasItem = ({
  panel,
  index,
  canvasHeight,
  isSelected,
  onTransformStart,
}: PanelCanvasItemProps) => {
  const selectedCandidate = panel.candidates.find(
    (item) => item.id === panel.selectedCandidateId,
  );

  const handleMovePointerDown = (
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    onTransformStart({ event, panel, mode: 'move', canvasHeight });
  };

  const handleResizePointerDown = (
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    const resizeHandle = event.currentTarget.dataset
      .resizeHandle as PanelResizeHandle;

    onTransformStart({
      event,
      panel,
      mode: 'resize',
      resizeHandle,
      canvasHeight,
    });
  };

  return (
    <article
      className={cn(
        'panel-frame',
        getPanelClassName(panel),
        isSelected && 'selected',
      )}
      onPointerDown={handleMovePointerDown}
    >
      <figure className="panel-visual">
        {selectedCandidate ? (
          <img
            src={selectedCandidate.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <p className="empty-panel">
            <ImagePlus className="size-9" />
            <span>빈 패널</span>
          </p>
        )}
      </figure>
      <span className="panel-number">{index + 1}</span>
      {isSelected && (
        <>
          <span className="selected-rim" />
          <span className="panel-selection-toolbar">
            {panel.width} × {panel.height}
          </span>
          {PANEL_RESIZE_HANDLES.map((control) => (
            <button
              key={control.handle}
              type="button"
              aria-label={control.label}
              className={cn('panel-resize-handle', control.className)}
              data-resize-handle={control.handle}
              onPointerDown={handleResizePointerDown}
            />
          ))}
        </>
      )}
    </article>
  );
};

export { PanelCanvasItem };
