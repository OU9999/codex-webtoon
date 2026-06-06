import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Candidate } from '@/components/studio/_lib/types';
import {
  formatCandidateProvider,
  formatCandidateTime,
} from '../candidate-meta';

interface SelectedCandidateSnapshotProps {
  candidate: Candidate;
  candidateNumber: number;
}

const SelectedCandidateSnapshot = ({
  candidate,
  candidateNumber,
}: SelectedCandidateSnapshotProps) => {
  const { i18n, t } = useTranslation();
  const formattedNumber = String(candidateNumber).padStart(2, '0');
  const candidateLabel = t('inspector.candidateGrid.candidateNumber', {
    number: formattedNumber,
  });
  const providerLabel = formatCandidateProvider(
    candidate.provider,
    t('inspector.candidateGrid.localMockProvider'),
  );
  const createdAtLabel = formatCandidateTime(
    candidate.createdAt,
    i18n.language,
  );
  const meta = [
    candidateLabel,
    providerLabel,
    `${candidate.height}px`,
    createdAtLabel,
  ]
    .filter(Boolean)
    .join(' · ');
  const promptSnapshot =
    candidate.promptSnapshot.trim() ||
    t('inspector.candidateGrid.emptySnapshot');

  return (
    <aside
      aria-label={t('inspector.candidateGrid.selectedSnapshotTitle')}
      className="grid gap-2 rounded-[4px] border border-rim-subtle bg-panel/70 p-2.5"
    >
      <header className="flex min-w-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
          <FileText className="size-3.5 shrink-0" />
          <span className="truncate">
            {t('inspector.candidateGrid.selectedSnapshotTitle')}
          </span>
        </span>
        <span className="max-w-[48%] truncate font-mono text-[9.5px] font-semibold text-fg-muted">
          {meta}
        </span>
      </header>
      <pre className="max-h-[132px] overflow-auto rounded-[3px] border border-rim-subtle bg-background p-2 font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap text-fg-secondary">
        {promptSnapshot}
      </pre>
    </aside>
  );
};

export { SelectedCandidateSnapshot };
