import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CircleAlert,
  CircleCheck,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuthStatus } from '../../shared/types';

interface AuthBadgeProps {
  status: AuthStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

interface BadgeContent {
  icon: typeof KeyRound;
  label: string;
  tone: 'ready' | 'warn' | 'idle';
}

const pickContent = (status: AuthStatus | null): BadgeContent => {
  if (!status) {
    return { icon: Loader2, label: 'auth.badgeChecking', tone: 'idle' };
  }
  if (status.recommendedProvider === 'oauth') {
    return { icon: ShieldCheck, label: 'auth.oauth', tone: 'ready' };
  }
  if (status.recommendedProvider === 'openai') {
    return { icon: KeyRound, label: 'auth.apiKey', tone: 'ready' };
  }
  if (status.oauth.state === 'pending') {
    return { icon: Loader2, label: 'auth.oauthPreparing', tone: 'idle' };
  }
  if (status.oauth.state === 'failed') {
    return { icon: CircleAlert, label: 'auth.oauthFailed', tone: 'warn' };
  }
  return { icon: ShieldOff, label: 'auth.required', tone: 'warn' };
};

const tonePalette: Record<BadgeContent['tone'], string> = {
  ready: 'border-status-green/40 bg-status-green/10 text-status-green',
  warn: 'border-status-yellow/50 bg-status-yellow/10 text-status-yellow',
  idle: 'border-rim bg-elevated text-fg-muted',
};

const AuthBadge = ({ status, loading, error, onRefresh }: AuthBadgeProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const content = pickContent(status);
  const Icon = content.icon;
  const animate = content.icon === Loader2;

  const handleToggle = (): void => setOpen((value) => !value);

  return (
    <div className="relative">
      <Badge
        variant="outline"
        className={cn(
          'h-[30px] cursor-pointer gap-1.5 rounded-[4px] px-2.5 font-mono text-[10px] font-semibold transition-colors hover:border-rim-strong hover:bg-hover hover:text-foreground',
          tonePalette[content.tone],
        )}
        onClick={handleToggle}
      >
        <Icon className={cn('size-3.5', animate && 'animate-spin')} />
        <span>{t(content.label)}</span>
      </Badge>
      {open && (
        <aside className="absolute top-10 right-0 z-30 w-80 space-y-3 rounded-md border border-slate-700 bg-slate-900 p-4 text-xs text-slate-200 shadow-xl">
          <header className="flex items-center justify-between">
            <strong className="text-sm">{t('auth.status')}</strong>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={cn('size-3.5', loading && 'animate-spin')}
              />
              {t('auth.refresh')}
            </Button>
          </header>
          {error && (
            <p className="rounded border border-red-900 bg-red-950/40 px-2 py-1 text-red-300">
              {error}
            </p>
          )}
          {status && (
            <dl className="space-y-1 leading-relaxed">
              <Row label={t('auth.oauth')} value={status.oauth.state} />
              <Row
                label={t('auth.codex')}
                value={
                  status.codex.authed
                    ? t('auth.authed')
                    : status.codex.probe === 'missing'
                      ? t('auth.cliMissing')
                      : t('auth.unauthed')
                }
              />
              <Row
                label={t('auth.apiKey')}
                value={
                  status.apiKey.available
                    ? t('auth.apiKeyAvailable')
                    : t('auth.apiKeyMissing')
                }
              />
            </dl>
          )}
          {status && !status.recommendedProvider && (
            <div className="space-y-1.5 rounded border border-amber-700/40 bg-amber-950/30 p-2">
              <p className="font-medium text-amber-200">
                {status.codex.probe === 'missing'
                  ? t('auth.installCodex')
                  : t('auth.loginRequired')}
              </p>
              <code className="block rounded bg-slate-950/50 px-2 py-1 font-mono text-[11px] text-slate-300">
                {status.codex.probe === 'missing'
                  ? 'npm i -g @openai/codex'
                  : status.loginCommand}
              </code>
              <p className="text-slate-400">{t('auth.setEnv')}</p>
            </div>
          )}
          {status?.oauth.lastError && status.oauth.state !== 'ready' && (
            <p className="rounded border border-amber-700/40 bg-amber-950/20 px-2 py-1 text-[11px] text-amber-200">
              {status.oauth.lastError}
            </p>
          )}
        </aside>
      )}
    </div>
  );
};

interface RowProps {
  label: string;
  value: string;
  hint?: string | null;
}

const Row = ({ label, value, hint }: RowProps) => (
  <section className="flex items-baseline justify-between gap-2">
    <dt className="text-slate-500">{label}</dt>
    <dd className="flex flex-col items-end">
      <span className="font-medium text-slate-100">{value}</span>
      {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
    </dd>
  </section>
);

export { AuthBadge };
