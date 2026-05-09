import { SquarePen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { FieldBlock } from '../../_components/field-block';
import { RangeField } from '../../_components/range-field';
import { SectionTitle } from '../../_components/section-title';
import { useStudioContext } from '../../studio-context';
import { PanelActions } from './panel-actions';

const ProjectSection = () => {
  const { state, handleCommonPromptChange, handlePanelGapChange } =
    useStudioContext();

  return (
    <>
      <SectionTitle icon={<SquarePen className="size-4" />} title="Project" />
      <FieldBlock label="공용 프롬프트">
        <Textarea
          value={state.commonPrompt}
          onChange={handleCommonPromptChange}
          rows={11}
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
    </>
  );
};

export { ProjectSection };
