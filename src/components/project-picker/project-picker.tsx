import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { FolderPlus, Loader2, Search } from 'lucide-react';

import { AppHeader } from '@/components/app-header';
import { AuthBadge } from '@/components/auth-badge';
import { Button } from '@/components/ui/button';
import { useAuthStatus } from '@/hooks/use-auth-status';
import { deleteProject, listProjects } from '@/api/client';
import type { ProjectSummary } from '@shared/types';
import { ContinueHero } from './_components/continue-hero';
import { NewProjectModal } from './_components/new-project-modal';
import { RecentProjects } from './_components/recent-projects';

interface ProjectPickerProps {
  onPick: (projectName: string) => void;
}

const ProjectPicker = ({ onPick }: ProjectPickerProps) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const auth = useAuthStatus();

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const items = await listProjects();
      setProjects(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? sorted.filter((project) =>
        project.name.toLowerCase().includes(normalizedQuery),
      )
    : sorted;
  const heroProject = !normalizedQuery && sorted.length > 0 ? sorted[0] : null;

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value);
  };

  const handleNewProject = (): void => {
    setShowNewProject(true);
  };

  const handleCloseNewProject = (): void => {
    setShowNewProject(false);
  };

  const handleProjectCreated = (name: string): void => {
    setShowNewProject(false);
    onPick(name);
  };

  const handleDeleteProject = async (name: string): Promise<void> => {
    const confirmed = window.confirm(
      `"${name}" 프로젝트를 삭제할까요? 모든 패널, 후보, 이미지가 함께 사라집니다.`,
    );
    if (!confirmed) return;

    setDeletingName(name);
    setError(null);
    try {
      await deleteProject(name);
      setProjects((current) => current.filter((p) => p.name !== name));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '프로젝트 삭제에 실패했습니다.',
      );
    } finally {
      setDeletingName(null);
    }
  };

  /** Loads the project list when the picker first mounts. */
  useEffect(() => {
    void refresh();
  }, []);

  /** Focuses the search field on Cmd/Ctrl+K. */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader
        subtitle="no project open"
        actionsLabel="Project actions"
        actions={
          <>
            <AuthBadge
              status={auth.status}
              loading={auth.loading}
              error={auth.error}
              onRefresh={auth.refresh}
            />
            <Button type="button" onClick={handleNewProject}>
              <FolderPlus className="size-4" />
              New project
            </Button>
          </>
        }
      />

      <main className="flex flex-1 justify-center overflow-y-auto bg-background">
        <div className="flex w-full max-w-[980px] flex-col gap-7 px-10 pt-9 pb-20">
          {loading ? (
            <p className="flex items-center gap-2 py-16 text-[12px] text-fg-muted">
              <Loader2 className="size-4 animate-spin" />
              불러오는 중…
            </p>
          ) : (
            <>
              {heroProject && (
                <ContinueHero project={heroProject} onOpen={onPick} />
              )}

              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2">
                <button
                  type="button"
                  onClick={handleNewProject}
                  className="flex items-center gap-3 rounded-lg border border-brand bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-hover)_100%)] px-4 py-3 text-left text-on-brand shadow-[0_2px_8px_rgb(40_96_200/0.18)] transition-shadow hover:shadow-[0_4px_14px_rgb(40_96_200/0.28)]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-white/30 bg-white/20">
                    <FolderPlus className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[13.5px] font-semibold tracking-[-0.005em]">
                      New project
                    </span>
                    <span className="mt-px block font-mono text-[11px] text-white/75">
                      empty canvas
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-2 rounded-lg border border-rim bg-elevated px-3.5 text-fg-muted transition-colors focus-within:border-brand">
                  <Search className="size-[13px] shrink-0" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="search recent…"
                    className="h-10 min-w-0 flex-1 border-0 bg-transparent font-mono text-[12px] text-foreground outline-none placeholder:text-fg-muted"
                  />
                  <span className="font-mono text-[11px] text-fg-muted">
                    ⌘K
                  </span>
                </div>
              </div>

              <RecentProjects
                projects={filtered}
                totalCount={projects.length}
                deletingName={deletingName}
                onOpen={onPick}
                onDelete={handleDeleteProject}
                onNewProject={handleNewProject}
              />

              {error && (
                <p className="rounded-lg border border-status-red/40 bg-status-red/10 px-3 py-2 text-[11.5px] text-status-red">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="flex h-[22px] shrink-0 items-center gap-[14px] border-t border-rim bg-elevated px-3 font-mono text-[10.5px] text-fg-muted">
        <span className="inline-flex items-center gap-[6px]">
          <span className="size-[6px] rounded-full bg-status-green" />
          local
        </span>
        <span>
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
        <span className="flex-1" />
        <span>v0.3.2</span>
      </footer>

      {showNewProject && (
        <NewProjectModal
          onClose={handleCloseNewProject}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

export { ProjectPicker };
