import { ImageIcon, Plus, SquarePen } from 'lucide-react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getCanvasPanels } from '../../_lib/canvas-state';
import { FieldBlock } from '../../_components/field-block';
import { useStudioContext } from '../../studio-context';
import { SidebarCollapsibleSection } from './sidebar-collapsible-section';

const ProjectSection = () => {
  const {
    projectName,
    selectedCanvas,
    state,
    handleAddCanvas,
    handleCanvasSelect,
    handleCommonPromptChange,
  } = useStudioContext();

  const projectMeta = `${state.canvases.length} canvases · ${state.panels.length} cuts`;
  const firstCanvas = state.canvases[0] ?? null;
  const firstCanvasPanels = firstCanvas
    ? getCanvasPanels(state, firstCanvas.id)
    : [];
  const firstCanvasPanelWithImage =
    firstCanvasPanels.find((panel) => panel.candidates.length > 0) ?? null;
  const projectThumbnailCandidate =
    firstCanvasPanelWithImage?.candidates[0] ?? null;

  const handleCanvasButtonClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ): void => {
    const canvasId = event.currentTarget.dataset.canvasId;
    if (!canvasId) return;

    handleCanvasSelect(canvasId);
  };

  return (
    <SidebarCollapsibleSection
      icon={<SquarePen className="size-4" />}
      title="Project"
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
      <FieldBlock label="프로젝트 공용 프롬프트">
        <Textarea
          value={state.commonPrompt}
          onChange={handleCommonPromptChange}
          rows={5}
          className="max-h-40 min-h-24 resize-y bg-background font-mono text-[11px] leading-relaxed"
        />
        <p className="text-right font-mono text-[9.5px] text-fg-muted">
          {state.commonPrompt.length} chars
        </p>
      </FieldBlock>
      <section className="mb-3 grid gap-2">
        <header className="flex items-center justify-between gap-3">
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            Canvases
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCanvas}
            className="h-7 rounded-[4px] px-2 font-mono text-[10px] font-semibold uppercase"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </header>
        <nav className="grid gap-1.5" aria-label="Project canvases">
          {state.canvases.map((canvas, index) => {
            const isSelected = canvas.id === selectedCanvas?.id;
            const canvasPanels = getCanvasPanels(state, canvas.id);

            return (
              <button
                key={canvas.id}
                type="button"
                data-canvas-id={canvas.id}
                className={cn(
                  'grid grid-cols-[24px_minmax(0,1fr)] items-center gap-2 rounded-[4px] border border-rim bg-background px-2.5 py-2 text-left transition-colors hover:bg-hover',
                  isSelected &&
                    'border-brand bg-brand-soft shadow-[inset_3px_0_0_var(--brand)] ring-1 ring-brand/35 hover:bg-brand-soft',
                )}
                onClick={handleCanvasButtonClick}
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
                    {canvasPanels.length} cuts / {canvas.height}px
                  </small>
                </span>
              </button>
            );
          })}
        </nav>
      </section>
    </SidebarCollapsibleSection>
  );
};

export { ProjectSection };
