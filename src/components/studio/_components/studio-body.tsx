import type { ReactNode } from 'react';

interface StudioBodyProps {
  children: ReactNode;
}

const StudioBody = ({ children }: StudioBodyProps) => {
  return (
    <section className="grid min-h-[calc(100vh-68px)] grid-cols-1 lg:grid-cols-[318px_minmax(360px,1fr)] xl:grid-cols-[318px_minmax(360px,1fr)_356px]">
      {children}
    </section>
  );
};

export { StudioBody };
