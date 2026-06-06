import type { CandidateProvider } from '@/components/studio/_lib/types';

const formatCandidateTime = (createdAt: string, language: string): string => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(language, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const formatCandidateProvider = (
  provider: CandidateProvider,
  localMockLabel: string,
): string => {
  if (provider === 'local-mock') return localMockLabel;

  return provider.toUpperCase();
};

export { formatCandidateProvider, formatCandidateTime };
