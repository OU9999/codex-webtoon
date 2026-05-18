import { Check, ImagePlus, Images, Link, Upload, X } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { MAX_REFERENCE_IMAGES } from '@/components/studio/_lib/constants';
import { cn } from '@/lib/utils';
import {
  getCandidateReference,
  getReferenceImageKey,
  isExternalReferenceImage,
  normalizeExternalReferenceImage,
} from '@shared/reference-images';
import { useStudioContext } from '../../studio-context';
import type {
  Candidate,
  Panel,
  ReferenceImageRef,
} from '@/components/studio/_lib/types';

interface ReferenceImageItem {
  reference: ReferenceImageRef;
  imageUrl: string;
  title: string;
  meta: string;
  source: 'candidate' | 'external';
}

interface ReferenceImageTileProps {
  item: ReferenceImageItem;
  onRemove: (reference: ReferenceImageRef) => void;
}

interface ReferenceImageOptionButtonProps {
  disabled: boolean;
  isSelected: boolean;
  item: ReferenceImageItem;
  onToggle: (reference: ReferenceImageRef) => void;
}

interface ReferenceTriggerPreviewProps {
  items: ReferenceImageItem[];
}

const MAX_EXTERNAL_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const isSameReference = (
  reference: ReferenceImageRef,
  target: ReferenceImageRef,
): boolean => getReferenceImageKey(reference) === getReferenceImageKey(target);

