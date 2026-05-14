import { Palette } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { MIN_CANVAS_HEIGHT } from '@shared/project-state';
import { FieldBlock } from '../../_components/field-block';
import { RangeField } from '../../_components/range-field';
import { useStudioContext } from '../../studio-context';
import { SidebarCollapsibleSection } from './sidebar-collapsible-section';

const CanvasSection = () => {
  const {
    selectedCanvas,
    selectedCanvasPanels,
    handleCanvasBackgroundColorChange,
    handleCanvasCommonPromptChange,
    handleCanvasHeightChange,
  } = useStudioContext();

  const meta = selectedCanvas
    ? `${selectedCanvasPanels.length} cuts · ${selectedCanvas.height}px`
    : 'no canvas';

  return (
    <SidebarCollapsibleSection
      icon={<Palette className="size-4" />}
      title="Canvas"
      meta={meta}
    >
      <RangeField
        label="캔버스 높이"
        value={selectedCanvas?.height ?? MIN_CANVAS_HEIGHT}
        suffix="px"
        min={MIN_CANVAS_HEIGHT}
        max={3600}
        step={10}
        onValueChange={handleCanvasHeightChange}
      />
      <FieldBlock label="캔버스 공용 프롬프트">
        <Textarea
          value={selectedCanvas?.commonPrompt ?? ''}
          onChange={handleCanvasCommonPromptChange}
          rows={4}
          className="max-h-36 min-h-20 resize-y bg-background font-mono text-[11px] leading-relaxed"
          disabled={!selectedCanvas}
        />
        <p className="text-right font-mono text-[9.5px] text-fg-muted">
          {selectedCanvas?.commonPrompt.length ?? 0} chars
        </p>
      </FieldBlock>
      <section className="grid gap-3">
        <header className="flex items-center justify-between gap-3 text-xs font-black text-muted-foreground">
          <span>캔버스 배경</span>
          <strong className="font-mono text-foreground">
            {selectedCanvas?.backgroundColor ?? '#ffffff'}
          </strong>
        </header>
        <label className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
          <input
            type="color"
            aria-label="캔버스 배경색"
            value={selectedCanvas?.backgroundColor ?? '#ffffff'}
            onChange={handleCanvasBackgroundColorChange}
            disabled={!selectedCanvas}
            className="size-8 cursor-pointer rounded-[4px] border border-rim bg-transparent p-0"
          />
          <span>선택 캔버스 색상</span>
        </label>
      </section>
    </SidebarCollapsibleSection>
  );
};

export { CanvasSection };
