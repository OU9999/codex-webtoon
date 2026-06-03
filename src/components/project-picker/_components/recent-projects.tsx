import type { MouseEvent } from 'react';
import { FolderPlus, Loader2, PencilLine, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import type { ProjectSummary } from '@shared/types';
import { formatRelativeTime } from '../_lib/relative-time';

interface RecentProjectsProps {
  projects: ProjectSummary[];
  totalCount: number;
  deletingName: string | null;
  onOpen: (project: ProjectSummary) => void;
  onDelete: (name: string) => void;
  onNewProject: () => void;
  onRename: (name: string) => void;
}

const ROW_GRID = 'grid-cols-[40px_minmax(0,1fr)_140px_minmax(0,1.4fr)_56px]';

const RecentProjects = ({
  projects,
  totalCount,
  deletingName,
  onOpen,
  onDelete,
  onNewProject,
  onRename,
}: RecentProjectsProps) => {
  const { i18n, t } = useTranslation();

  const handleOpenClick = (event: MouseEvent<HTMLButtonElement>): void => {
    const name = event.currentTarget.dataset.projectName;
    const project = projects.find((item) => item.name === name);
    if (project) onOpen(project);
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    const name = event.currentTarget.dataset.projectName;
    if (name) onDelete(name);
  };

  const handleRenameClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    const name = event.currentTarget.dataset.projectName;
    if (name) onRename(name);
  };

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2.5">
        <span className="font-mono text-[9.5px] tracking-[0.1em] text-fg-muted uppercase">
          {t('projectPicker.recent')}
        </span>
        <span className="h-px flex-1 bg-rim" />
        <span className="rounded-full border border-rim bg-elevated px-2 py-px font-mono text-[10.5px] text-fg-muted">
          {totalCount}
        </span>
      </header>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-rim-strong bg-elevated px-5 py-14 text-center">
          <span className="mb-1.5 grid size-14 place-items-center rounded-full border border-dashed border-rim-strong bg-hover text-fg-faint">
            <FolderPlus className="size-6" />
          </span>
          <p className="text-[14px] font-semibold text-fg-secondary">
            {t('projectPicker.emptyState.noProjects')}
          </p>
          <p className="text-[11.5px] text-fg-muted">
            {t('projectPicker.emptyState.createFirst')}
          </p>
          <button
            type="button"
            onClick={onNewProject}
            className="mt-2 inline-flex h-[30px] items-center gap-1.5 rounded bg-brand px-3 text-[12px] font-semibold text-on-brand transition-colors hover:bg-brand-hover"
          >
            <FolderPlus className="size-[13px]" />
            {t('projectPicker.newProject')}
          </button>
        </div>
      ) : projects.length === 0 ? (
        <p className="rounded-lg border border-rim bg-elevated px-4 py-8 text-center text-[11.5px] text-fg-muted">
          {t('projectPicker.searchNoMatch')}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-rim bg-elevated">
          <div
            className={cn(
              'grid items-center gap-3 border-b border-rim px-3 py-2 font-mono text-[9.5px] tracking-[0.08em] text-fg-muted uppercase',
              ROW_GRID,
            )}
          >
            <span />
            <span>{t('projectPicker.row.name')}</span>
            <span>{t('projectPicker.row.updated')}</span>
            <span>{t('projectPicker.row.path')}</span>
            <span />
          </div>
          {projects.map((project) => {
            const isDeleting = deletingName === project.name;
            const initial = project.name.trim().charAt(0).toUpperCase() || '·';
            return (
              <div
                key={project.path}
                className={cn(
                  'group relative grid items-center gap-3 border-b border-rim-subtle px-3 py-2 transition-colors last:border-b-0 hover:bg-hover',
                  ROW_GRID,
                  isDeleting && 'opacity-60',
                )}
              >
                <button
                  type="button"
                  data-project-name={project.name}
                  onClick={handleOpenClick}
                  disabled={isDeleting}
                  className="absolute inset-0"
                  aria-label={t('projectPicker.row.openLabel', {
                    name: project.name,
                  })}
                />
                <span className="pointer-events-none grid size-10 place-items-center overflow-hidden rounded border border-rim bg-canvas font-mono text-base font-semibold text-fg-faint">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </span>
                <span className="pointer-events-none truncate text-[12.5px] font-semibold text-foreground">
                  {project.name}
                </span>
                <span className="pointer-events-none text-[11px] text-fg-secondary">
                  {formatRelativeTime(project.updatedAt, i18n.language)}
                </span>
                <span className="pointer-events-none truncate font-mono text-[11px] text-fg-muted">
                  {project.path}
                </span>
                <span className="relative flex items-center justify-end gap-1">
                  <button
                    type="button"
                    data-project-name={project.name}
                    onClick={handleRenameClick}
                    disabled={isDeleting}
                    aria-label={t('projectPicker.row.renameLabel', {
                      name: project.name,
                    })}
                    className="grid size-5 place-items-center rounded text-fg-muted opacity-0 transition group-hover:opacity-100 hover:bg-brand-soft hover:text-brand focus-visible:opacity-100"
                  >
                    <PencilLine className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    data-project-name={project.name}
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    aria-label={t('projectPicker.row.deleteLabel', {
                      name: project.name,
                    })}
                    className="grid size-5 place-items-center rounded text-fg-muted opacity-0 transition group-hover:opacity-100 hover:bg-status-red/15 hover:text-status-red focus-visible:opacity-100"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export { RecentProjects };
