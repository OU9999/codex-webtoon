import { Rows3 } from 'lucide-react';
import { useStudioContext } from '@/components/studio/studio-context';
import { SidebarCollapsibleSection } from '../sidebar-collapsible-section';
import { PanelListItem } from './_components/panel-list-item';

const PanelList = () => {
  const { state, selectedPanel, handlePanelSelect } = useStudioContext();
  const meta = `${state.panels.length} cuts`;

  return (
    <SidebarCollapsibleSection
      icon={<Rows3 className="size-4" />}
      title="Panels"
      meta={meta}
      className="min-h-0"
      contentClassName="p-0"
    >
      <ol className="grid max-h-[min(42vh,360px)] content-start gap-1.5 overflow-y-auto p-2">
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
