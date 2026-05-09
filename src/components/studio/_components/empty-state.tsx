import type { ReactNode } from 'react';

interface EmptyStateProps {
  children: ReactNode;
}

const EmptyState = ({ children }: EmptyStateProps) => {
  return (
    <p className="col-span-full rounded-md border border-dashed bg-background/60 p-3.5 text-center text-sm font-bold text-muted-foreground">
      {children}
    </p>
  );
};

export { EmptyState };
