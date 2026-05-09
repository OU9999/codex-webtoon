import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  icon: ReactNode;
  title: string;
  className?: string;
}

const SectionTitle = ({ icon, title, className }: SectionTitleProps) => {
  return (
    <header
      className={cn(
        'mt-1 mb-3 flex items-center gap-2 text-foreground',
        className,
      )}
    >
      {icon}
      <h2 className="m-0 text-xs font-black uppercase">{title}</h2>
    </header>
  );
};

export { SectionTitle };
