import { Content } from './content/content';
import { Header } from './header/header';
import { Inspector } from './inspector/inspector';
import { Shell } from './shell/shell';
import { Sidebar } from './sidebar/sidebar';
import { StudioBody } from './_components/studio-body';
import { StudioProvider } from './studio-context';

const Studio = () => {
  return (
    <StudioProvider>
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
