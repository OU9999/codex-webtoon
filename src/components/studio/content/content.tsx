import { GripHorizontal, GripVertical } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCanvasPanels } from '../_lib/canvas-state';
import {
  getCanvasConnectorClassName,
  getCanvasStageClassName,
  getStageClassName,
} from '../_lib/class-names';
import { useStudioContext } from '../studio-context';
import { BubbleLayer } from './_components/panel-canvas-item/_components/bubble-layer';
import { PanelCanvasItem } from './_components/panel-canvas-item/panel-canvas-item';

const Content = () => {
  const { t } = useTranslation();
  const {
    editingBubbleId,
    generatingPanelId,
    state,
    selectedCanvas,
    selectedBubbleIds,
    selectedPanel,
    selectedPanelIds,
    handleBubbleDragStart,
    handleBubbleTextEditEnd,
    handleBubbleTextEditStart,
    handleBubbleTextValueChange,
    handleCanvasResizeStart,
    handleCanvasSelect,
    handlePanelTransformStart,
    handleSelectionClear,
  } = useStudioContext();

  const handleWorkspacePointerDown = (
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    if (event.target instanceof Element) {
      if (event.target.closest('.webtoon-stage')) return;
    }

    handleSelectionClear();
  };

  const handleCanvasResizePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    const canvasId = event.currentTarget.dataset.canvasId;
    const rawHeight = event.currentTarget.dataset.canvasHeight;
    const canvasHeight = rawHeight ? Number(rawHeight) : NaN;
    if (!canvasId) return;
    if (!Number.isFinite(canvasHeight)) return;

    handleCanvasResizeStart({ event, canvasId, canvasHeight });
  };

  const handleCanvasPointerDown = (
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    const canvasId = event.currentTarget.dataset.canvasId;
    if (!canvasId) return;

    handleCanvasSelect(canvasId);
    if (event.target instanceof Element) {
      if (event.target.closest('.panel-frame, .bubble-layer')) return;
    }

    handleSelectionClear();
  };

  return (
    <section
      className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-canvas bg-[radial-gradient(circle,rgb(26_31_48/0.07)_1px,transparent_1px)] bg-[length:24px_24px] px-3 pt-4 pb-12 md:px-7 md:pt-5 md:pb-14"
      data-canvas-scroll-container
      aria-label={t('content.webtoonCanvas')}
      onPointerDown={handleWorkspacePointerDown}
    >
      <header className="mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-4 text-xs text-muted-foreground">
        <h2>
          <span>{t('content.projectCanvases')}</span>
          <strong className="mt-0.5 block text-xl text-foreground">
            {t('content.projectMeta', {
              canvasCount: state.canvases.length,
              panelCount: state.panels.length,
            })}
          </strong>
        </h2>
        <Badge variant="outline" className="h-8 rounded-full px-3">
          <GripVertical className="size-4" />
          {selectedCanvas ? `720×${selectedCanvas.height}px` : '720px'}
        </Badge>
      </header>

      <section
        className="grid justify-items-center"
        aria-label={t('content.canvasStack')}
      >
        {state.canvases.map((canvas, canvasIndex) => {
          const canvasPanels = getCanvasPanels(state, canvas.id);
          const isSelectedCanvas = canvas.id === selectedCanvas?.id;

          return (
            <article key={canvas.id} className="w-full">
              {canvasIndex > 0 && (
                <div
                  className={cn(
                    'mx-auto h-14 w-full',
                    getCanvasConnectorClassName(),
                    getCanvasConnectorClassName(canvasIndex),
                  )}
                  aria-hidden="true"
                />
              )}
              <section
                className={cn(
                  'webtoon-stage mx-auto w-full max-w-[720px]',
                  !isSelectedCanvas &&
                    canvasIndex > 0 &&
                    'border-t-transparent',
                  !isSelectedCanvas &&
                    canvasIndex < state.canvases.length - 1 &&
                    'border-b-transparent',
                  getStageClassName(),
                  getCanvasStageClassName(canvas),
                  isSelectedCanvas && 'border-brand ring-2 ring-brand',
                )}
                aria-label={t('content.stageLabel', { title: canvas.title })}
                data-canvas-id={canvas.id}
                onPointerDown={handleCanvasPointerDown}
              >
                {canvasPanels.length === 0 && (
                  <p className="absolute inset-0 grid place-items-center font-mono text-[10.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
                    {t('content.noPanels')}
                  </p>
                )}
                {canvasPanels.map((panel, index) => (
                  <PanelCanvasItem
                    key={panel.id}
                    panel={panel}
                    index={index}
                    canvasHeight={canvas.height}
                    isGenerating={panel.id === generatingPanelId}
                    isPrimarySelected={panel.id === selectedPanel?.id}
                    isSelected={selectedPanelIds.includes(panel.id)}
                    onTransformStart={handlePanelTransformStart}
                  />
                ))}
                {canvasPanels.map((panel) =>
                  panel.bubbles.map((bubble) => (
                    <BubbleLayer
                      key={bubble.id}
                      bubble={bubble}
                      canvasHeight={canvas.height}
                      panel={panel}
                      isEditing={
                        bubble.id === editingBubbleId &&
                        bubble.id === state.selectedBubbleId
                      }
                      isPrimarySelected={bubble.id === state.selectedBubbleId}
                      isSelected={selectedBubbleIds.includes(bubble.id)}
                      onDragStart={handleBubbleDragStart}
                      onEditEnd={handleBubbleTextEditEnd}
                      onEditStart={handleBubbleTextEditStart}
                      onTextChange={handleBubbleTextValueChange}
                    />
                  )),
                )}
                {isSelectedCanvas && (
                  <button
                    type="button"
                    className="canvas-resize-handle"
                    aria-label={t('content.canvasResizeLabel', {
                      title: canvas.title,
                      height: canvas.height,
                    })}
                    data-canvas-id={canvas.id}
                    data-canvas-height={canvas.height}
                    onPointerDown={handleCanvasResizePointerDown}
                  >
                    <GripHorizontal className="size-4" aria-hidden="true" />
                    <span>{canvas.height}px</span>
                  </button>
                )}
              </section>
            </article>
          );
        })}
      </section>
    </section>
  );
};

export { Content };
