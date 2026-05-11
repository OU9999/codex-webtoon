import { Download, Eye, Loader2, Sparkles } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useStudioContext } from '../../studio-context';

interface TitleBarButtonProps {
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  iconClassName?: string;
  onClick?: () => Promise<void> | void;
  primary?: boolean;
  children: ReactNode;
}

const TitleBarButton = ({
  icon: Icon,
  disabled = false,
  iconClassName,
  onClick,
  primary = false,
  children,
}: TitleBarButtonProps) => {
  const handleClick = (): void => {
    if (!onClick) return;
    void onClick();
  };

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-6 items-center gap-[6px] rounded-[4px] border border-transparent px-[9px] font-sans text-[11.5px] text-fg-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-foreground',
        primary &&
          'border-brand/25 bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand-hover',
        disabled && 'cursor-not-allowed opacity-45 hover:bg-transparent',
      )}
      disabled={disabled}
      onClick={handleClick}
    >
      <Icon className={cn('size-3', iconClassName, disabled && 'opacity-70')} />
      {children}
    </button>
  );
};

const TitleBar = () => {
  const {
    handleGenerateSelectedPanel,
    handleWebtoonPngExport,
    isExporting,
    isGenerating,
    selectedPanel,
  } = useStudioContext();

  const GenerateIcon = isGenerating ? Loader2 : Sparkles;
  const generateLabel = isGenerating ? 'generating' : 'generate selected';
  const generateDisabled = !selectedPanel || isGenerating;

  return (
    <header className="flex h-[38px] flex-shrink-0 items-center gap-3 border-b border-rim bg-elevated px-3 text-[11.5px]">
      <nav aria-label="Window controls" className="flex items-center gap-[6px]">
        <span className="size-[11px] rounded-full bg-[#ff5f57]" />
        <span className="size-[11px] rounded-full bg-[#febc2e]" />
        <span className="size-[11px] rounded-full bg-[#28c840]" />
      </nav>
      <h1 className="font-semibold tracking-[-0.01em] text-foreground">
        Webtoon Panel Studio
      </h1>
      <span className="font-mono text-[11px] text-fg-secondary">
        rainy_chase.wts
      </span>
      <span className="flex-1" />
      <TitleBarButton icon={Eye} disabled>
        preview
      </TitleBarButton>
      <TitleBarButton
        icon={Download}
        disabled={isExporting}
        onClick={handleWebtoonPngExport}
      >
        {isExporting ? 'exporting' : 'export'}
      </TitleBarButton>
      <TitleBarButton
        icon={GenerateIcon}
        disabled={generateDisabled}
        iconClassName={isGenerating ? 'animate-spin' : undefined}
        onClick={handleGenerateSelectedPanel}
        primary
      >
        {generateLabel}
      </TitleBarButton>
    </header>
  );
};

export { TitleBar };
