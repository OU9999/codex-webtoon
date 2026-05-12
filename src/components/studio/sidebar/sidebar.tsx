import { PanelList } from './_components/panel-list/panel-list';
import { BubbleActions } from './_components/bubble-actions';
import { HistorySection } from './_components/history-section';
import { ProjectSection } from './_components/project-section';

const Sidebar = () => {
  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto border-b bg-card/85 p-3 lg:border-r lg:border-b-0 xl:p-4">
      <ProjectSection />
      <BubbleActions />
      <HistorySection />
      <PanelList />
    </aside>
  );
};

export { Sidebar };
