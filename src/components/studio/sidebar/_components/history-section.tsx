import { History, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '../../_components/section-title';
import { useStudioContext } from '../../studio-context';

const formatHistoryTime = (createdAt: number): string => {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(createdAt);
};

const HistorySection = () => {
  const { canUndo, handleUndo, historyEntries } = useStudioContext();

  return (
    <section className="mb-4 border-y py-3">
      <header className="mb-2 flex items-center justify-between gap-3">
        <SectionTitle
          icon={<History className="size-4" />}
          title="History"
          className="mt-0 mb-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canUndo}
          onClick={handleUndo}
          className="h-7 px-2 text-[11px]"
        >
          <Undo2 className="size-3.5" />
          Undo
        </Button>
      </header>
      <section
        className="grid max-h-[132px] gap-1 overflow-y-auto pr-1"
        aria-label="Edit history"
      >
        {historyEntries.length > 0 ? (
          historyEntries.slice(0, 6).map((entry) => (
            <p
              key={entry.id}
              className="grid grid-cols-[minmax(0,1fr)_58px] items-center gap-2 rounded-md border border-rim bg-background px-2.5 py-1.5 text-[11px]"
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
          <p className="rounded-md border border-dashed border-rim bg-background px-2.5 py-2 text-[11px] text-fg-muted">
            No edits yet
          </p>
        )}
      </section>
    </section>
  );
};

export { HistorySection };
