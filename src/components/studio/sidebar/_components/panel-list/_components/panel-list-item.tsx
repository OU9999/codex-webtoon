import { GripVertical, ImageIcon } from 'lucide-react';
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type {
  Panel,
  SidebarDropPosition,
} from '@/components/studio/_lib/types';

interface PanelListItemProps {
  panel: Panel;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  canReorder: boolean;
  dropPosition: SidebarDropPosition | null;
  onSelect: (panelId: string, additive: boolean) => void;
  onPointerDown: (
    event: ReactPointerEvent<HTMLLIElement>,
    panelId: string,
  ) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLLIElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLLIElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLLIElement>) => void;
}

const PanelListItem = ({
  panel,
  index,
  isActive,
  isDragging,
  canReorder,
  dropPosition,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: PanelListItemProps) => {
  const { t } = useTranslation();
  const selectedCandidate = panel.candidates.find(
    (candidate) => candidate.id === panel.selectedCandidateId,
  );
  const status = selectedCandidate
    ? 'done'
    : panel.prompt.trim()
      ? 'prompt'
      : 'empty';
  const dragTitle = t('sidebar.panelList.dragPanel', { title: panel.title });

  const handleSelect = (event: ReactMouseEvent<HTMLButtonElement>): void => {
    onSelect(panel.id, event.shiftKey);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLLIElement>): void => {
    onPointerDown(event, panel.id);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLLIElement>): void => {
    onPointerMove(event);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLLIElement>): void => {
    onPointerUp(event);
  };

  const handlePointerCancel = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    onPointerCancel(event);
  };

  return (
    <li
      className={cn(
        'relative grid grid-cols-[16px_minmax(0,1fr)] items-center gap-1.5 rounded-[4px] border border-rim bg-background p-1.5 transition-all',
        isActive && 'border-brand bg-brand-soft hover:bg-brand-soft',
        isDragging &&
          'scale-[0.99] border-dashed border-brand bg-brand-soft/70 opacity-70',
        dropPosition && 'border-brand bg-brand-soft ring-1 ring-brand/45',
      )}
      data-sidebar-panel-id={panel.id}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {dropPosition && (
        <span
          className={cn(
            'pointer-events-none absolute right-1 left-1 z-10 h-[3px] rounded-full bg-brand shadow-[0_0_0_3px_var(--brand-soft)]',
            dropPosition === 'before' ? '-top-1.5' : '-bottom-1.5',
          )}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          'grid size-4 cursor-grab touch-none place-items-center text-fg-faint active:cursor-grabbing',
          !canReorder && 'cursor-default opacity-45',
        )}
        title={dragTitle}
        aria-hidden="true"
      >
        <GripVertical className="size-3.5" />
      </span>
      <button
        type="button"
        className={cn(
          'grid min-w-0 touch-none grid-cols-[22px_44px_minmax(0,1fr)] items-center gap-2 rounded-[3px] px-1 py-0.5 text-left transition-colors hover:bg-hover',
          isActive && 'hover:bg-brand-soft',
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
            {t('sidebar.panelList.itemMeta', {
              width: panel.width,
              height: panel.height,
              count: panel.bubbles.length,
            })}
          </small>
        </span>
      </button>
    </li>
  );
};

export { PanelListItem };
