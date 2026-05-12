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
  const handleSelect = (): void => {
    onSelect(panel.id);
  };

  return (
    <li>
      <button
        type="button"
        className={cn(
          'grid w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border bg-background p-2.5 text-left text-sm transition-colors hover:bg-accent',
          isActive && 'border-primary bg-primary/10 hover:bg-primary/10',
        )}
        onClick={handleSelect}
      >
        <span className="font-black text-primary">
          {String(index + 1).padStart(2, '0')}
        </span>
        <strong className="truncate">{panel.title}</strong>
        <small className="font-mono text-[10px] font-bold text-muted-foreground">
          {panel.width}×{panel.height}
        </small>
      </button>
    </li>
  );
};

export { PanelListItem };
