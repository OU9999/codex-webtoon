import { MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { useStudioContext } from '@/components/studio/studio-context';
import { InspectorSection } from '../inspector-section';
import { LayerRow } from './_components/layer-row';

const LayerSection = () => {
  const { handleBubbleSelect, selectedPanel, state } = useStudioContext();

  if (!selectedPanel) return null;

  const meta = `${selectedPanel.bubbles.length} layers`;

  return (
    <InspectorSection
      icon={<MessageCircle className="size-4" />}
      title="Layers"
      meta={meta}
      contentClassName="p-2"
    >
      <section className="grid max-h-[200px] gap-2 overflow-y-auto pr-1">
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
    </InspectorSection>
  );
};

export { LayerSection };
