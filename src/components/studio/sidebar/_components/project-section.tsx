import { GripVertical, ImageIcon, Plus, SquarePen, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCanvasPanels } from '../../_lib/canvas-state';
import type { SidebarDropPosition, WebtoonCanvas } from '../../_lib/types';
import { FieldBlock } from '../../_components/field-block';
import { PromptTextarea } from '../../_components/prompt-textarea';
import { useStudioContext } from '../../studio-context';
import { SidebarCollapsibleSection } from './sidebar-collapsible-section';

interface CanvasDragTarget {
  canvasId: string;
  position: SidebarDropPosition;
}

interface CanvasPointerDrag {
  sourceCanvasId: string;
  pointerId: number;
  startX: number;
  startY: number;
  hasMoved: boolean;
}

interface CanvasListItemProps {
  canvas: WebtoonCanvas;
  index: number;
  panelCount: number;
  isSelected: boolean;
  isDragging: boolean;
  canReorder: boolean;
  canDelete: boolean;
  dropPosition: SidebarDropPosition | null;
  onSelect: (canvasId: string) => void;
  onDelete: (canvasId: string) => void;
  onPointerDown: (
    event: ReactPointerEvent<HTMLLIElement>,
    canvasId: string,
  ) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLLIElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLLIElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLLIElement>) => void;
}

const getCanvasDropPosition = (
  element: HTMLElement,
  clientY: number,
): SidebarDropPosition => {
  const rect = element.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;

  return clientY >= midpoint ? 'after' : 'before';
};

const getCanvasDropTarget = (
  event: ReactPointerEvent<HTMLElement>,
  sourceCanvasId: string,
): CanvasDragTarget | null => {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const item = element?.closest<HTMLElement>('[data-sidebar-canvas-id]');
  const canvasId = item?.dataset.sidebarCanvasId;
  if (!item || !canvasId) return null;
  if (canvasId === sourceCanvasId) return null;

  return {
    canvasId,
    position: getCanvasDropPosition(item, event.clientY),
  };
};

const hasCanvasPointerMoved = (
  drag: CanvasPointerDrag,
  event: ReactPointerEvent<HTMLElement>,
): boolean => {
  return (
    Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4
  );
};

const CanvasListItem = ({
  canvas,
  index,
  panelCount,
  isSelected,
  isDragging,
  canReorder,
  canDelete,
  dropPosition,
  onSelect,
  onDelete,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CanvasListItemProps) => {
  const { t } = useTranslation();
  const deleteTitle = canDelete
    ? t('sidebar.project.deleteCanvas', { title: canvas.title })
    : t('sidebar.project.deleteLastCanvasDisabled');
  const dragTitle = t('sidebar.project.dragCanvas', { title: canvas.title });

  const handleSelect = (): void => {
    onSelect(canvas.id);
  };

  const handleDelete = (): void => {
    onDelete(canvas.id);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLLIElement>): void => {
    onPointerDown(event, canvas.id);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLLIElement>): void => {
    onPointerMove(event);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLLIElement>): void => {
    onPointerUp(event);
  };

  const handlePointerCancel = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    onPointerCancel(event);
  };

  return (
    <li
      className={cn(
        'relative grid grid-cols-[16px_minmax(0,1fr)_28px] items-center gap-1.5 rounded-[4px] border border-rim bg-background p-1.5 transition-colors',
        isSelected &&
          'border-brand bg-brand-soft ring-1 ring-brand/35 hover:bg-brand-soft',
        isDragging &&
          'scale-[0.99] border-dashed border-brand bg-brand-soft/70 opacity-70',
        dropPosition && 'border-brand bg-brand-soft ring-1 ring-brand/45',
      )}
      data-sidebar-canvas-id={canvas.id}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {dropPosition && (
        <span
          className={cn(
            'pointer-events-none absolute right-1 left-1 z-10 h-[3px] rounded-full bg-brand shadow-[0_0_0_3px_var(--brand-soft)]',
            dropPosition === 'before' ? '-top-1.5' : '-bottom-1.5',
          )}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          'grid size-4 cursor-grab touch-none place-items-center text-fg-faint active:cursor-grabbing',
          !canReorder && 'cursor-default opacity-45',
        )}
        title={dragTitle}
        aria-hidden="true"
      >
        <GripVertical className="size-3.5" />
      </span>
      <button
        type="button"
        className={cn(
          'grid min-w-0 touch-none grid-cols-[24px_minmax(0,1fr)] items-center gap-2 rounded-[3px] px-1 py-0.5 text-left transition-colors hover:bg-hover',
          isSelected && 'hover:bg-brand-soft',
        )}
        onClick={handleSelect}
        aria-current={isSelected ? 'true' : undefined}
      >
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-[3px] font-mono text-[10px] font-black text-fg-muted',
            isSelected && 'bg-brand text-on-brand',
          )}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0">
          <strong
            className={cn(
              'block truncate text-[12px] font-black text-foreground',
              isSelected && 'text-brand',
            )}
          >
            {canvas.title}
          </strong>
          <small className="block truncate font-mono text-[9.5px] font-semibold text-fg-muted">
            {t('sidebar.project.panelMeta', {
              count: panelCount,
              height: canvas.height,
            })}
          </small>
        </span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-[4px] text-fg-muted hover:text-status-red"
        onClick={handleDelete}
        disabled={!canDelete}
        data-canvas-delete-button
        aria-label={deleteTitle}
        title={deleteTitle}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
};

