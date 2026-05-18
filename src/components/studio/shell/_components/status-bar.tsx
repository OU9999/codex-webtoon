import { useTranslation } from 'react-i18next';

const StatusBar = () => {
  const { t } = useTranslation();

  return (
    <footer className="flex h-[22px] flex-shrink-0 items-center gap-[14px] border-t border-rim bg-elevated px-3 font-mono text-[10.5px] text-fg-muted">
      <span className="inline-flex items-center gap-[6px]">
        <span className="size-[6px] rounded-full bg-status-green" />
        {t('common.connected')}
      </span>
      <span>local · /Users/jisu/projects/rainy_chase</span>
      <span className="flex-1" />
      <span>{t('statusBar.tokensUsed', { count: '12,847' })}</span>
      <span aria-hidden="true">·</span>
      <span>{t('statusBar.queue', { count: 1 })}</span>
      <span aria-hidden="true">·</span>
      <span>v0.3.2</span>
    </footer>
  );
};

export { StatusBar };
