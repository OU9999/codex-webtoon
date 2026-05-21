import {
  CircleAlert,
  CircleCheck,
  FolderOpen,
  Loader2,
  Save,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/app-header';
import { AuthBadge } from '@/components/auth-badge';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStatus } from '@/hooks/use-auth-status';
import { useStudioContext } from '../studio-context';
import { ExportDialog } from './_components/export-dialog';
import type { SaveStatus } from '../_hooks/use-studio-state';

interface SaveBadgeContent {
  icon: ReactNode;
  labelKey: string;
}

const HEADER_ACTION_CLASS_NAME =
  'h-[30px] rounded-[4px] border-rim bg-elevated px-2.5 font-mono text-[10px] font-semibold text-fg-secondary uppercase hover:border-rim-strong hover:bg-hover hover:text-foreground';

const saveBadge = (status: SaveStatus): SaveBadgeContent | null => {
  if (status === 'saving') {
    return {
      icon: <Loader2 className="size-3.5 animate-spin" />,
      labelKey: 'header.saving',
    };
  }
  if (status === 'saved') {
    return {
      icon: <CircleCheck className="size-3.5" />,
      labelKey: 'header.saved',
    };
  }
  if (status === 'error') {
    return {
      icon: <CircleAlert className="size-3.5" />,
      labelKey: 'header.saveError',
    };
  }
  return null;
};

const Header = () => {
  const { t } = useTranslation();
  const { handleProjectJsonExport, projectName, saveStatus, onBack } =
    useStudioContext();

  const badge = saveBadge(saveStatus);
  const auth = useAuthStatus();

  return (
    <AppHeader
      subtitle={projectName}
      actionsLabel={t('header.actionsLabel')}
      languagePlacement="none"
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            className={HEADER_ACTION_CLASS_NAME}
            onClick={onBack}
          >
            <FolderOpen className="size-3.5" />
            {t('header.backToProjects')}
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
              className="h-[30px] gap-1.5 rounded-[4px] border-rim bg-elevated px-2.5 font-mono text-[10px] font-semibold text-fg-secondary"
            >
              {badge.icon}
              {t(badge.labelKey)}
            </Badge>
          )}
          <LanguageSwitcher />
          <Button
            type="button"
            variant="outline"
            className={HEADER_ACTION_CLASS_NAME}
            onClick={handleProjectJsonExport}
          >
            <Save className="size-3.5" />
            {t('header.exportJson')}
          </Button>
          <ExportDialog />
        </>
      }
    />
  );
};

export { Header };
