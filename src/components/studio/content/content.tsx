import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStripGapClassName } from '../_lib/class-names';
import { useStudioContext } from '../studio-context';
import { PanelCanvasItem } from './_components/panel-canvas-item/panel-canvas-item';

const Content = () => {
  const { state, selectedPanel, handleBubbleDragStart, handlePanelSelect } =
    useStudioContext();

  return (
    <section
      className="min-w-0 overflow-auto px-3 py-4 md:px-7 md:py-5"
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
          720px
        </Badge>
      </header>

      <section
        className={cn(
          'mx-auto flex w-full max-w-[720px] flex-col',
          getStripGapClassName(state.panelGap),
        )}
        aria-label="Panel strip"
      >
        {state.panels.map((panel, index) => (
          <PanelCanvasItem
            key={panel.id}
            panel={panel}
            index={index}
            isSelected={panel.id === selectedPanel?.id}
            selectedBubbleId={state.selectedBubbleId}
            onBubbleDragStart={handleBubbleDragStart}
            onSelect={handlePanelSelect}
          />
        ))}
      </section>
    </section>
  );
};

export { Content };
