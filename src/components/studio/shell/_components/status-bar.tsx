import { useTranslation } from 'react-i18next';
import { useServerHealth } from '@/hooks/use-server-health';
import { useStudioContext } from '../../studio-context';

interface StatusBarProps {
  projectPath: string;
}

const StatusBar = ({ projectPath }: StatusBarProps) => {
  const { t } = useTranslation();
  const { isGenerating } = useStudioContext();
  const { health } = useServerHealth();
  const generationQueueCount = isGenerating ? 1 : 0;

  return (
    <footer className="flex h-[22px] flex-shrink-0 items-center gap-[14px] border-t border-rim bg-elevated px-3 font-mono text-[10.5px] text-fg-muted">
      <span className="inline-flex items-center gap-[6px]">
        <span className="size-[6px] rounded-full bg-status-green" />
        {t('common.connected')}
      </span>
      <span className="min-w-0 truncate" title={projectPath}>
        {t('common.local')} · {projectPath}
      </span>
      <span className="flex-1" />
      {generationQueueCount > 0 && (
        <>
          <span>{t('statusBar.queue', { count: generationQueueCount })}</span>
          {health && <span aria-hidden="true">·</span>}
        </>
      )}
      {health && <span>v{health.version}</span>}
    </footer>
  );
};

export { StatusBar };
