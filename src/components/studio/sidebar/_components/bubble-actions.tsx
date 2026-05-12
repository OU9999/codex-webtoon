import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '../../_components/section-title';
import { layerActions } from '../../_lib/layer-actions';
import type { BubbleType, LayerAction } from '../../_lib/types';
import { useStudioContext } from '../../studio-context';

interface BubbleActionButtonProps {
  action: LayerAction;
  disabled: boolean;
  onAdd: (type: BubbleType, patch?: LayerAction['patch']) => void;
}

const BubbleActionButton = ({
  action,
  disabled,
  onAdd,
}: BubbleActionButtonProps) => {
  const handleAdd = (): void => {
    onAdd(action.type, action.patch);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={handleAdd}
      className="justify-start px-2 text-xs"
    >
      {action.icon}
      <span>+ {action.label}</span>
    </Button>
  );
};

const BubbleActions = () => {
  const { handleLayerAdd, state } = useStudioContext();
  const isDisabled = state.panels.length === 0;

  return (
    <section className="mb-4 border-y py-3">
      <SectionTitle
        icon={<MessageCircle className="size-4" />}
        title="Balloons"
        className="mt-0 mb-2"
      />
      <nav className="grid grid-cols-2 gap-2" aria-label="Balloon actions">
        {layerActions.map((action) => (
          <BubbleActionButton
            key={`${action.type}-${action.label}`}
            action={action}
            disabled={isDisabled}
            onAdd={handleLayerAdd}
          />
        ))}
      </nav>
    </section>
  );
};

export { BubbleActions };
