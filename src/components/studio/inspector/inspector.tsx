import { useStudioContext } from '../studio-context';
import { CandidateGrid } from './_components/candidate-grid/candidate-grid';
import { BubbleForm } from './_components/layer-section/_components/bubble-form';
import { LayerSection } from './_components/layer-section/layer-section';
import { PanelForm } from './_components/panel-form';
import { ReferenceImageSection } from './_components/reference-image-section';

const Inspector = () => {
  const { selectedBubble, selectedBubblePanel, selectedPanel } =
    useStudioContext();

  return (
    <aside className="grid min-h-0 auto-rows-max content-start gap-2 overflow-y-auto overscroll-contain border-t bg-card/85 p-3 lg:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l xl:p-4">
      {selectedBubblePanel && selectedBubble && <BubbleForm />}
      {selectedPanel && !selectedBubble && (
        <>
          <PanelForm />
          <ReferenceImageSection />
          <CandidateGrid />
          <LayerSection />
        </>
      )}
    </aside>
  );
};

export { Inspector };
