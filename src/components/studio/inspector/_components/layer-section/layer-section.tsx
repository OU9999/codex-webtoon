import { MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { SectionTitle } from '@/components/studio/_components/section-title';
import { layerActions } from '@/components/studio/_lib/layer-actions';
import { useStudioContext } from '@/components/studio/studio-context';
import { LayerButton } from './_components/layer-button';
import { LayerRow } from './_components/layer-row';

const LayerSection = () => {
  const { handleBubbleSelect, handleLayerAdd, selectedPanel, state } =
    useStudioContext();

  if (!selectedPanel) return null;

  return (
    <>
      <SectionTitle
        icon={<MessageCircle className="size-4" />}
        title="Layers"
      />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Layer actions">
        {layerActions.map((action) => (
          <LayerButton
            key={action.type}
            action={action}
            onAdd={handleLayerAdd}
          />
        ))}
      </nav>
      <section className="mb-5 grid max-h-[200px] gap-2 overflow-y-auto pr-1">
        {selectedPanel.bubbles.length > 0 ? (
          selectedPanel.bubbles.map((bubble) => (
            <LayerRow
              key={bubble.id}
              bubble={bubble}
              isActive={bubble.id === state.selectedBubbleId}
              onSelect={handleBubbleSelect}
            />
          ))
        ) : (
          <EmptyState>No layers</EmptyState>
        )}
      </section>
    </>
  );
};

export { LayerSection };
