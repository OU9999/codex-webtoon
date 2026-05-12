import { useStudioContext } from '../studio-context';
import { CandidateGrid } from './_components/candidate-grid/candidate-grid';
import { BubbleForm } from './_components/layer-section/_components/bubble-form';
import { LayerSection } from './_components/layer-section/layer-section';
import { PanelForm } from './_components/panel-form';

const Inspector = () => {
  const { selectedBubble, selectedBubblePanel, selectedPanel } =
    useStudioContext();

  return (
    <aside className="min-h-0 overflow-y-auto overscroll-contain border-t bg-card/85 p-4 lg:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l xl:p-[18px]">
      {selectedBubblePanel && selectedBubble && <BubbleForm />}
      {selectedPanel && !selectedBubble && (
        <section className="grid gap-1 md:grid-cols-2 md:gap-x-5 xl:block">
          <PanelForm />
          <CandidateGrid />
          <LayerSection />
        </section>
      )}
    </aside>
  );
};

export { Inspector };
