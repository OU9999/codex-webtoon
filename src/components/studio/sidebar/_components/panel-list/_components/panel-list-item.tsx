import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Panel } from '@/components/studio/_lib/types';

interface PanelListItemProps {
  panel: Panel;
  index: number;
  isActive: boolean;
  onSelect: (panelId: string) => void;
}

const PanelListItem = ({
  panel,
  index,
  isActive,
  onSelect,
}: PanelListItemProps) => {
  const selectedCandidate = panel.candidates.find(
    (candidate) => candidate.id === panel.selectedCandidateId,
  );
  const status = selectedCandidate
    ? 'done'
    : panel.prompt.trim()
      ? 'prompt'
      : 'empty';

  const handleSelect = (): void => {
    onSelect(panel.id);
  };

  return (
    <li>
      <button
        type="button"
        className={cn(
          'grid w-full grid-cols-[22px_44px_minmax(0,1fr)] items-center gap-2 rounded-[4px] border border-rim bg-background p-2 text-left transition-colors hover:bg-hover',
          isActive && 'border-brand bg-brand-soft hover:bg-brand-soft',
        )}
        onClick={handleSelect}
        aria-current={isActive ? 'true' : undefined}
      >
        <span
          className={cn(
            'font-mono text-[11px] font-black text-fg-muted',
            isActive && 'text-brand',
          )}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="relative flex h-8 w-11 items-center justify-center overflow-hidden rounded-[2px] border border-rim bg-panel">
          {selectedCandidate ? (
            <img
              src={selectedCandidate.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="size-3.5 text-fg-faint" />
          )}
          <span
            className={cn(
              'absolute right-1 bottom-1 size-1.5 rounded-full bg-fg-faint',
              status === 'prompt' && 'bg-status-blue',
              status === 'done' && 'bg-status-green',
            )}
          />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-[12px] font-black text-foreground">
            {panel.title}
          </strong>
          <small className="block truncate font-mono text-[9.5px] font-semibold text-fg-muted">
            {panel.width}x{panel.height} / {panel.bubbles.length} layers
          </small>
        </span>
      </button>
    </li>
  );
};

export { PanelListItem };
