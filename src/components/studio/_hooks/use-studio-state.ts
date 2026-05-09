import { useEffect, useState } from 'react';
import { STORAGE_KEY } from '../_lib/constants';
import { getInitialState } from '../_lib/storage';
import type { StudioState } from '../_lib/types';

const useStudioState = () => {
  const [state, setState] = useState<StudioState>(getInitialState);

  /**
   * Persists the current studio state locally so the editor can resume after refresh.
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return [state, setState] as const;
};

export { useStudioState };