const ProjectSection = () => {
  const { t } = useTranslation();
  const suppressCanvasClickRef = useRef(false);
  const canvasPointerDragRef = useRef<CanvasPointerDrag | null>(null);
  const [canvasPointerDrag, setCanvasPointerDrag] =
    useState<CanvasPointerDrag | null>(null);
  const [canvasDragTarget, setCanvasDragTarget] =
    useState<CanvasDragTarget | null>(null);
  const {
    projectName,
    selectedCanvas,
    state,
    handleAddCanvas,
    handleCanvasMove,
    handleCanvasSelect,
    handleCommonPromptChange,
    handleDeleteCanvas,
  } = useStudioContext();

  const projectMeta = t('sidebar.project.meta', {
    canvasCount: state.canvases.length,
    panelCount: state.panels.length,
  });
  const firstCanvas = state.canvases[0] ?? null;
  const firstCanvasPanels = firstCanvas
    ? getCanvasPanels(state, firstCanvas.id)
    : [];
  const firstCanvasPanelWithImage =
    firstCanvasPanels.find((panel) => panel.candidates.length > 0) ?? null;
  const projectThumbnailCandidate =
    firstCanvasPanelWithImage?.candidates[0] ?? null;
  const canReorderCanvas = state.canvases.length > 1;
  const canDeleteCanvas = state.canvases.length > 1;

  const handleCanvasSelectRequest = (canvasId: string): void => {
    if (suppressCanvasClickRef.current) return;

    handleCanvasSelect(canvasId);
  };

  const handleCanvasPointerDown = (
    event: ReactPointerEvent<HTMLLIElement>,
    canvasId: string,
  ): void => {
    if (event.button !== 0) return;
    if (!canReorderCanvas) {
      return;
    }
    if (event.target instanceof Element) {
      if (event.target.closest('[data-canvas-delete-button]')) return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    canvasPointerDragRef.current = {
      sourceCanvasId: canvasId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
    };
    setCanvasPointerDrag(null);
    setCanvasDragTarget(null);
  };

  const handleCanvasPointerMove = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    const drag = canvasPointerDragRef.current;
    if (!drag) return;
    if (drag.pointerId !== event.pointerId) return;

    const hasMoved = drag.hasMoved || hasCanvasPointerMoved(drag, event);
    if (!hasMoved) return;

    event.preventDefault();
    if (!drag.hasMoved) {
      const nextDrag = { ...drag, hasMoved: true };
      canvasPointerDragRef.current = nextDrag;
      setCanvasPointerDrag(nextDrag);
    }

    const target = getCanvasDropTarget(event, drag.sourceCanvasId);
    if (!target) {
      setCanvasDragTarget(null);
      return;
    }

    setCanvasDragTarget((current) => {
      if (
        current?.canvasId === target.canvasId &&
        current.position === target.position
      ) {
        return current;
      }

      return target;
    });
  };

  const finishCanvasPointerDrag = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    const drag = canvasPointerDragRef.current;
    if (!drag) return;
    if (drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const hasMoved = drag.hasMoved || hasCanvasPointerMoved(drag, event);
    const target =
      canvasDragTarget ?? getCanvasDropTarget(event, drag.sourceCanvasId);

    canvasPointerDragRef.current = null;
    setCanvasPointerDrag(null);
    setCanvasDragTarget(null);
    if (!hasMoved) {
      handleCanvasSelect(drag.sourceCanvasId);
      return;
    }

    suppressCanvasClickRef.current = true;
    window.setTimeout(() => {
      suppressCanvasClickRef.current = false;
    }, 0);
    if (!target) return;

    handleCanvasMove(drag.sourceCanvasId, target.canvasId, target.position);
  };

  const handleCanvasPointerCancel = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    canvasPointerDragRef.current = null;
    setCanvasPointerDrag(null);
    setCanvasDragTarget(null);
  };

  return (
    <SidebarCollapsibleSection
      icon={<SquarePen className="size-4" />}
      title={t('sidebar.project.title')}
      meta={projectMeta}
    >
      <section className="mb-3 flex items-center gap-2.5">
        <span className="flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-rim-strong bg-panel">
          {projectThumbnailCandidate ? (
            <img
              src={projectThumbnailCandidate.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="size-3.5 text-fg-faint" />
          )}
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-[13px] font-black text-foreground">
            {projectName}
          </strong>
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            {projectMeta}
          </span>
        </span>
      </section>
      <FieldBlock label={t('sidebar.project.commonPrompt')}>
        <PromptTextarea
          value={state.commonPrompt}
          onChange={handleCommonPromptChange}
          rows={5}
          className="max-h-40 min-h-24"
        />
        <p className="text-right font-mono text-[9.5px] text-fg-muted">
          {t('common.charCount', { count: state.commonPrompt.length })}
        </p>
      </FieldBlock>
      <section className="mb-3 grid gap-2">
        <header className="flex items-center justify-between gap-3">
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            {t('sidebar.project.canvases')}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCanvas}
            className="h-7 rounded-[4px] px-2 font-mono text-[10px] font-semibold uppercase"
          >
            <Plus className="size-3.5" />
            {t('sidebar.project.addCanvas')}
          </Button>
        </header>
        <nav aria-label={t('sidebar.project.navLabel')}>
          <ol className="grid gap-1.5">
            {state.canvases.map((canvas, index) => {
              const isSelected = canvas.id === selectedCanvas?.id;
              const canvasPanels = getCanvasPanels(state, canvas.id);
              const dropPosition =
                canvasDragTarget?.canvasId === canvas.id
                  ? canvasDragTarget.position
                  : null;

              return (
                <CanvasListItem
                  key={canvas.id}
                  canvas={canvas}
                  index={index}
                  panelCount={canvasPanels.length}
                  isSelected={isSelected}
                  isDragging={
                    canvas.id === canvasPointerDrag?.sourceCanvasId &&
                    canvasPointerDrag.hasMoved
                  }
                  canReorder={canReorderCanvas}
                  canDelete={canDeleteCanvas}
                  dropPosition={dropPosition}
                  onSelect={handleCanvasSelectRequest}
                  onDelete={handleDeleteCanvas}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={finishCanvasPointerDrag}
                  onPointerCancel={handleCanvasPointerCancel}
                />
              );
            })}
          </ol>
        </nav>
      </section>
    </SidebarCollapsibleSection>
  );
};

export { ProjectSection };
