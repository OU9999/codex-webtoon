import type { MouseEvent } from 'react';
import { FolderPlus, Loader2, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ProjectSummary } from '@shared/types';
import { formatRelativeTime } from '../_lib/relative-time';

interface RecentProjectsProps {
  projects: ProjectSummary[];
  totalCount: number;
  deletingName: string | null;
  onOpen: (name: string) => void;
  onDelete: (name: string) => void;
  onNewProject: () => void;
}

const ROW_GRID = 'grid-cols-[40px_minmax(0,1fr)_140px_minmax(0,1.4fr)_28px]';

const RecentProjects = ({
  projects,
  totalCount,
  deletingName,
  onOpen,
  onDelete,
  onNewProject,
}: RecentProjectsProps) => {
  const handleOpenClick = (event: MouseEvent<HTMLButtonElement>): void => {
    const name = event.currentTarget.dataset.projectName;
    if (name) onOpen(name);
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    const name = event.currentTarget.dataset.projectName;
    if (name) onDelete(name);
  };

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2.5">
        <span className="font-mono text-[9.5px] tracking-[0.1em] text-fg-muted uppercase">
          recent
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
            no projects yet
          </p>
          <p className="text-[11.5px] text-fg-muted">
            create your first project to get started
          </p>
          <button
            type="button"
            onClick={onNewProject}
            className="mt-2 inline-flex h-[30px] items-center gap-1.5 rounded bg-brand px-3 text-[12px] font-semibold text-on-brand transition-colors hover:bg-brand-hover"
          >
            <FolderPlus className="size-[13px]" />
            new project
          </button>
        </div>
      ) : projects.length === 0 ? (
        <p className="rounded-lg border border-rim bg-elevated px-4 py-8 text-center text-[11.5px] text-fg-muted">
          no projects match your search.
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
            <span>name</span>
            <span>updated</span>
            <span>path</span>
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
                  aria-label={`Open ${project.name}`}
                />
                <span className="pointer-events-none grid size-10 place-items-center overflow-hidden rounded border border-rim bg-canvas font-mono text-base font-semibold text-fg-faint">
                  {initial}
                </span>
                <span className="pointer-events-none truncate text-[12.5px] font-semibold text-foreground">
                  {project.name}
                </span>
                <span className="pointer-events-none text-[11px] text-fg-secondary">
                  {formatRelativeTime(project.updatedAt)}
                </span>
                <span className="pointer-events-none truncate font-mono text-[11px] text-fg-muted">
                  {project.path}
                </span>
                <button
                  type="button"
                  data-project-name={project.name}
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  aria-label={`Delete ${project.name}`}
                  className="relative grid size-5 place-items-center rounded text-fg-muted opacity-0 transition group-hover:opacity-100 hover:bg-status-red/15 hover:text-status-red focus-visible:opacity-100"
                >
                  {isDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export { RecentProjects };
