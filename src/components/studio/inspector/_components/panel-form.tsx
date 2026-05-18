import { RefreshCcw, Sparkles, SquarePen, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MIN_PANEL_HEIGHT,
  MIN_PANEL_WIDTH,
  WEBTOON_CANVAS_WIDTH,
} from '@shared/project-state';
import { FieldBlock } from '../../_components/field-block';
import { PromptTextarea } from '../../_components/prompt-textarea';
import { RangeField } from '../../_components/range-field';
import { useStudioContext } from '../../studio-context';
import { InspectorSection } from './inspector-section';
import { ReferenceImageDialog } from './reference-image-dialog';

const PanelForm = () => {
  const { t } = useTranslation();
  const {
    dismissGenerationError,
    finalPrompt,
    generationError,
    handleGenerateSelectedPanel,
    handleSelectedPanelHeightChange,
    handleSelectedPanelPromptChange,
    handleSelectedPanelTitleChange,
    handleSelectedPanelWidthChange,
    handleVariantCountChange,
    isGenerating,
    selectedCandidate,
    selectedPanel,
    selectedPanelCanvas,
    selectedPanelCanvasPanels,
    state,
  } = useStudioContext();

  if (!selectedPanel) return null;

  const maxPanelWidth = Math.max(
    MIN_PANEL_WIDTH,
    WEBTOON_CANVAS_WIDTH - selectedPanel.x,
  );
  const maxPanelHeight = Math.max(
    MIN_PANEL_HEIGHT,
    (selectedPanelCanvas?.height ?? MIN_PANEL_HEIGHT) - selectedPanel.y,
  );
  const panelIndex = selectedPanelCanvasPanels.findIndex(
    (panel) => panel.id === selectedPanel.id,
  );
  const meta =
    panelIndex >= 0
      ? `${selectedPanelCanvas?.title ?? t('defaults.canvasTitle')} · PANEL ${String(panelIndex + 1).padStart(2, '0')} / ${selectedPanelCanvasPanels.length}`
      : `${selectedPanel.width}x${selectedPanel.height}`;

  return (
    <InspectorSection
      icon={<SquarePen className="size-4" />}
      title={t('inspector.panelForm.selectedCut')}
      meta={meta}
    >
      <FieldBlock label={t('inspector.panelForm.name')} compact>
        <Input
          value={selectedPanel.title}
          onChange={handleSelectedPanelTitleChange}
          className="bg-background"
        />
      </FieldBlock>
      <RangeField
        label={t('inspector.panelForm.width')}
        value={selectedPanel.width}
        suffix="px"
        min={MIN_PANEL_WIDTH}
        max={maxPanelWidth}
        step={10}
        onValueChange={handleSelectedPanelWidthChange}
      />
      <RangeField
        label={t('inspector.panelForm.height')}
        value={selectedPanel.height}
        suffix="px"
        min={MIN_PANEL_HEIGHT}
        max={maxPanelHeight}
        step={10}
        onValueChange={handleSelectedPanelHeightChange}
      />
      <FieldBlock label={t('inspector.panelForm.prompt')}>
        <ReferenceImageDialog />
        <PromptTextarea
          value={selectedPanel.prompt}
          onChange={handleSelectedPanelPromptChange}
          rows={6}
        />
      </FieldBlock>
      <RangeField
        label={t('inspector.panelForm.variantCount')}
        value={state.variantCount}
        suffix={t('inspector.panelForm.variantSuffix')}
        min={1}
        max={4}
        step={1}
        onValueChange={handleVariantCountChange}
      />

      <section className="grid gap-2">
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
            ? t('inspector.panelForm.generating')
            : selectedCandidate
              ? t('inspector.panelForm.regenerate')
              : t('inspector.panelForm.generate')}
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
            {t('inspector.panelForm.finalPrompt')}
          </summary>
          <pre className="max-h-[180px] overflow-auto border-t bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap">
            {finalPrompt}
          </pre>
        </details>
      </section>
    </InspectorSection>
  );
};

export { PanelForm };
