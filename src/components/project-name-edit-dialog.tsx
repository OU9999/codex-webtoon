import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProjectNameEditDialogProps {
  currentName: string;
  onClose: () => void;
  onRename: (name: string) => Promise<void>;
}

const ProjectNameEditDialog = ({
  currentName,
  onClose,
  onRename,
}: ProjectNameEditDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedName = name.trim();
  const canSubmit = Boolean(trimmedName) && !renaming;

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setName(event.target.value);
  };

  const handleBackdropClick = (): void => {
    if (renaming) return;

    onClose();
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (!canSubmit) return;

    if (trimmedName === currentName.trim()) {
      onClose();
      return;
    }

    setRenaming(true);
    setError(null);
    try {
      await onRename(trimmedName);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t('projectNameDialog.renameFailed');
      setError(message);
      setRenaming(false);
    }
  };

  /** Closes the rename dialog on Escape when no rename request is in flight. */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !renaming) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [renaming, onClose]);

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
          {t('projectNameDialog.title')}
        </h2>
        <p className="mt-1 text-[11px] text-fg-muted">
          {t('projectNameDialog.description')}
        </p>
        <input
          autoFocus
          value={name}
          onChange={handleNameChange}
          disabled={renaming}
          placeholder={t('projectNameDialog.namePlaceholder')}
          aria-label={t('projectNameDialog.namePlaceholder')}
          aria-invalid={Boolean(error)}
          className="text-fg mt-3 h-9 w-full rounded border border-rim bg-elevated px-3 font-mono text-[12px] outline-none placeholder:text-fg-faint focus:border-brand aria-invalid:border-status-red"
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
            disabled={renaming}
            className="hover:text-fg h-[30px] rounded border border-rim bg-elevated px-3 text-[12px] text-fg-secondary transition-colors hover:bg-hover disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-[30px] items-center gap-1.5 rounded bg-brand px-3 text-[12px] font-semibold text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {renaming ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            {t('projectNameDialog.rename')}
          </button>
        </div>
      </form>
    </div>
  );
};

export { ProjectNameEditDialog };
