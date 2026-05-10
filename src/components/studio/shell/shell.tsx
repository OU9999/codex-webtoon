import type { ReactNode } from 'react';
import { StatusBar } from './_components/status-bar';
import { TitleBar } from './_components/title-bar';

interface ShellProps {
  children: ReactNode;
}

const Shell = ({ children }: ShellProps) => {
  return (
    <section className="flex h-screen flex-col bg-background text-foreground">
      <TitleBar />
      <article className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </article>
      <StatusBar />
    </section>
  );
};

export { Shell };