const createExternalReferenceId = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  return `external-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isSupportedRemoteImageUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const getRemoteImageTitle = (imageUrl: string): string => {
  try {
    return new URL(imageUrl).hostname;
  } catch {
    return 'External image';
  }
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('이미지를 읽을 수 없습니다.'));
        return;
      }

      resolve(reader.result);
    });
    reader.addEventListener('error', () => {
      reject(new Error('이미지를 읽을 수 없습니다.'));
    });
    reader.readAsDataURL(file);
  });

const buildCandidateReferenceItems = (
  panels: Panel[],
): ReferenceImageItem[] => {
  const items = new Map<string, ReferenceImageItem>();

  panels.forEach((panel, panelIndex) => {
    panel.candidates.forEach((candidate: Candidate) => {
      const reference = getCandidateReference(panel.id, candidate);
      const key = getReferenceImageKey(reference);
      if (items.has(key)) return;

      items.set(key, {
        reference,
        imageUrl: candidate.imageUrl,
        title: panel.title,
        meta: `P${String(panelIndex + 1).padStart(2, '0')}`,
        source: 'candidate',
      });
    });
  });

  return Array.from(items.values());
};

const buildExternalReferenceItem = (
  reference: ReferenceImageRef,
): ReferenceImageItem | null => {
  if (!isExternalReferenceImage(reference)) return null;
  if (!reference.imageUrl) return null;

  return {
    reference,
    imageUrl: reference.imageUrl,
    title:
      reference.title?.trim() ||
      (reference.imageUrl.startsWith('data:')
        ? 'Uploaded image'
        : getRemoteImageTitle(reference.imageUrl)),
    meta: 'EXT',
    source: 'external',
  };
};

const findReferenceItem = (
  items: ReferenceImageItem[],
  reference: ReferenceImageRef,
): ReferenceImageItem | null => {
  const externalItem = buildExternalReferenceItem(reference);
  if (externalItem) return externalItem;

  return (
    items.find((item) => isSameReference(item.reference, reference)) ?? null
  );
};

const selectedReferenceItems = (
  items: ReferenceImageItem[],
  references: ReferenceImageRef[],
): ReferenceImageItem[] => {
  return references.flatMap((reference) => {
    const item = findReferenceItem(items, reference);
    return item ? [item] : [];
  });
};

const ReferenceTriggerPreview = ({ items }: ReferenceTriggerPreviewProps) => {
  if (items.length === 0) {
    return <span className="text-fg-muted">none</span>;
  }

  return (
    <span className="flex items-center gap-1">
      {items.slice(0, 3).map((item) => (
        <span
          key={getReferenceImageKey(item.reference)}
          className="block size-5 overflow-hidden rounded-[3px] border border-rim bg-panel"
        >
          <img src={item.imageUrl} alt="" className="size-full object-cover" />
        </span>
      ))}
      {items.length > 3 && (
        <span className="font-mono text-[9.5px] text-fg-muted">
          +{items.length - 3}
        </span>
      )}
    </span>
  );
};

const ReferenceImageTile = ({ item, onRemove }: ReferenceImageTileProps) => {
  const handleRemove = (): void => {
    onRemove(item.reference);
  };

  return (
    <article className="grid grid-cols-[54px_minmax(0,1fr)_24px] items-center gap-2 rounded-[4px] border border-rim bg-background p-1.5">
      <span className="block h-12 overflow-hidden rounded-[3px] border border-rim bg-panel">
        <img src={item.imageUrl} alt="" className="size-full object-cover" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[12px] font-black text-foreground">
          {item.title}
        </strong>
        <small className="block font-mono text-[9.5px] font-semibold text-fg-muted uppercase">
          {item.meta} · {item.source}
        </small>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 rounded-[4px] text-fg-muted hover:bg-hover hover:text-destructive"
        onClick={handleRemove}
        aria-label="Remove reference image"
      >
        <X className="size-3.5" />
      </Button>
    </article>
  );
};

const ReferenceImageOptionButton = ({
  disabled,
  isSelected,
  item,
  onToggle,
}: ReferenceImageOptionButtonProps) => {
  const handleToggle = (): void => {
    onToggle(item.reference);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={isSelected}
      className={cn(
        'group relative overflow-hidden rounded-[4px] border border-rim bg-background text-left transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-40',
        isSelected && 'border-brand bg-brand-soft',
      )}
      onClick={handleToggle}
    >
      <img
        src={item.imageUrl}
        alt=""
        className="aspect-square w-full object-cover"
      />
      <span className="absolute bottom-0 left-0 max-w-full bg-background/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-fg-muted">
        {item.meta}
      </span>
      {isSelected && (
        <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-[3px] bg-brand text-on-brand">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
};

const ReferenceImageDialog = () => {
  const { patchSelectedPanel, selectedPanel, state } = useStudioContext();
  const [isOpen, setIsOpen] = useState(false);
  const [draftReferences, setDraftReferences] = useState<ReferenceImageRef[]>(
    [],
  );
  const [externalUrl, setExternalUrl] = useState('');
  const [externalError, setExternalError] = useState<string | null>(null);

  if (!selectedPanel) return null;

  const items = buildCandidateReferenceItems(state.panels);
  const selectedItems = selectedReferenceItems(
    items,
    selectedPanel.referenceImages,
  );
  const draftItems = selectedReferenceItems(items, draftReferences);
  const draftKeys = new Set(draftReferences.map(getReferenceImageKey));
  const selectedMeta = `${selectedPanel.referenceImages.length}/${MAX_REFERENCE_IMAGES}`;
  const draftMeta = `${draftReferences.length}/${MAX_REFERENCE_IMAGES}`;
  const isAtLimit = draftReferences.length >= MAX_REFERENCE_IMAGES;

  const handleOpenChange = (open: boolean): void => {
    setIsOpen(open);
    setExternalUrl('');
    setExternalError(null);
    if (!open) return;

    setDraftReferences(selectedPanel.referenceImages);
  };

  const handleReferenceToggle = (reference: ReferenceImageRef): void => {
    setDraftReferences((current) => {
      const exists = current.some((item) => isSameReference(item, reference));
      if (exists) {
        return current.filter((item) => !isSameReference(item, reference));
      }
      if (current.length >= MAX_REFERENCE_IMAGES) return current;

      return [...current, reference];
    });
  };

  const handleReferenceRemove = (reference: ReferenceImageRef): void => {
    setDraftReferences((current) =>
      current.filter((item) => !isSameReference(item, reference)),
    );
  };

  const handleReferencesClear = (): void => {
    setDraftReferences([]);
  };

  const handleReferenceAdd = (reference: ReferenceImageRef): void => {
    setDraftReferences((current) => {
      const exists = current.some((item) => isSameReference(item, reference));
      if (exists) return current;
      if (current.length >= MAX_REFERENCE_IMAGES) return current;

      return [...current, reference];
    });
  };

  const handleConfirm = (): void => {
    patchSelectedPanel({ referenceImages: draftReferences });
    setIsOpen(false);
    setExternalUrl('');
    setExternalError(null);
  };

  const handleExternalUrlChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    setExternalUrl(event.target.value);
    if (externalError) setExternalError(null);
  };

  const handleExternalUrlSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const imageUrl = externalUrl.trim();
    if (!imageUrl) return;
    if (isAtLimit) {
      setExternalError('레퍼런스는 최대 4개까지 사용할 수 있습니다.');
      return;
    }
    if (!isSupportedRemoteImageUrl(imageUrl)) {
      setExternalError('http 또는 https 이미지 URL을 입력하세요.');
      return;
    }

    handleReferenceAdd(
      normalizeExternalReferenceImage({
        imageUrl,
        title: getRemoteImageTitle(imageUrl),
        createdAt: new Date().toISOString(),
      }),
    );
    setExternalUrl('');
    setExternalError(null);
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (isAtLimit) {
      setExternalError('레퍼런스는 최대 4개까지 사용할 수 있습니다.');
      return;
    }
    if (!SUPPORTED_FILE_TYPES.has(file.type)) {
      setExternalError('PNG, JPEG, WebP 이미지만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_EXTERNAL_IMAGE_BYTES) {
      setExternalError('외부 이미지는 10MB 이하만 사용할 수 있습니다.');
      return;
    }

    try {
      const imageUrl = await readFileAsDataUrl(file);
      handleReferenceAdd(
        normalizeExternalReferenceImage({
          id: createExternalReferenceId(),
          imageUrl,
          title: file.name,
          createdAt: new Date().toISOString(),
        }),
      );
      setExternalError(null);
    } catch (err) {
      setExternalError(
        err instanceof Error ? err.message : '이미지를 읽을 수 없습니다.',
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full justify-between rounded-[4px] border-rim bg-background px-2.5 font-mono text-[10px] font-semibold uppercase hover:bg-hover"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Images className="size-3.5 shrink-0" />
            <span>Reference images</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <ReferenceTriggerPreview items={selectedItems} />
            <span className="text-fg-muted">{selectedMeta}</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="min-h-[min(84vh,820px)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle>Reference images</DialogTitle>
          <DialogDescription>
            선택한 이미지는 다음 패널 생성의 시각 레퍼런스로 함께 전달됩니다.
          </DialogDescription>
        </DialogHeader>

        <section className="grid min-h-0 grid-cols-1 overflow-y-auto md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="grid min-h-0 content-start gap-3 border-b border-rim-subtle bg-panel/60 p-4 md:border-r md:border-b-0">
            <header className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
                Selected
              </span>
              <span className="font-mono text-[9.5px] font-semibold text-fg-muted">
                {draftMeta}
              </span>
            </header>
            <section className="grid max-h-[220px] gap-2 overflow-y-auto pr-1 md:max-h-[420px]">
              {draftItems.length === 0 && (
                <EmptyState>No references</EmptyState>
              )}
              {draftItems.map((item) => (
                <ReferenceImageTile
                  key={getReferenceImageKey(item.reference)}
                  item={item}
                  onRemove={handleReferenceRemove}
                />
              ))}
            </section>
            {draftReferences.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 justify-start rounded-[4px] border-rim bg-background px-2 font-mono text-[10px] font-semibold text-fg-muted uppercase hover:bg-hover"
                onClick={handleReferencesClear}
              >
                <X className="size-3.5" />
                Clear all
              </Button>
            )}
          </aside>

          <section className="grid min-h-0 content-start gap-4 p-4">
            <section className="grid gap-2 rounded-[4px] border border-rim-subtle bg-background p-3">
              <header className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
                  External image
                </span>
                {isAtLimit && (
                  <span className="font-mono text-[9.5px] font-semibold text-fg-muted uppercase">
                    Max
                  </span>
                )}
              </header>
              <form
                className="grid grid-cols-[minmax(0,1fr)_86px] gap-2"
                onSubmit={handleExternalUrlSubmit}
              >
                <label className="relative flex items-center">
                  <Link className="pointer-events-none absolute left-2 size-3.5 text-fg-muted" />
                  <Input
                    value={externalUrl}
                    onChange={handleExternalUrlChange}
                    disabled={isAtLimit}
                    placeholder="https://..."
                    className="h-8 rounded-[4px] border-rim bg-elevated pl-7 font-mono text-[10.5px]"
                    aria-label="External reference image URL"
                  />
                </label>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isAtLimit}
                  className="h-8 rounded-[4px] border-rim bg-elevated px-2 font-mono text-[10px] font-semibold uppercase hover:bg-hover"
                >
                  <ImagePlus className="size-3.5" />
                  Add
                </Button>
              </form>
              <label
                className={cn(
                  'flex h-8 cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-dashed border-rim bg-elevated font-mono text-[10px] font-semibold text-fg-muted uppercase transition-colors hover:bg-hover hover:text-foreground',
                  isAtLimit &&
                    'pointer-events-none cursor-not-allowed opacity-50',
                )}
                aria-disabled={isAtLimit}
              >
                <Upload className="size-3.5" />
                Upload png / jpg / webp
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={isAtLimit}
                  onChange={handleFileChange}
                />
              </label>
              {externalError && (
                <p className="rounded-[4px] border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[11px] font-semibold text-destructive">
                  {externalError}
                </p>
              )}
            </section>

            <section className="grid min-h-0 gap-2">
              <header className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
                  Candidate pool
                </span>
                <span className="font-mono text-[9.5px] font-semibold text-fg-muted">
                  {items.length}
                </span>
              </header>
              <section
                className="grid max-h-[360px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5"
                aria-label="Available reference images"
              >
                {items.length === 0 && <EmptyState>No candidates</EmptyState>}
                {items.map((item) => {
                  const key = getReferenceImageKey(item.reference);
                  const isSelected = draftKeys.has(key);
                  const disabled = !isSelected && isAtLimit;

                  return (
                    <ReferenceImageOptionButton
                      key={key}
                      disabled={disabled}
                      isSelected={isSelected}
                      item={item}
                      onToggle={handleReferenceToggle}
                    />
                  );
                })}
              </section>
            </section>
          </section>
        </section>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-[4px] border-rim bg-elevated px-3 font-mono text-[10px] font-semibold uppercase hover:bg-hover"
            >
              취소
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-[4px] px-4 font-mono text-[10px] font-semibold uppercase"
            onClick={handleConfirm}
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ReferenceImageDialog };
