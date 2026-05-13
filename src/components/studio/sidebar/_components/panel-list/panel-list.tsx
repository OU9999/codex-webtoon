import { useStudioContext } from '@/components/studio/studio-context';
import { PanelListItem } from './_components/panel-list-item';

const PanelList = () => {
  const { state, selectedPanel, handlePanelSelect } = useStudioContext();

  return (
    <section className="flex min-h-24 flex-1 flex-col overflow-hidden rounded-md border border-rim bg-elevated">
      <header className="flex h-[26px] items-center justify-between gap-2 bg-panel px-2.5 font-mono text-[9.5px] font-black tracking-[0.08em] text-fg-muted uppercase">
        <span>Panels</span>
        <span>{state.panels.length} cuts</span>
      </header>
      <ol className="grid min-h-0 flex-1 content-start gap-1.5 overflow-y-auto border-t border-rim-subtle p-2">
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
