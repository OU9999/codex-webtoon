import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { SectionTitle } from '@/components/studio/_components/section-title';
import { useStudioContext } from '@/components/studio/studio-context';
import { CandidateCard } from './_components/candidate-card';

const CandidateGrid = () => {
  const {
    handleCandidateDelete,
    handleCandidateSelect,
    handleRestoreCandidate,
    selectedPanel,
  } = useStudioContext();

  if (!selectedPanel) return null;

  return (
    <section className="mb-5">
      <header className="mb-2 flex items-center justify-between gap-3">
        <SectionTitle
          icon={<ImagePlus className="size-4" />}
          title="Candidates"
          className="mb-0"
        />
        {selectedPanel.deletedCandidates.length > 0 && (
          <Button
            type="button"
            variant="link"
            className="h-7 px-0"
            onClick={handleRestoreCandidate}
          >
            Restore
          </Button>
        )}
      </header>
      <section className="grid grid-cols-3 gap-2" aria-label="Image candidates">
        {selectedPanel.candidates.length === 0 && (
          <EmptyState>No candidates</EmptyState>
        )}
        {selectedPanel.candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            isActive={candidate.id === selectedPanel.selectedCandidateId}
            onDelete={handleCandidateDelete}
            onSelect={handleCandidateSelect}
          />
        ))}
      </section>
    </section>
  );
};

export { CandidateGrid };
