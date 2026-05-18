import { ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { useStudioContext } from '@/components/studio/studio-context';
import { InspectorSection } from '../inspector-section';
import { CandidateCard } from './_components/candidate-card';

const CandidateGrid = () => {
  const { t } = useTranslation();
  const {
    handleCandidateDelete,
    handleCandidateSelect,
    handleRestoreCandidate,
    selectedPanel,
  } = useStudioContext();

  if (!selectedPanel) return null;

  const meta = t('inspector.candidateGrid.meta', {
    count: selectedPanel.candidates.length,
  });

  return (
    <InspectorSection
      icon={<ImagePlus className="size-4" />}
      title={t('inspector.candidateGrid.title')}
      meta={meta}
    >
      <section className="grid gap-2">
        {selectedPanel.deletedCandidates.length > 0 && (
          <Button
            type="button"
            variant="link"
            className="h-6 justify-self-end px-0 font-mono text-[10px] font-semibold uppercase"
            onClick={handleRestoreCandidate}
          >
            {t('inspector.candidateGrid.restore')}
          </Button>
        )}
        <section
          className="grid grid-cols-3 gap-2"
          aria-label={t('inspector.candidateGrid.candidatesLabel')}
        >
          {selectedPanel.candidates.length === 0 && (
            <EmptyState>{t('inspector.candidateGrid.empty')}</EmptyState>
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
    </InspectorSection>
  );
};

export { CandidateGrid };
