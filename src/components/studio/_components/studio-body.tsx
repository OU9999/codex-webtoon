import type { ReactNode } from 'react';

interface StudioBodyProps {
  children: ReactNode;
}

const StudioBody = ({ children }: StudioBodyProps) => {
  return (
    <section className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[318px_minmax(360px,1fr)] xl:grid-cols-[318px_minmax(360px,1fr)_356px]">
      {children}
    </section>
  );
};

export { StudioBody };
