import { SquarePen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { FieldBlock } from '../../_components/field-block';
import { RangeField } from '../../_components/range-field';
import { SectionTitle } from '../../_components/section-title';
import { useStudioContext } from '../../studio-context';
import { PanelActions } from './panel-actions';

const ProjectSection = () => {
  const {
    state,
    handleCommonPromptChange,
    handlePanelGapChange,
    handlePanelGapColorChange,
  } = useStudioContext();

  return (
    <>
      <SectionTitle icon={<SquarePen className="size-4" />} title="Project" />
      <FieldBlock label="공용 프롬프트">
        <Textarea
          value={state.commonPrompt}
          onChange={handleCommonPromptChange}
          rows={5}
          className="resize-y bg-background leading-relaxed"
        />
      </FieldBlock>
      <PanelActions />
      <RangeField
        label="컷 사이 여백"
        value={state.panelGap}
        suffix="px"
        min={0}
        max={96}
        onValueChange={handlePanelGapChange}
      />
      <section className="mb-4 grid gap-3">
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
    </>
  );
};

export { ProjectSection };
