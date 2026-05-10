import { useState } from 'react';
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
    return { icon: Loader2, label: '인증 확인 중', tone: 'idle' };
  }
  if (status.recommendedProvider === 'oauth') {
    return { icon: ShieldCheck, label: 'OAuth', tone: 'ready' };
  }
  if (status.recommendedProvider === 'openai') {
    return { icon: KeyRound, label: 'API Key', tone: 'ready' };
  }
  if (status.oauth.state === 'pending') {
    return { icon: Loader2, label: 'OAuth 준비 중', tone: 'idle' };
  }
  if (status.oauth.state === 'failed') {
    return { icon: CircleAlert, label: 'OAuth 실패', tone: 'warn' };
  }
  return { icon: ShieldOff, label: '인증 필요', tone: 'warn' };
};

const tonePalette: Record<BadgeContent['tone'], string> = {
  ready: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  idle: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
};

const AuthBadge = ({ status, loading, error, onRefresh }: AuthBadgeProps) => {
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
          'h-8 cursor-pointer gap-1.5 rounded-full px-3',
          tonePalette[content.tone],
        )}
        onClick={handleToggle}
      >
        <Icon className={cn('size-3.5', animate && 'animate-spin')} />
        <span className="text-xs">{content.label}</span>
      </Badge>
      {open && (
        <aside className="absolute right-0 top-10 z-30 w-80 space-y-3 rounded-md border border-slate-700 bg-slate-900 p-4 text-xs text-slate-200 shadow-xl">
          <header className="flex items-center justify-between">
            <strong className="text-sm">인증 상태</strong>
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
              새로고침
            </Button>
          </header>
          {error && (
            <p className="rounded border border-red-900 bg-red-950/40 px-2 py-1 text-red-300">
              {error}
            </p>
          )}
          {status && (
            <dl className="space-y-1 leading-relaxed">
              <Row
                label="OAuth"
                value={status.oauth.state}
                hint={status.oauth.url}
              />
              <Row
                label="Codex"
                value={
                  status.codex.authed
                    ? 'authed'
                    : status.codex.probe === 'missing'
                      ? 'CLI 없음'
                      : 'unauthed'
                }
              />
              <Row
                label="API Key"
                value={status.apiKey.available ? '사용 가능' : '없음'}
              />
            </dl>
          )}
          {status && !status.recommendedProvider && (
            <div className="space-y-1.5 rounded border border-amber-700/40 bg-amber-950/30 p-2">
              <p className="font-medium text-amber-200">
                {status.codex.probe === 'missing'
                  ? 'Codex CLI를 먼저 설치하세요.'
                  : 'Codex 인증이 필요합니다.'}
              </p>
              <code className="block rounded bg-slate-950/50 px-2 py-1 font-mono text-[11px] text-slate-300">
                {status.codex.probe === 'missing'
                  ? 'npm i -g @openai/codex'
                  : status.loginCommand}
              </code>
              <p className="text-slate-400">
                또는 <code className="rounded bg-slate-950/50 px-1">OPENAI_API_KEY</code>{' '}
                환경 변수를 설정하세요.
              </p>
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
      {hint && (
        <span className="text-[10px] text-slate-500">{hint}</span>
      )}
    </dd>
  </section>
);

export { AuthBadge };
