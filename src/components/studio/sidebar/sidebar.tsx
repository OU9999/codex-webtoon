import { PanelList } from './_components/panel-list/panel-list';
import { BubbleActions } from './_components/bubble-actions';
import { HistorySection } from './_components/history-section';
import { ProjectSection } from './_components/project-section';

const Sidebar = () => {
  return (
    <aside className="grid min-h-0 auto-rows-max content-start gap-2 overflow-y-auto overscroll-contain border-b bg-card/85 p-3 lg:border-r lg:border-b-0 xl:p-4">
      <ProjectSection />
      <PanelList />
      <BubbleActions />
      <HistorySection />
    </aside>
  );
};

export { Sidebar };
