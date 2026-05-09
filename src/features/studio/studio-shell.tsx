import type { ReactNode } from 'react';
import { StatusBar } from './components/status-bar';
import { TitleBar } from './components/title-bar';

interface StudioShellProps {
  children: ReactNode;
}

const StudioShell = ({ children }: StudioShellProps) => {
  return (
    <section className="flex h-screen flex-col bg-background text-foreground">
      <TitleBar />
      <article className="min-h-0 flex-1 overflow-auto">{children}</article>
      <StatusBar />
    </section>
  );
};

export { StudioShell };
