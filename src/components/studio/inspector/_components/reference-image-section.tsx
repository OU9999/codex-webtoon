import { Check, Images, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { SectionTitle } from '@/components/studio/_components/section-title';
import { MAX_REFERENCE_IMAGES } from '@/components/studio/_lib/constants';
import { cn } from '@/lib/utils';
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

const getReferenceKey = (reference: ReferenceImageRef): string =>
  `${reference.panelId}:${reference.candidateId}`;

const isSameReference = (
  reference: ReferenceImageRef,
  target: ReferenceImageRef,
): boolean =>
  reference.panelId === target.panelId &&
  reference.candidateId === target.candidateId;

const buildReferenceOptions = (panels: Panel[]): ReferenceImageOption[] =>
  panels.flatMap((panel, panelIndex) =>
    panel.candidates.map((candidate) => ({
      reference: {
        panelId: panel.id,
        candidateId: candidate.id,
      },
      candidate,
      panelIndex,
    })),
  );

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
    <article className="group relative overflow-hidden rounded border bg-background">
      <img
        src={option.candidate.imageUrl}
        alt=""
        className="aspect-square w-full object-cover"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 size-5 rounded bg-background/95 text-muted-foreground opacity-90 hover:bg-background hover:text-destructive"
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
        'group relative overflow-hidden rounded border bg-background text-left transition-colors hover:border-primary/70 disabled:cursor-not-allowed disabled:opacity-40',
        isSelected && 'border-primary bg-primary/5',
      )}
      onClick={handleToggle}
    >
      <img
        src={option.candidate.imageUrl}
        alt=""
        className="aspect-square w-full object-cover"
      />
      <span className="absolute bottom-0 left-0 max-w-full bg-background/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
        P{String(option.panelIndex + 1).padStart(2, '0')}
      </span>
      {isSelected && (
        <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
};

const ReferenceImageSection = () => {
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
    selectedPanel.referenceImages.map(getReferenceKey),
  );
  const isAtLimit = selectedOptions.length >= MAX_REFERENCE_IMAGES;

  return (
    <section className="mb-5 rounded-md border bg-background/70">
      <header className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <SectionTitle
          icon={<Images className="size-4" />}
          title="References"
          className="mt-0 mb-0"
        />
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-muted-foreground">
            {selectedOptions.length}/{MAX_REFERENCE_IMAGES}
          </span>
          {selectedOptions.length > 0 && (
            <Button
              type="button"
              variant="link"
              className="h-6 px-0 text-xs"
              onClick={handleReferenceImagesClear}
            >
              Clear
            </Button>
          )}
        </div>
      </header>

      <section className="grid gap-3 p-3">
        <section
          className="grid grid-cols-4 gap-2"
          aria-label="Selected reference images"
        >
          {selectedOptions.length === 0 && (
            <EmptyState>No references</EmptyState>
          )}
          {selectedOptions.map((option) => (
            <ReferenceImageCard
              key={getReferenceKey(option.reference)}
              option={option}
              onRemove={handleReferenceImageRemove}
            />
          ))}
        </section>

        <section className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
              Candidate pool
            </p>
            <p className="font-mono text-[10px] font-bold text-muted-foreground">
              {options.length}
            </p>
          </div>
          <section
            className="grid max-h-[210px] grid-cols-4 gap-2 overflow-y-auto pr-1"
            aria-label="Available reference images"
          >
            {options.length === 0 && <EmptyState>No candidates</EmptyState>}
            {options.map((option) => {
              const key = getReferenceKey(option.reference);
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
    </section>
  );
};

export { ReferenceImageSection };
