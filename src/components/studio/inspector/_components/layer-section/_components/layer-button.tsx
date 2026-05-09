import { Button } from '@/components/ui/button';
import type { BubbleType, LayerAction } from '@/components/studio/_lib/types';

interface LayerButtonProps {
  action: LayerAction;
  onAdd: (type: BubbleType) => void;
}

const LayerButton = ({ action, onAdd }: LayerButtonProps) => {
  const handleAdd = (): void => {
    onAdd(action.type);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
      {action.icon}
      {action.label}
    </Button>
  );
};

export { LayerButton };
