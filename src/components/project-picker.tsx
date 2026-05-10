import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import { FolderPlus, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  ApiClientError,
  createProject,
  deleteProject,
  listProjects,
} from '@/api/client';
import type { ProjectSummary } from '../../shared/types';

interface ProjectPickerProps {
  onPick: (projectName: string) => void;
}

const formatTime = (epochMs: number): string => {
  if (!Number.isFinite(epochMs)) return '';

  const date = new Date(epochMs);
  return date.toLocaleString();
};

const ProjectPicker = ({ onPick }: ProjectPickerProps) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const items = await listProjects();
      setProjects(items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load projects.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setName(event.target.value);
  };

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setCreating(true);
    setError(null);
    try {
      const created = await createProject(trimmed);
      setName('');
      onPick(created.name);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to create project.',
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleProjectClick = (event: MouseEvent<HTMLButtonElement>): void => {
    const target = event.currentTarget.dataset.projectName;
    if (target) onPick(target);
  };

  const handleDeleteClick = async (
    event: MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    event.stopPropagation();
    const target = event.currentTarget.dataset.projectName;
    if (!target) return;

    const confirmed = window.confirm(
      `"${target}" 프로젝트를 삭제할까요? 모든 패널, 후보, 이미지가 함께 사라집니다.`,
    );
    if (!confirmed) return;

    setDeletingName(target);
    setError(null);
    try {
      await deleteProject(target);
      setProjects((current) => current.filter((p) => p.name !== target));
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : '프로젝트 삭제에 실패했습니다.';
      setError(message);
    } finally {
      setDeletingName(null);
    }
  };

  /**
   * Loads the project list from the local server when the picker first mounts.
   */
  useEffect(() => {
    void refresh();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <section className="w-full max-w-xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Webtoon Panel Studio
          </h1>
          <p className="text-sm text-slate-400">
            프로젝트를 새로 만들거나 최근 프로젝트를 열어 시작하세요.
          </p>
        </header>

        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-5"
        >
          <Label htmlFor="project-name" className="text-slate-200">
            새 프로젝트 이름
          </Label>
          <div className="flex gap-2">
            <Input
              id="project-name"
              autoFocus
              value={name}
              onChange={handleNameChange}
              placeholder="예: 비 오는 정류장"
              disabled={creating}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
            <Button
              type="submit"
              disabled={creating || !name.trim()}
              className="shrink-0"
            >
              <FolderPlus className="size-4" />
              만들기
            </Button>
          </div>
        </form>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-400">최근 프로젝트</h2>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              불러오는 중…
            </p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-slate-500">
              아직 프로젝트가 없습니다. 위에서 새로 만드세요.
            </p>
          ) : (
            <ul className="space-y-2">
              {projects.map((project) => {
                const isDeleting = deletingName === project.name;
                return (
                  <li
                    key={project.path}
                    className={cn(
                      'group flex items-stretch gap-2 rounded-md border border-slate-800 bg-slate-900',
                      'transition hover:border-slate-600 hover:bg-slate-800',
                      isDeleting && 'opacity-60',
                    )}
                  >
                    <button
                      type="button"
                      data-project-name={project.name}
                      onClick={handleProjectClick}
                      disabled={isDeleting}
                      className="flex-1 rounded-l-md px-4 py-3 text-left"
                    >
                      <p className="text-sm font-medium text-slate-100">
                        {project.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        수정 {formatTime(project.updatedAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label={`${project.name} 삭제`}
                      data-project-name={project.name}
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      className={cn(
                        'flex w-12 items-center justify-center rounded-r-md text-slate-500',
                        'transition hover:bg-red-950/40 hover:text-red-300',
                        'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                      )}
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {error && (
          <p className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </section>
    </main>
  );
};

export { ProjectPicker };
