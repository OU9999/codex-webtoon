import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, getAuthStatus } from '@/api/client';
import type { AuthStatus } from '../../shared/types';

interface UseAuthStatusResult {
  status: AuthStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const POLL_WHILE_PENDING_MS = 4000;

const useAuthStatus = (): UseAuthStatusResult => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = (): void => setTick((value) => value + 1);

  /**
   * Fetches /api/auth/status on mount and re-polls while OAuth is pending.
   * The polling stops as soon as state becomes ready/failed/disabled, so
   * it costs nothing once auth settles.
   */
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const next = await getAuthStatus();
        if (cancelled) return;
        setStatus(next);

        const shouldPoll = next.oauth.state === 'pending';
        if (shouldPoll) {
          timer = setTimeout(load, POLL_WHILE_PENDING_MS);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : t('auth.statusLoadFailed');
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [tick, t]);

  return { status, loading, error, refresh };
};

export { useAuthStatus };
