import { Download, Eye, Sparkles } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TitleBarButtonProps {
  icon: ComponentType<{ className?: string }>;
  primary?: boolean;
  children: ReactNode;
}

const TitleBarButton = ({
  icon: Icon,
  primary = false,
  children,
}: TitleBarButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-6 items-center gap-[6px] rounded-[4px] border border-transparent px-[9px] font-sans text-[11.5px] text-fg-secondary transition-colors duration-[120ms] hover:bg-hover hover:text-foreground',
        primary &&
          'border-brand/25 bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand-hover',
      )}
    >
      <Icon className="size-3" />
      {children}
    </button>
  );
};

const TitleBar = () => {
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
      <TitleBarButton icon={Eye}>preview</TitleBarButton>
      <TitleBarButton icon={Download}>export</TitleBarButton>
      <TitleBarButton icon={Sparkles} primary>
        generate selected
      </TitleBarButton>
    </header>
  );
};

export { TitleBar };
