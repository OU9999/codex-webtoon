import { useEffect, useState } from 'react';
import { ApiClientError, getHealth } from '@/api/client';
import type { HealthResponse } from '@shared/types';

interface UseServerHealthResult {
  health: HealthResponse | null;
  error: string | null;
}

const useServerHealth = (): UseServerHealthResult => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches server metadata once so UI chrome can show the real app version
   * instead of a hardcoded placeholder.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const next = await getHealth();
        if (cancelled) return;
        setHealth(next);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load server metadata.';
        setError(message);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { health, error };
};

export { useServerHealth };
