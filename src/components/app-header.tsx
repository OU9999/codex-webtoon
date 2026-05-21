import type { ReactNode } from 'react';

import { LanguageSwitcher } from '@/components/language-switcher';
import { HeaderLogo } from '@/components/studio/header/_components/header-logo';

interface AppHeaderProps {
  actions: ReactNode;
  actionsLabel: string;
  languagePlacement?: 'start' | 'end' | 'none';
  subtitle: string;
}

const AppHeader = ({
  actions,
  actionsLabel,
  languagePlacement = 'start',
  subtitle,
}: AppHeaderProps) => (
  <header className="z-20 flex h-auto shrink-0 flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:h-[68px] md:flex-row md:items-center md:justify-between md:px-6 md:py-0">
    <h1 className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-[linear-gradient(135deg,#112D61_0%,#2E72ED_55%,#19439D_100%)] p-px">
        <span className="grid size-full place-items-center overflow-hidden rounded-[3px] bg-white">
          <HeaderLogo className="size-full shrink-0" aria-hidden="true" />
        </span>
      </span>
      <span>
        <strong className="block text-base leading-none">
          Webtoon Panel Studio
        </strong>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </h1>
    <nav
      className="flex flex-wrap items-center gap-2"
      aria-label={actionsLabel}
    >
      {languagePlacement === 'start' && <LanguageSwitcher />}
      {actions}
      {languagePlacement === 'end' && <LanguageSwitcher />}
    </nav>
  </header>
);

export { AppHeader };
