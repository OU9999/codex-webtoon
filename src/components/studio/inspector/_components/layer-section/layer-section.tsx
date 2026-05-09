import { MessageCircle } from 'lucide-react';
import { SectionTitle } from '@/components/studio/_components/section-title';
import { layerActions } from '@/components/studio/_lib/layer-actions';
import { useStudioContext } from '@/components/studio/studio-context';
import { BubbleForm } from './_components/bubble-form';
import { LayerButton } from './_components/layer-button';

const LayerSection = () => {
  const { handleLayerAdd } = useStudioContext();

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
      <BubbleForm />
    </>
  );
};

export { LayerSection };
