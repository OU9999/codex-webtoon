import { Check, Images, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { MAX_REFERENCE_IMAGES } from '@/components/studio/_lib/constants';
import { cn } from '@/lib/utils';
import {
  getCandidateReference,
  getReferenceImageKey,
} from '@shared/reference-images';
import { useStudioContext } from '../../studio-context';
import type {
  Candidate,
  Panel,
  ReferenceImageRef,
} from '@/components/studio/_lib/types';

interface ReferenceImageOption {
  reference: ReferenceImageRef;
  candidate: Candidate;
  panelIndex: number;
}

interface ReferenceImageCardProps {
  option: ReferenceImageOption;
  onRemove: (reference: ReferenceImageRef) => void;
}

interface ReferenceImageOptionButtonProps {
  disabled: boolean;
  isSelected: boolean;
  option: ReferenceImageOption;
  onToggle: (reference: ReferenceImageRef) => void;
}

const isSameReference = (
  reference: ReferenceImageRef,
  target: ReferenceImageRef,
): boolean =>
  reference.panelId === target.panelId &&
  reference.candidateId === target.candidateId;

const buildReferenceOptions = (panels: Panel[]): ReferenceImageOption[] => {
  const options = new Map<string, ReferenceImageOption>();

  panels.forEach((panel, panelIndex) => {
    panel.candidates.forEach((candidate) => {
      const reference = getCandidateReference(panel.id, candidate);
      const key = getReferenceImageKey(reference);
      if (options.has(key)) return;

      options.set(key, {
        reference,
        candidate,
        panelIndex,
      });
    });
  });

  return Array.from(options.values());
};

const findReferenceOption = (
  options: ReferenceImageOption[],
  reference: ReferenceImageRef,
): ReferenceImageOption | undefined =>
  options.find((option) => isSameReference(option.reference, reference));

const selectedReferenceOptions = (
  options: ReferenceImageOption[],
  selectedPanel: Panel,
): ReferenceImageOption[] => {
  return selectedPanel.referenceImages.flatMap((reference) => {
    const option = findReferenceOption(options, reference);
    return option ? [option] : [];
  });
};

const ReferenceImageCard = ({ option, onRemove }: ReferenceImageCardProps) => {
  const handleRemove = (): void => {
    onRemove(option.reference);
  };

  return (
    <article className="group relative overflow-hidden rounded-[4px] border border-rim bg-background">
      <img
        src={option.candidate.imageUrl}
        alt=""
        className="aspect-square w-full object-cover"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 size-5 rounded-[3px] bg-background/95 text-fg-muted opacity-90 hover:bg-background hover:text-destructive"
        onClick={handleRemove}
        aria-label="Remove reference image"
      >
        <X className="size-3" />
      </Button>
    </article>
  );
};

const ReferenceImageOptionButton = ({
  disabled,
  isSelected,
  option,
  onToggle,
}: ReferenceImageOptionButtonProps) => {
  const handleToggle = (): void => {
    onToggle(option.reference);
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
        src={option.candidate.imageUrl}
        alt=""
        className="aspect-square w-full object-cover"
      />
      <span className="absolute bottom-0 left-0 max-w-full bg-background/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-fg-muted">
        P{String(option.panelIndex + 1).padStart(2, '0')}
      </span>
      {isSelected && (
        <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-[3px] bg-brand text-on-brand">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
};

const ReferenceImagePopover = () => {
  const {
    handleReferenceImageRemove,
    handleReferenceImageToggle,
    handleReferenceImagesClear,
    selectedPanel,
    state,
  } = useStudioContext();

  if (!selectedPanel) return null;

  const options = buildReferenceOptions(state.panels);
  const selectedOptions = selectedReferenceOptions(options, selectedPanel);
  const selectedKeys = new Set(
    selectedPanel.referenceImages.map(getReferenceImageKey),
  );
  const selectedCount = selectedPanel.referenceImages.length;
  const isAtLimit = selectedCount >= MAX_REFERENCE_IMAGES;
  const meta = `${selectedCount}/${MAX_REFERENCE_IMAGES}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full justify-between rounded-[4px] border-rim bg-background px-2 font-mono text-[10px] font-semibold uppercase hover:bg-hover"
        >
          <span className="flex items-center gap-2">
            <Images className="size-3.5" />
            Reference images
          </span>
          <span className="text-fg-muted">{meta}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px]">
        <section className="grid gap-3">
          <header className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
              References
            </span>
            <span className="font-mono text-[9.5px] font-semibold text-fg-muted">
              {meta}
            </span>
          </header>

          <section className="grid gap-2">
            <header className="flex items-center justify-between gap-2">
              <p className="font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
                Selected
              </p>
              {selectedCount > 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="h-5 px-0 font-mono text-[10px] font-semibold uppercase"
                  onClick={handleReferenceImagesClear}
                >
                  Clear
                </Button>
              )}
            </header>
            <section
              className="grid grid-cols-4 gap-2"
              aria-label="Selected reference images"
            >
              {selectedOptions.length === 0 && (
                <EmptyState>No references</EmptyState>
              )}
              {selectedOptions.map((option) => (
                <ReferenceImageCard
                  key={getReferenceImageKey(option.reference)}
                  option={option}
                  onRemove={handleReferenceImageRemove}
                />
              ))}
            </section>
          </section>

          <section className="grid gap-2 border-t border-rim-subtle pt-3">
            <header className="flex items-center justify-between gap-2">
              <p className="font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
                Candidate pool
              </p>
              <p className="font-mono text-[9.5px] font-semibold text-fg-muted">
                {options.length}
              </p>
            </header>
            <section
              className="grid max-h-[210px] grid-cols-4 gap-2 overflow-y-auto pr-1"
              aria-label="Available reference images"
            >
              {options.length === 0 && <EmptyState>No candidates</EmptyState>}
              {options.map((option) => {
                const key = getReferenceImageKey(option.reference);
                const isSelected = selectedKeys.has(key);
                const disabled = !isSelected && isAtLimit;

                return (
                  <ReferenceImageOptionButton
                    key={key}
                    disabled={disabled}
                    isSelected={isSelected}
                    option={option}
                    onToggle={handleReferenceImageToggle}
                  />
                );
              })}
            </section>
          </section>
        </section>
      </PopoverContent>
    </Popover>
  );
};

export { ReferenceImagePopover };
