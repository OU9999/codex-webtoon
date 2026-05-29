import { Content } from './content/content';
import { Header } from './header/header';
import { Inspector } from './inspector/inspector';
import { Shell } from './shell/shell';
import { Sidebar } from './sidebar/sidebar';
import { StudioBody } from './_components/studio-body';
import { StudioProvider } from './studio-context';
import type { StudioState } from './_lib/types';

interface StudioProps {
  projectName: string;
  initialState: StudioState;
  onBack: () => void;
  onProjectRename: (name: string) => void;
}

const Studio = ({
  projectName,
  initialState,
  onBack,
  onProjectRename,
}: StudioProps) => {
  return (
    <StudioProvider
      projectName={projectName}
      initialState={initialState}
      onBack={onBack}
      onProjectRename={onProjectRename}
    >
      <Shell>
        <Header />
        <StudioBody>
          <Sidebar />
          <Content />
          <Inspector />
        </StudioBody>
      </Shell>
    </StudioProvider>
  );
};

export { Studio };
