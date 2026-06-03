import type { ReactNode } from 'react';
import { StatusBar } from './_components/status-bar';

interface ShellProps {
  children: ReactNode;
  projectPath: string;
}

const Shell = ({ children, projectPath }: ShellProps) => {
  return (
    <section className="flex h-screen flex-col bg-background text-foreground">
      <article className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </article>
      <StatusBar projectPath={projectPath} />
    </section>
  );
};

export { Shell };
