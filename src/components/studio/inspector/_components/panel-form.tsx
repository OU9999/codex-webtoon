import { ChevronLeft, RefreshCcw, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldBlock } from '../../_components/field-block';
import { RangeField } from '../../_components/range-field';
import { SectionTitle } from '../../_components/section-title';
import { useStudioContext } from '../../studio-context';

const PanelForm = () => {
  const {
    dismissGenerationError,
    finalPrompt,
    generationError,
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
          <kbd className="ml-1 rounded bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide opacity-80">
            ⌘↵
          </kbd>
        </Button>
        {generationError && (
          <aside
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            <span className="flex-1 leading-relaxed">{generationError}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-5 text-destructive hover:bg-destructive/10"
              onClick={dismissGenerationError}
            >
              <X className="size-3.5" />
            </Button>
          </aside>
        )}
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
