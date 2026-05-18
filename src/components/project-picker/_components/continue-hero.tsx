import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ProjectSummary } from '@shared/types';
import { formatRelativeTime } from '../_lib/relative-time';

interface ContinueHeroProps {
  project: ProjectSummary;
  onOpen: (name: string) => void;
}

const ContinueHero = ({ project, onOpen }: ContinueHeroProps) => {
  const { i18n, t } = useTranslation();

  const handleOpen = (): void => {
    onOpen(project.name);
  };

  const initial = project.name.trim().charAt(0).toUpperCase() || '·';

  return (
    <section className="grid grid-cols-[380px_1fr] overflow-hidden rounded-lg border border-rim bg-elevated">
      <div className="relative bg-canvas">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle,rgb(22_51_92/0.07)_1px,transparent_1px)] bg-[length:18px_18px] font-mono text-7xl font-semibold text-fg-faint/70 select-none">
            {initial}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_70%,var(--bg-elevated)_100%)]" />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-2 px-7 py-6">
        <p className="font-mono text-[9.5px] tracking-[0.1em] text-fg-muted uppercase">
          {t('projectPicker.continueHero.continue')}
        </p>
        <h2 className="text-[26px] leading-[1.1] font-semibold tracking-[-0.02em] text-foreground">
          {project.name}
        </h2>
        <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-fg-secondary">
          <span className="font-mono">{project.path}</span>
          <span className="text-fg-faint">·</span>
          <span>
            {t('projectPicker.continueHero.edited', {
              time: formatRelativeTime(project.updatedAt, i18n.language),
            })}
          </span>
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex h-[34px] items-center gap-1.5 rounded bg-brand px-3.5 text-[12px] font-semibold text-on-brand transition-colors hover:bg-brand-hover"
          >
            <ChevronRight className="size-[13px]" />
            {t('projectPicker.continueHero.open')}
          </button>
        </div>
      </div>
    </section>
  );
};

export { ContinueHero };
