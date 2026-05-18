import {
  CircleAlert,
  CircleCheck,
  FolderOpen,
  Loader2,
  Save,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/app-header';
import { AuthBadge } from '@/components/auth-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStatus } from '@/hooks/use-auth-status';
import { useStudioContext } from '../studio-context';
import { ExportDialog } from './_components/export-dialog';
import type { SaveStatus } from '../_hooks/use-studio-state';

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
  const { handleProjectJsonExport, projectName, saveStatus, onBack } =
    useStudioContext();

  const badge = saveBadge(saveStatus);
  const auth = useAuthStatus();

  return (
    <AppHeader
      subtitle={projectName}
      actionsLabel="Export actions"
      actions={
        <>
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
          <ExportDialog />
        </>
      }
    />
  );
};

export { Header };
