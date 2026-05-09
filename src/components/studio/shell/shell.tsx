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
      <article className="min-h-0 flex-1 overflow-auto">{children}</article>
      <StatusBar />
    </section>
  );
};

export { Shell };
