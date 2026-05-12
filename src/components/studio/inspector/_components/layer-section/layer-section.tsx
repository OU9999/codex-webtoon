import { MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { SectionTitle } from '@/components/studio/_components/section-title';
import { useStudioContext } from '@/components/studio/studio-context';
import { LayerRow } from './_components/layer-row';

const LayerSection = () => {
  const { handleBubbleSelect, selectedPanel, state } = useStudioContext();

  if (!selectedPanel) return null;

  return (
    <>
      <SectionTitle
        icon={<MessageCircle className="size-4" />}
        title="Layers"
      />
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
