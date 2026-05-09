import { ChevronLeft, RefreshCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldBlock } from '../../_components/field-block';
import { RangeField } from '../../_components/range-field';
import { SectionTitle } from '../../_components/section-title';
import { useStudioContext } from '../../studio-context';

const PanelForm = () => {
  const {
    finalPrompt,
    handleGenerateSelectedPanel,
    handleSelectedPanelHeightChange,
    handleSelectedPanelPromptChange,
    handleSelectedPanelTitleChange,
    isGenerating,
    selectedCandidate,
    selectedPanel,
  } = useStudioContext();

  if (!selectedPanel) return null;

  return (
    <>
      <SectionTitle
        icon={<ChevronLeft className="size-4" />}
        title="Selected Cut"
      />
      <FieldBlock label="패널 이름" compact>
        <Input
          value={selectedPanel.title}
          onChange={handleSelectedPanelTitleChange}
          className="bg-background"
        />
      </FieldBlock>
      <RangeField
        label="패널 높이"
        value={selectedPanel.height}
        suffix="px"
        min={220}
        max={900}
        step={10}
        onValueChange={handleSelectedPanelHeightChange}
      />
      <FieldBlock label="컷별 프롬프트">
        <Textarea
          value={selectedPanel.prompt}
          onChange={handleSelectedPanelPromptChange}
          rows={6}
          className="resize-y bg-background leading-relaxed"
        />
      </FieldBlock>

      <section className="mb-5 grid gap-2">
        <Button
          type="button"
          className="w-full"
          onClick={handleGenerateSelectedPanel}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <RefreshCcw className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isGenerating
            ? 'Generating'
            : selectedCandidate
              ? 'Regenerate cut'
              : 'Generate cut'}
        </Button>
        <details className="overflow-hidden rounded-md border bg-background">
          <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-muted-foreground">
            최종 생성 조건
          </summary>
          <pre className="max-h-[180px] overflow-auto border-t bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap">
            {finalPrompt}
          </pre>
        </details>
      </section>
    </>
  );
};

export { PanelForm };
