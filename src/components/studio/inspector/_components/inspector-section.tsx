import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InspectorSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  meta?: ReactNode;
}

const InspectorSection = ({
  title,
  icon,
  children,
  className,
  contentClassName,
  meta,
}: InspectorSectionProps) => {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-md border border-rim bg-elevated',
        className,
      )}
    >
      <header className="h-[26px] bg-panel">
        <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-4 shrink-0 items-center justify-center text-fg-muted">
              {icon}
            </span>
            <span className="truncate font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
              {title}
            </span>
          </span>
          {meta !== undefined && meta !== null && (
            <span className="max-w-24 truncate font-mono text-[9.5px] font-semibold text-fg-muted">
              {meta}
            </span>
          )}
        </div>
      </header>
      <section
        className={cn('border-t border-rim-subtle p-3', contentClassName)}
      >
        {children}
      </section>
    </section>
  );
};

export { InspectorSection };
