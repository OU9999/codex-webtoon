import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/components/studio/_lib/types';

interface CandidateCardProps {
  candidate: Candidate;
  isActive: boolean;
  onDelete: (candidateId: string) => void;
  onSelect: (candidateId: string) => void;
}

const CandidateCard = ({
  candidate,
  isActive,
  onDelete,
  onSelect,
}: CandidateCardProps) => {
  const { t } = useTranslation();

  const handleSelect = (): void => {
    onSelect(candidate.id);
  };

  const handleDelete = (): void => {
    onDelete(candidate.id);
  };

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-md border-2 border-transparent bg-background',
        isActive && 'border-primary',
      )}
    >
      <button
        type="button"
        className="block aspect-square w-full bg-muted"
        onClick={handleSelect}
      >
        <img
          src={candidate.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 size-6 rounded-full bg-background/90 text-destructive hover:bg-background"
        onClick={handleDelete}
        aria-label={t('inspector.candidateGrid.deleteCandidate')}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </article>
  );
};

export { CandidateCard };
