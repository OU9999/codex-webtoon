import { Bot, Download, PanelTop, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudioContext } from '../studio-context';

const Header = () => {
  const { handleProjectJsonExport, handleWebtoonPngExport, isExporting } =
    useStudioContext();

  return (
    <header className="sticky top-0 z-20 flex h-auto flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:h-[68px] md:flex-row md:items-center md:justify-between md:px-6 md:py-0">
      <h1 className="flex items-center gap-3">
        <PanelTop className="size-6 text-primary" />
        <span>
          <strong className="block text-base leading-none">
            Webtoon Panel Studio
          </strong>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Local MVP
          </span>
        </span>
      </h1>
      <nav
        className="flex flex-wrap items-center gap-2"
        aria-label="Export actions"
      >
        <Badge variant="secondary" className="h-8 rounded-full px-3">
          <Bot className="size-4" />
          Local mock
        </Badge>
        <Button
          type="button"
          variant="outline"
          onClick={handleProjectJsonExport}
        >
          <Save className="size-4" />
          JSON
        </Button>
        <Button
          type="button"
          onClick={handleWebtoonPngExport}
          disabled={isExporting}
        >
          <Download className="size-4" />
          {isExporting ? 'Exporting' : 'PNG'}
        </Button>
      </nav>
    </header>
  );
};

export { Header };
