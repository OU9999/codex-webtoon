import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ApiClientError, createProject } from '@/api/client';
import type { ProjectSummary } from '@shared/types';

interface NewProjectModalProps {
  onClose: () => void;
  onCreated: (project: ProjectSummary) => void;
}

const NewProjectModal = ({ onClose, onCreated }: NewProjectModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setName(event.target.value);
  };

  const handleBackdropClick = (): void => {
    if (!creating) onClose();
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    setError(null);
    try {
      const created = await createProject(trimmed);
      onCreated(created);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('newProjectModal.createFailed');
      setError(message);
      setCreating(false);
    }
  };

  /** Closes the modal on Escape while no creation request is in flight. */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !creating) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [creating, onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-6">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={handleBackdropClick}
        className="absolute inset-0 cursor-default"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[360px] rounded-lg border border-rim bg-elevated p-5 shadow-[0_12px_40px_rgb(22_51_92/0.18)]"
      >
        <h2 className="text-fg text-[14px] font-semibold">
          {t('newProjectModal.title')}
        </h2>
        <p className="mt-1 text-[11px] text-fg-muted">
          {t('newProjectModal.description')}
        </p>
        <input
          autoFocus
          value={name}
          onChange={handleNameChange}
          disabled={creating}
          placeholder={t('newProjectModal.namePlaceholder')}
          className="text-fg mt-3 h-9 w-full rounded border border-rim bg-elevated px-3 font-mono text-[12px] outline-none placeholder:text-fg-faint focus:border-brand"
        />
        {error && (
          <p className="mt-2 rounded border border-status-red/40 bg-status-red/10 px-2.5 py-1.5 text-[11px] text-status-red">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="hover:text-fg h-[30px] rounded border border-rim bg-elevated px-3 text-[12px] text-fg-secondary transition-colors hover:bg-hover disabled:opacity-50"
          >
            {t('newProjectModal.cancel')}
          </button>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="inline-flex h-[30px] items-center gap-1.5 rounded bg-brand px-3 text-[12px] font-semibold text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {creating && <Loader2 className="size-3.5 animate-spin" />}
            {t('newProjectModal.create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export { NewProjectModal };
