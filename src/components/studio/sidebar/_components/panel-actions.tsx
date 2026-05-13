import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudioContext } from '../../studio-context';

const PanelActions = () => {
  const { handleDeletePanel, selectedPanel, state } = useStudioContext();

  if (!selectedPanel) return null;

  const isDeleteDisabled = state.panels.length <= 1;

  return (
    <nav
      className="mt-3 border-t border-rim-subtle pt-3"
      aria-label="Panel actions"
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
        Delete selected cut
      </Button>
    </nav>
  );
};

export { PanelActions };
