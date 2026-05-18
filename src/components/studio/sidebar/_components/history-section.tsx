import { History, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useStudioContext } from '../../studio-context';
import { SidebarCollapsibleSection } from './sidebar-collapsible-section';

const formatHistoryTime = (createdAt: number): string => {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(createdAt);
};

const HistorySection = () => {
  const { t } = useTranslation();
  const { canUndo, handleUndo, historyEntries } = useStudioContext();
  const meta = t('sidebar.history.meta', { count: historyEntries.length });

  return (
    <SidebarCollapsibleSection
      icon={<History className="size-4" />}
      title={t('sidebar.history.title')}
      meta={meta}
      defaultOpen={false}
      contentClassName="p-2"
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
          {t('sidebar.history.latestEdits')}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canUndo}
          onClick={handleUndo}
          className="h-6 rounded-[3px] px-2 font-mono text-[9.5px] font-semibold uppercase"
        >
          <Undo2 className="size-3.5" />
          {t('sidebar.history.undo')}
        </Button>
      </header>
      <section
        className="grid max-h-[132px] gap-1 overflow-y-auto pr-1"
        aria-label={t('sidebar.history.editHistoryLabel')}
      >
        {historyEntries.length > 0 ? (
          historyEntries.slice(0, 6).map((entry) => (
            <p
              key={entry.id}
              className="grid grid-cols-[minmax(0,1fr)_58px] items-center gap-2 rounded-[4px] border border-rim bg-background px-2.5 py-1.5 text-[11px]"
            >
              <span className="truncate text-fg-secondary">{entry.label}</span>
              <time
                dateTime={new Date(entry.createdAt).toISOString()}
                className="text-right font-mono text-[9.5px] text-fg-muted"
              >
                {formatHistoryTime(entry.createdAt)}
              </time>
            </p>
          ))
        ) : (
          <p className="rounded-[4px] border border-dashed border-rim bg-background px-2.5 py-2 text-[11px] text-fg-muted">
            {t('sidebar.history.noEdits')}
          </p>
        )}
      </section>
    </SidebarCollapsibleSection>
  );
};

export { HistorySection };
