import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useStudioContext } from '../../studio-context';

const PanelActions = () => {
  const { t } = useTranslation();
  const { handleDeletePanel, selectedPanel, selectedPanelIds, state } =
    useStudioContext();

  if (!selectedPanel) return null;

  const isDeleteDisabled = state.panels.length <= selectedPanelIds.length;

  return (
    <nav
      className="mt-3 border-t border-rim-subtle pt-3"
      aria-label={t('sidebar.panelActions.ariaLabel')}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isDeleteDisabled}
        onClick={handleDeletePanel}
        className="h-7 w-full justify-start rounded-[4px] px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
        {t('sidebar.panelActions.deleteSelected')}
      </Button>
    </nav>
  );
};

export { PanelActions };
