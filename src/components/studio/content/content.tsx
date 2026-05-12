import { GripHorizontal, GripVertical } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStageClassName } from '../_lib/class-names';
import { useStudioContext } from '../studio-context';
import { BubbleLayer } from './_components/panel-canvas-item/_components/bubble-layer';
import { PanelCanvasItem } from './_components/panel-canvas-item/panel-canvas-item';

const Content = () => {
  const {
    editingBubbleId,
    state,
    selectedPanel,
    handleBubbleDragStart,
    handleBubbleTextEditEnd,
    handleBubbleTextEditStart,
    handleBubbleTextValueChange,
    handleCanvasResizeStart,
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
    handleCanvasResizeStart({ event, canvasHeight: state.canvasHeight });
  };

  return (
    <section
      className="min-h-0 min-w-0 overflow-y-auto overscroll-contain px-3 pt-4 pb-12 md:px-7 md:pt-5 md:pb-14"
      aria-label="Webtoon canvas"
      onPointerDown={handleWorkspacePointerDown}
    >
      <header className="mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-4 text-xs text-muted-foreground">
        <h2>
          <span>Episode canvas</span>
          <strong className="mt-0.5 block text-xl text-foreground">
            {state.panels.length} panels
          </strong>
        </h2>
        <Badge variant="outline" className="h-8 rounded-full px-3">
          <GripVertical className="size-4" />
          720×{state.canvasHeight}px
        </Badge>
      </header>

      <section
        className={cn(
          'webtoon-stage mx-auto w-full max-w-[720px]',
          getStageClassName(),
        )}
        aria-label="Panel stage"
      >
        {state.panels.map((panel, index) => (
          <PanelCanvasItem
            key={panel.id}
            panel={panel}
            index={index}
            canvasHeight={state.canvasHeight}
            isSelected={panel.id === selectedPanel?.id}
            onTransformStart={handlePanelTransformStart}
          />
        ))}
        {state.panels.map((panel) =>
          panel.bubbles.map((bubble) => (
            <BubbleLayer
              key={bubble.id}
              bubble={bubble}
              canvasHeight={state.canvasHeight}
              panel={panel}
              isEditing={
                bubble.id === editingBubbleId &&
                bubble.id === state.selectedBubbleId
              }
              isSelected={bubble.id === state.selectedBubbleId}
              onDragStart={handleBubbleDragStart}
              onEditEnd={handleBubbleTextEditEnd}
              onEditStart={handleBubbleTextEditStart}
              onTextChange={handleBubbleTextValueChange}
            />
          )),
        )}
        <button
          type="button"
          className="canvas-resize-handle"
          aria-label={`Resize canvas height (${state.canvasHeight}px)`}
          onPointerDown={handleCanvasResizePointerDown}
        >
          <GripHorizontal className="size-4" aria-hidden="true" />
          <span>{state.canvasHeight}px</span>
        </button>
      </section>
    </section>
  );
};

export { Content };
