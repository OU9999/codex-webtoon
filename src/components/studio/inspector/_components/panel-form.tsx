import {
  AlertCircle,
  CircleStop,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  SquarePen,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
    generationErrorKind,
    handleCancelGeneration,
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
  const canRetryGeneration = Boolean(finalPrompt.trim()) && !isGenerating;
  const isGenerationCanceled = generationErrorKind === 'canceled';
  const generationAlertTitle = isGenerationCanceled
    ? t('inspector.panelForm.generationCanceled')
    : t('inspector.panelForm.generationFailed');

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
          {isGenerating && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-status-yellow/40 bg-background font-mono text-[10px] font-semibold text-status-yellow uppercase hover:bg-status-yellow/10 hover:text-status-yellow"
              onClick={handleCancelGeneration}
            >
              <CircleStop className="size-3.5" />
              {t('inspector.panelForm.cancelGeneration')}
            </Button>
          )}
        </section>
        {generationError && (
          <aside
            role="alert"
            className={cn(
              'grid gap-2 rounded-md border px-3 py-2 text-xs',
              isGenerationCanceled
                ? 'border-status-yellow/50 bg-status-yellow/10 text-status-yellow'
                : 'border-destructive/40 bg-destructive/5 text-destructive',
            )}
          >
            <header className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <section className="min-w-0 flex-1">
                <h3 className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">
                  {generationAlertTitle}
                </h3>
                <p className="mt-1 leading-relaxed">{generationError}</p>
              </section>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('inspector.panelForm.dismissGenerationError')}
                className={cn(
                  'size-5',
                  isGenerationCanceled
                    ? 'text-status-yellow hover:bg-status-yellow/10'
                    : 'text-destructive hover:bg-destructive/10',
                )}
                onClick={dismissGenerationError}
              >
                <X className="size-3.5" />
              </Button>
            </header>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-7 justify-self-start bg-background px-2 font-mono text-[10px] font-semibold',
                isGenerationCanceled
                  ? 'border-status-yellow/40 text-status-yellow hover:bg-status-yellow/10 hover:text-status-yellow'
                  : 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive',
              )}
              onClick={handleGenerateSelectedPanel}
              disabled={!canRetryGeneration}
            >
              <RotateCcw className="size-3.5" />
              {t('inspector.panelForm.retryGeneration')}
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
