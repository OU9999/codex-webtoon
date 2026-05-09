import { PanelList } from './_components/panel-list/panel-list';
import { ProjectSection } from './_components/project-section';

const Sidebar = () => {
  return (
    <aside className="border-b bg-card/85 p-4 lg:border-r lg:border-b-0 xl:p-[18px]">
      <ProjectSection />
      <PanelList />
    </aside>
  );
};

export { Sidebar };
