import { useStudioContext } from '@/components/studio/studio-context';
import { PanelListItem } from './_components/panel-list-item';

const PanelList = () => {
  const { state, selectedPanel, handlePanelSelect } = useStudioContext();

  return (
    <section className="min-h-24 flex-1 overscroll-contain overflow-y-auto pt-2">
      <ol className="grid gap-2">
        {state.panels.map((panel, index) => (
          <PanelListItem
            key={panel.id}
            panel={panel}
            index={index}
            isActive={panel.id === selectedPanel?.id}
            onSelect={handlePanelSelect}
          />
        ))}
      </ol>
    </section>
  );
};

export { PanelList };
