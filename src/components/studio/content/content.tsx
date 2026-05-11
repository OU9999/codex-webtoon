import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStageClassName } from '../_lib/class-names';
import { useStudioContext } from '../studio-context';
import { PanelCanvasItem } from './_components/panel-canvas-item/panel-canvas-item';

const Content = () => {
  const {
    state,
    selectedPanel,
    handleBubbleDragStart,
    handlePanelTransformStart,
  } = useStudioContext();

  return (
    <section
      className="min-h-0 min-w-0 overflow-y-auto overscroll-contain px-3 py-4 md:px-7 md:py-5"
      aria-label="Webtoon canvas"
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
            selectedBubbleId={state.selectedBubbleId}
            onBubbleDragStart={handleBubbleDragStart}
            onTransformStart={handlePanelTransformStart}
          />
        ))}
      </section>
    </section>
  );
};

export { Content };
