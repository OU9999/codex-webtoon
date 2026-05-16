import { Plus, Rows3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useStudioContext } from '@/components/studio/studio-context';
import { MIN_CANVAS_HEIGHT } from '@shared/project-state';
import { FieldBlock } from '@/components/studio/_components/field-block';
import { RangeField } from '@/components/studio/_components/range-field';
import { SidebarCollapsibleSection } from '../sidebar-collapsible-section';
import { PanelListItem } from './_components/panel-list-item';

const PanelList = () => {
  const {
    selectedCanvas,
    selectedCanvasPanels,
    selectedPanel,
    handleAddPanel,
    handleCanvasBackgroundColorChange,
    handleCanvasCommonPromptChange,
    handleCanvasHeightChange,
    handlePanelSelect,
  } = useStudioContext();
  const meta = selectedCanvas
    ? `${selectedCanvasPanels.length} cuts · ${selectedCanvas.height}px`
    : 'no canvas';

  return (
    <SidebarCollapsibleSection
      icon={<Rows3 className="size-4" />}
      title="Canvas"
      meta={meta}
      className="min-h-0"
      contentClassName="grid gap-3 p-2"
    >
      <section className="grid gap-3 rounded-[4px] border border-rim-subtle bg-background p-2.5">
        <RangeField
          label="캔버스 높이"
          value={selectedCanvas?.height ?? MIN_CANVAS_HEIGHT}
          suffix="px"
          min={MIN_CANVAS_HEIGHT}
          max={3600}
          step={10}
          onValueChange={handleCanvasHeightChange}
        />
        <FieldBlock label="캔버스 공용 프롬프트" compact>
          <Textarea
            value={selectedCanvas?.commonPrompt ?? ''}
            onChange={handleCanvasCommonPromptChange}
            rows={3}
            className="max-h-32 min-h-18 resize-y bg-elevated font-mono text-[11px] leading-relaxed"
            disabled={!selectedCanvas}
          />
          <p className="text-right font-mono text-[9.5px] text-fg-muted">
            {selectedCanvas?.commonPrompt.length ?? 0} chars
          </p>
        </FieldBlock>
        <section className="grid gap-2">
          <header className="flex items-center justify-between gap-3 font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            <span>Background</span>
            <strong className="text-foreground">
              {selectedCanvas?.backgroundColor ?? '#ffffff'}
            </strong>
          </header>
          <label className="flex items-center gap-2 rounded-[4px] border border-rim bg-elevated px-2 py-1.5 text-[11px] text-fg-muted">
            <input
              type="color"
              aria-label="캔버스 배경색"
              value={selectedCanvas?.backgroundColor ?? '#ffffff'}
              onChange={handleCanvasBackgroundColorChange}
              disabled={!selectedCanvas}
              className="size-7 cursor-pointer rounded-[3px] border border-rim bg-transparent p-0"
            />
            <span>선택 캔버스 색상</span>
          </label>
        </section>
      </section>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddPanel}
        className="h-7 justify-start rounded-[4px] px-2 font-mono text-[10px] font-semibold uppercase"
      >
        <Plus className="size-3.5" />
        Add cut
      </Button>
      <ol className="grid max-h-[min(42vh,360px)] content-start gap-1.5 overflow-y-auto">
        {selectedCanvasPanels.map((panel, index) => (
          <PanelListItem
            key={panel.id}
            panel={panel}
            index={index}
            isActive={panel.id === selectedPanel?.id}
            onSelect={handlePanelSelect}
          />
        ))}
      </ol>
    </SidebarCollapsibleSection>
  );
};

export { PanelList };
