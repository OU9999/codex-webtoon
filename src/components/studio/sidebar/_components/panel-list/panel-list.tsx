import { Plus, Rows3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudioContext } from '@/components/studio/studio-context';
import { SidebarCollapsibleSection } from '../sidebar-collapsible-section';
import { PanelListItem } from './_components/panel-list-item';

const PanelList = () => {
  const { state, selectedPanel, handleAddPanel, handlePanelSelect } =
    useStudioContext();
  const meta = `${state.panels.length} cuts`;

  return (
    <SidebarCollapsibleSection
      icon={<Rows3 className="size-4" />}
      title="Panels"
      meta={meta}
      className="min-h-0"
      contentClassName="grid gap-2 p-2"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddPanel}
        className="h-7 justify-start rounded-[4px] px-2 font-mono text-[10px] font-semibold uppercase"
      >
        <Plus className="size-3.5" />
        Add cut
      </Button>
      <ol className="grid max-h-[min(42vh,360px)] content-start gap-1.5 overflow-y-auto">
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
    </SidebarCollapsibleSection>
  );
};

export { PanelList };
