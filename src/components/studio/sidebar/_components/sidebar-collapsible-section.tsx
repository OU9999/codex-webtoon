import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SidebarCollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  meta?: ReactNode;
}

const SidebarCollapsibleSection = ({
  title,
  icon,
  children,
  className,
  contentClassName,
  defaultOpen = true,
  meta,
}: SidebarCollapsibleSectionProps) => {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        'overflow-hidden rounded-md border border-rim bg-elevated',
        className,
      )}
    >
      <header className="h-[26px] bg-panel">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group grid h-full w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2.5 text-left transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex size-4 shrink-0 items-center justify-center text-fg-muted">
                {icon}
              </span>
              <span className="truncate font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
                {title}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {meta !== undefined && meta !== null && (
                <span className="max-w-20 truncate font-mono text-[9.5px] font-semibold text-fg-muted">
                  {meta}
                </span>
              )}
              <ChevronDown className="size-3.5 text-fg-muted transition-transform group-data-[state=open]:rotate-180" />
            </span>
          </button>
        </CollapsibleTrigger>
      </header>
      <CollapsibleContent className="overflow-hidden">
        <section
          className={cn('border-t border-rim-subtle p-3', contentClassName)}
        >
          {children}
        </section>
      </CollapsibleContent>
    </Collapsible>
  );
};

export { SidebarCollapsibleSection };
