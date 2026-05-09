import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudioContext } from '../../studio-context';

const PanelActions = () => {
  const {
    handleAddPanel,
    handleDeletePanel,
    handleDuplicatePanel,
    handleMovePanelDown,
    handleMovePanelUp,
  } = useStudioContext();

  return (
    <nav className="mb-4 flex flex-wrap gap-2" aria-label="Panel actions">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddPanel}
      >
        <Plus className="size-4" />
        Add
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDuplicatePanel}
      >
        <Copy className="size-4" />
        Copy
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleMovePanelUp}
        aria-label="Move up"
      >
        <ArrowUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleMovePanelDown}
        aria-label="Move down"
      >
        <ArrowDown className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDeletePanel}
        aria-label="Delete panel"
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </nav>
  );
};

export { PanelActions };
