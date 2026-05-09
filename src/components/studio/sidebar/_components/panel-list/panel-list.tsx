import { useStudioContext } from '@/components/studio/studio-context';
import { PanelListItem } from './_components/panel-list-item';

const PanelList = () => {
  const { state, selectedPanel, handlePanelSelect } = useStudioContext();

  return (
    <ol className="mt-4 grid gap-2">
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
  );
};

export { PanelList };
