import { Download, FileImage, Rows3, Scissors, Settings2 } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

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
import { cn } from '@/lib/utils';
import { useStudioContext } from '../../studio-context';
import {
  DEFAULT_AUTO_SPLIT_HEIGHT,
  DEFAULT_MANUAL_SPLIT_HEIGHT,
  MAX_MANUAL_SPLIT_HEIGHT,
  MIN_MANUAL_SPLIT_HEIGHT,
  getExportHeight,
  getPngExportPartCount,
} from '../../_hooks/use-export';
import type { PngExportMode } from '../../_hooks/use-export';

interface ExportModeOptionProps {
  description: string;
  icon: ReactNode;
  isSelected: boolean;
  mode: PngExportMode;
  title: string;
  onSelect: (mode: PngExportMode) => void;
}

const formatPixels = (value: number): string =>
  `${Math.round(value).toLocaleString()}px`;

const getManualSplitHeight = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MANUAL_SPLIT_HEIGHT;

  return Math.min(
    MAX_MANUAL_SPLIT_HEIGHT,
    Math.max(MIN_MANUAL_SPLIT_HEIGHT, Math.trunc(parsed)),
  );
};

const ExportModeOption = ({
  description,
  icon,
  isSelected,
  mode,
  title,
  onSelect,
}: ExportModeOptionProps) => {
  const handleSelect = (): void => {
    onSelect(mode);
  };

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        'grid grid-cols-[28px_minmax(0,1fr)] gap-2 rounded-[4px] border border-rim bg-background p-2.5 text-left transition-colors hover:border-brand hover:bg-hover',
        isSelected && 'border-brand bg-brand-soft hover:bg-brand-soft',
      )}
      onClick={handleSelect}
    >
      <span
        className={cn(
          'grid size-7 place-items-center rounded-[4px] border border-rim bg-elevated text-fg-muted',
          isSelected && 'border-brand bg-brand text-on-brand',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block text-[12px] font-black text-foreground">
          {title}
        </strong>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-fg-muted">
          {description}
        </span>
      </span>
    </button>
  );
};

const ExportDialog = () => {
  const { exportError, handleWebtoonPngExport, isExporting, state } =
    useStudioContext();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PngExportMode>('auto-split');
  const [manualSplitHeight, setManualSplitHeight] = useState(
    String(DEFAULT_MANUAL_SPLIT_HEIGHT),
  );

  const totalHeight = getExportHeight(state);
  const resolvedManualSplitHeight = getManualSplitHeight(manualSplitHeight);
  const partCount = getPngExportPartCount(state, {
    mode,
    manualSplitHeight: resolvedManualSplitHeight,
  });

  const handleModeSelect = (nextMode: PngExportMode): void => {
    setMode(nextMode);
  };

  const handleManualSplitHeightChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    setManualSplitHeight(event.target.value);
  };

  const handleOpenChange = (open: boolean): void => {
    if (isExporting) return;

    setIsOpen(open);
  };

  const handleExport = async (): Promise<void> => {
    const exported = await handleWebtoonPngExport({
      mode,
      manualSplitHeight: resolvedManualSplitHeight,
    });
    if (!exported) return;

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={isExporting}>
          <Download className="size-4" />
          {isExporting ? 'Exporting' : 'PNG'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(94vw,760px)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle>PNG 저장</DialogTitle>
          <DialogDescription>
            긴 웹툰은 자동으로 나누어 저장하면 브라우저 canvas 한계를 피할 수
            있습니다.
          </DialogDescription>
        </DialogHeader>

        <section className="grid gap-4 overflow-y-auto p-4">
          <section className="grid grid-cols-3 gap-2 rounded-[4px] border border-rim-subtle bg-panel/60 p-3">
            <span>
              <strong className="block font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
                Total
              </strong>
              <span className="mt-1 block text-[12px] font-black text-foreground">
                {formatPixels(totalHeight)}
              </span>
            </span>
            <span>
              <strong className="block font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
                Canvas
              </strong>
              <span className="mt-1 block text-[12px] font-black text-foreground">
                {state.canvases.length}
              </span>
            </span>
            <span>
              <strong className="block font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
                Files
              </strong>
              <span className="mt-1 block text-[12px] font-black text-foreground">
                {partCount}
              </span>
            </span>
          </section>

          <section className="grid gap-2">
            <ExportModeOption
              mode="auto-split"
              title="자동 split"
              description={`${formatPixels(DEFAULT_AUTO_SPLIT_HEIGHT)} 단위로 자동 분할`}
              icon={<Scissors className="size-4" />}
              isSelected={mode === 'auto-split'}
              onSelect={handleModeSelect}
            />
            <ExportModeOption
              mode="canvas-split"
              title="캔버스별 저장"
              description="각 캔버스를 개별 PNG로 저장"
              icon={<Rows3 className="size-4" />}
              isSelected={mode === 'canvas-split'}
              onSelect={handleModeSelect}
            />
            <ExportModeOption
              mode="manual-split"
              title="직접 분할"
              description="입력한 높이 기준으로 PNG를 나누어 저장"
              icon={<Settings2 className="size-4" />}
              isSelected={mode === 'manual-split'}
              onSelect={handleModeSelect}
            />
            <ExportModeOption
              mode="single"
              title="전체 1장"
              description="기존 방식 그대로 긴 PNG 1장으로 저장"
              icon={<FileImage className="size-4" />}
              isSelected={mode === 'single'}
              onSelect={handleModeSelect}
            />
          </section>

          {mode === 'manual-split' && (
            <label className="grid gap-2 rounded-[4px] border border-rim-subtle bg-background p-3">
              <span className="font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
                Split height
              </span>
              <Input
                type="number"
                min={MIN_MANUAL_SPLIT_HEIGHT}
                max={MAX_MANUAL_SPLIT_HEIGHT}
                step={500}
                value={manualSplitHeight}
                onChange={handleManualSplitHeightChange}
                className="h-8 rounded-[4px] border-rim bg-elevated font-mono text-[10.5px]"
              />
              <span className="text-[10.5px] text-fg-muted">
                적용값 {formatPixels(resolvedManualSplitHeight)}
              </span>
            </label>
          )}

          {exportError && (
            <p
              role="alert"
              className="rounded-[4px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] font-semibold text-destructive"
            >
              {exportError}
            </p>
          )}
        </section>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              className="h-8 rounded-[4px] border-rim bg-elevated px-3 font-mono text-[10px] font-semibold uppercase hover:bg-hover"
            >
              취소
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            disabled={isExporting}
            className="h-8 rounded-[4px] px-4 font-mono text-[10px] font-semibold uppercase"
            onClick={handleExport}
          >
            <Download className="size-3.5" />
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ExportDialog };
