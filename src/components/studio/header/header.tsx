import {
  CircleAlert,
  CircleCheck,
  Download,
  FolderOpen,
  Loader2,
  Save,
  Sparkles,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AuthBadge } from '@/components/auth-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStatus } from '@/hooks/use-auth-status';
import { useStudioContext } from '../studio-context';
import type { SaveStatus } from '../_hooks/use-studio-state';
import { HeaderLogo } from './_components/header-logo';

interface SaveBadgeContent {
  icon: ReactNode;
  label: string;
}

const saveBadge = (status: SaveStatus): SaveBadgeContent | null => {
  if (status === 'saving') {
    return {
      icon: <Loader2 className="size-3.5 animate-spin" />,
      label: '저장 중',
    };
  }
  if (status === 'saved') {
    return { icon: <CircleCheck className="size-3.5" />, label: '저장됨' };
  }
  if (status === 'error') {
    return { icon: <CircleAlert className="size-3.5" />, label: '저장 실패' };
  }
  return null;
};

const Header = () => {
  const {
    handleGenerateSelectedPanel,
    handleProjectJsonExport,
    handleWebtoonPngExport,
    isExporting,
    isGenerating,
    projectName,
    saveStatus,
    selectedPanel,
    onBack,
  } = useStudioContext();

  const badge = saveBadge(saveStatus);
  const auth = useAuthStatus();
  const generateDisabled = !selectedPanel || isGenerating;

  return (
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
            {projectName}
          </span>
        </span>
      </h1>
      <nav
        className="flex flex-wrap items-center gap-2"
        aria-label="Export actions"
      >
        <Button type="button" variant="outline" onClick={onBack}>
          <FolderOpen className="size-4" />
          프로젝트
        </Button>
        <AuthBadge
          status={auth.status}
          loading={auth.loading}
          error={auth.error}
          onRefresh={auth.refresh}
        />
        {badge && (
          <Badge
            variant="outline"
            className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground"
          >
            {badge.icon}
            {badge.label}
          </Badge>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleProjectJsonExport}
        >
          <Save className="size-4" />
          JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleWebtoonPngExport}
          disabled={isExporting}
        >
          <Download className="size-4" />
          {isExporting ? 'Exporting' : 'PNG'}
        </Button>
        <Button
          type="button"
          onClick={handleGenerateSelectedPanel}
          disabled={generateDisabled}
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isGenerating ? 'Generating' : 'Generate'}
        </Button>
      </nav>
    </header>
  );
};

export { Header };
