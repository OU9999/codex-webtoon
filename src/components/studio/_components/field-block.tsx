import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldBlockProps {
  label: string;
  children: ReactNode;
  compact?: boolean;
}

const FieldBlock = ({ label, children, compact = false }: FieldBlockProps) => {
  return (
    <section className={cn('grid gap-2', compact ? 'mb-3' : 'mb-4')}>
      <Label className="text-xs font-black text-muted-foreground">
        {label}
      </Label>
      {children}
    </section>
  );
};

export { FieldBlock };
