import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLayerActionPatch, layerActions } from '../../_lib/layer-actions';
import type { BubbleType, LayerAction } from '../../_lib/types';
import { useStudioContext } from '../../studio-context';
import { SidebarCollapsibleSection } from './sidebar-collapsible-section';

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
    onAdd(action.type, getLayerActionPatch(action));
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={handleAdd}
      className="h-7 justify-start rounded-[4px] px-2 font-mono text-[10px] font-semibold uppercase"
    >
      {action.icon}
      <span>+ {action.label}</span>
    </Button>
  );
};

const BubbleActions = () => {
  const { handleLayerAdd, selectedCanvasPanels, selectedPanel } =
    useStudioContext();
  const isDisabled = selectedCanvasPanels.length === 0;
  const layerCount = selectedPanel
    ? selectedPanel.bubbles.length
    : selectedCanvasPanels.reduce(
        (count, panel) => count + panel.bubbles.length,
        0,
      );
  const meta = `${layerCount} layers`;

  return (
    <SidebarCollapsibleSection
      icon={<MessageCircle className="size-4" />}
      title="Balloons"
      meta={meta}
    >
      <header className="mb-2 flex items-center justify-between gap-3 font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
        <span>Layer tools</span>
        <span>{isDisabled ? 'No cuts' : 'Ready'}</span>
      </header>
      <nav className="grid grid-cols-2 gap-2" aria-label="Balloon actions">
        {layerActions.map((action) => (
          <BubbleActionButton
            key={action.id}
            action={action}
            disabled={isDisabled}
            onAdd={handleLayerAdd}
          />
        ))}
      </nav>
    </SidebarCollapsibleSection>
  );
};

export { BubbleActions };
