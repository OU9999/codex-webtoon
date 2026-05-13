import { ImageIcon, SquarePen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { MIN_CANVAS_HEIGHT } from '@shared/project-state';
import { FieldBlock } from '../../_components/field-block';
import { RangeField } from '../../_components/range-field';
import { useStudioContext } from '../../studio-context';
import { SidebarCollapsibleSection } from './sidebar-collapsible-section';

const ProjectSection = () => {
  const {
    projectName,
    state,
    handleCanvasHeightChange,
    handleCommonPromptChange,
    handlePanelGapColorChange,
  } = useStudioContext();

  const panelCount = `${state.panels.length} cuts`;
  const firstPanel = state.panels[0] ?? null;
  const firstPanelCandidate =
    firstPanel?.candidates.find(
      (candidate) => candidate.id === firstPanel.selectedCandidateId,
    ) ??
    firstPanel?.candidates[0] ??
    null;

  return (
    <SidebarCollapsibleSection
      icon={<SquarePen className="size-4" />}
      title="Project"
      meta={panelCount}
    >
      <section className="mb-3 flex items-center gap-2.5">
        <span className="flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-rim-strong bg-panel">
          {firstPanelCandidate ? (
            <img
              src={firstPanelCandidate.imageUrl}
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
            {panelCount}
          </span>
        </span>
      </section>
      <FieldBlock label="공용 프롬프트">
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
      <RangeField
        label="웹툰 배경 높이"
        value={state.canvasHeight}
        suffix="px"
        min={MIN_CANVAS_HEIGHT}
        max={3600}
        step={10}
        onValueChange={handleCanvasHeightChange}
      />
      <section className="grid gap-3">
        <header className="flex items-center justify-between gap-3 text-xs font-black text-muted-foreground">
          <span>컷 사이 배경</span>
          <strong className="font-mono text-foreground">
            {state.panelGapColor}
          </strong>
        </header>
        <label className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
          <input
            type="color"
            aria-label="컷 사이 배경색"
            value={state.panelGapColor}
            onChange={handlePanelGapColorChange}
            className="size-8 cursor-pointer rounded-[4px] border border-rim bg-transparent p-0"
          />
          <span>간격 영역 색상</span>
        </label>
      </section>
    </SidebarCollapsibleSection>
  );
};

export { ProjectSection };
