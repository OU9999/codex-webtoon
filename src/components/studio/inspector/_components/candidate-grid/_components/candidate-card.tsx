import { Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/components/studio/_lib/types';
import {
  formatCandidateProvider,
  formatCandidateTime,
} from '../candidate-meta';

interface CandidateCardProps {
  candidate: Candidate;
  candidateNumber: number;
  isActive: boolean;
  onDelete: (candidateId: string) => void;
  onSelect: (candidateId: string) => void;
}

const CandidateCard = ({
  candidate,
  candidateNumber,
  isActive,
  onDelete,
  onSelect,
}: CandidateCardProps) => {
  const { i18n, t } = useTranslation();
  const formattedNumber = String(candidateNumber).padStart(2, '0');
  const candidateLabel = t('inspector.candidateGrid.candidateNumber', {
    number: formattedNumber,
  });
  const createdAtLabel = formatCandidateTime(
    candidate.createdAt,
    i18n.language,
  );
  const providerLabel = formatCandidateProvider(
    candidate.provider,
    t('inspector.candidateGrid.localMockProvider'),
  );
  const selectLabel = t('inspector.candidateGrid.selectCandidate', {
    number: formattedNumber,
  });

  const handleSelect = (): void => {
    onSelect(candidate.id);
  };

  const handleDelete = (): void => {
    onDelete(candidate.id);
  };

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[4px] border border-rim bg-background transition-[background,border-color,box-shadow]',
        isActive && 'border-brand bg-brand-soft ring-2 ring-brand/15',
      )}
    >
      <button
        type="button"
        className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/25"
        onClick={handleSelect}
        aria-label={selectLabel}
        aria-pressed={isActive}
      >
        <span className="relative block aspect-[4/3] overflow-hidden bg-panel">
          <img
            src={candidate.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <span className="absolute top-1 left-1 rounded-[3px] bg-[rgb(26_31_48/0.68)] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-white backdrop-blur">
            {candidateLabel}
          </span>
          {isActive && (
            <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-brand text-on-brand transition-opacity group-hover:opacity-0">
              <Check className="size-3.5" />
            </span>
          )}
        </span>
        <span className="grid gap-1 border-t border-rim-subtle px-2 py-1.5">
          <span className="flex min-w-0 items-center justify-between gap-2 font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            <span className="truncate">{providerLabel}</span>
            {isActive && (
              <span className="shrink-0 text-brand">
                {t('inspector.candidateGrid.selected')}
              </span>
            )}
          </span>
          {createdAtLabel && (
            <time
              dateTime={candidate.createdAt}
              className="truncate font-mono text-[9.5px] text-fg-muted"
            >
              {createdAtLabel}
            </time>
          )}
        </span>
      </button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 size-6 rounded-full bg-background/90 text-destructive opacity-0 group-hover:opacity-100 hover:bg-background focus-visible:opacity-100"
        onClick={handleDelete}
        aria-label={t('inspector.candidateGrid.deleteCandidate')}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </article>
  );
};

export { CandidateCard };
