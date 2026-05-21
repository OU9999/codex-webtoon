import { ImagePlus, Loader2 } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
  labelKey: string;
}

interface PanelCanvasItemProps {
  panel: Panel;
  index: number;
  canvasHeight: number;
  isGenerating: boolean;
  isSelected: boolean;
  onTransformStart: (payload: PanelTransformStartPayload) => void;
}

const PANEL_RESIZE_HANDLES: PanelResizeHandleControl[] = [
  { handle: 'nw', className: 'nw', labelKey: 'panelCanvas.resizeNorthwest' },
  { handle: 'n', className: 'n', labelKey: 'panelCanvas.resizeNorth' },
  { handle: 'ne', className: 'ne', labelKey: 'panelCanvas.resizeNortheast' },
  { handle: 'e', className: 'e', labelKey: 'panelCanvas.resizeEast' },
  { handle: 'se', className: 'se', labelKey: 'panelCanvas.resizeSoutheast' },
  { handle: 's', className: 's', labelKey: 'panelCanvas.resizeSouth' },
  { handle: 'sw', className: 'sw', labelKey: 'panelCanvas.resizeSouthwest' },
  { handle: 'w', className: 'w', labelKey: 'panelCanvas.resizeWest' },
];

const PanelCanvasItem = ({
  panel,
  index,
  canvasHeight,
  isGenerating,
  isSelected,
  onTransformStart,
}: PanelCanvasItemProps) => {
  const { t } = useTranslation();
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
      data-panel-id={panel.id}
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
            <span>{t('panelCanvas.empty')}</span>
          </p>
        )}
        {isGenerating && (
          <figcaption
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-0 z-20 grid place-items-center overflow-hidden bg-[rgb(26_31_48/0.35)] text-white backdrop-blur-[1px]"
          >
            <span className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,transparent_0%,rgb(255_255_255/0.28)_42%,rgb(255_255_255/0.42)_50%,rgb(255_255_255/0.28)_58%,transparent_100%)]" />
            <span className="relative z-10 flex items-center gap-2 rounded-[4px] border border-white/35 bg-[rgb(26_31_48/0.7)] px-3 py-2 font-mono text-[10px] font-black tracking-[0.08em] uppercase shadow-sm">
              <Loader2 className="size-3.5 animate-spin" />
              {t('panelCanvas.generating')}
            </span>
          </figcaption>
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
              aria-label={t(control.labelKey)}
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
