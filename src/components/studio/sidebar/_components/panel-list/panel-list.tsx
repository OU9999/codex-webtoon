import { Plus, Rows3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useStudioContext } from '@/components/studio/studio-context';
import { MIN_CANVAS_HEIGHT } from '@shared/project-state';
import { FieldBlock } from '@/components/studio/_components/field-block';
import { PromptTextarea } from '@/components/studio/_components/prompt-textarea';
import { RangeField } from '@/components/studio/_components/range-field';
import { SidebarCollapsibleSection } from '../sidebar-collapsible-section';
import { PanelListItem } from './_components/panel-list-item';

const PanelList = () => {
  const { t } = useTranslation();
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
    ? t('sidebar.canvas.meta', {
        count: selectedCanvasPanels.length,
        height: selectedCanvas.height,
      })
    : t('sidebar.canvas.noCanvas');

  return (
    <SidebarCollapsibleSection
      icon={<Rows3 className="size-4" />}
      title={t('sidebar.canvas.title')}
      meta={meta}
      className="min-h-0"
      contentClassName="grid gap-3 p-2"
    >
      <section className="grid gap-3 rounded-[4px] border border-rim-subtle bg-background p-2.5">
        <RangeField
          label={t('sidebar.canvas.height')}
          value={selectedCanvas?.height ?? MIN_CANVAS_HEIGHT}
          suffix="px"
          min={MIN_CANVAS_HEIGHT}
          max={3600}
          step={10}
          onValueChange={handleCanvasHeightChange}
        />
        <FieldBlock label={t('sidebar.canvas.commonPrompt')} compact>
          <PromptTextarea
            value={selectedCanvas?.commonPrompt ?? ''}
            onChange={handleCanvasCommonPromptChange}
            rows={3}
            className="max-h-32 min-h-18"
            disabled={!selectedCanvas}
          />
          <p className="text-right font-mono text-[9.5px] text-fg-muted">
            {t('common.charCount', {
              count: selectedCanvas?.commonPrompt.length ?? 0,
            })}
          </p>
        </FieldBlock>
        <section className="grid gap-2">
          <header className="flex items-center justify-between gap-3 font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            <span>{t('sidebar.canvas.background')}</span>
            <strong className="text-foreground">
              {selectedCanvas?.backgroundColor ?? '#ffffff'}
            </strong>
          </header>
          <label className="flex items-center gap-2 rounded-[4px] border border-rim bg-elevated px-2 py-1.5 text-[11px] text-fg-muted">
            <input
              type="color"
              aria-label={t('sidebar.canvas.backgroundColorLabel')}
              value={selectedCanvas?.backgroundColor ?? '#ffffff'}
              onChange={handleCanvasBackgroundColorChange}
              disabled={!selectedCanvas}
              className="size-7 cursor-pointer rounded-[3px] border border-rim bg-transparent p-0"
            />
            <span>{t('sidebar.canvas.selectedCanvasColor')}</span>
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
        {t('sidebar.canvas.addPanel')}
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
