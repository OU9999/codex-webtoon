import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { ApiClientError, saveProjectState } from '@/api/client';
import type { ProjectState } from '@shared/types';
import type { StudioState } from '../_lib/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseStudioStateOptions {
  projectName: string;
  initialState: StudioState;
}

const SAVE_DEBOUNCE_MS = 500;

const useStudioState = ({
  projectName,
  initialState,
}: UseStudioStateOptions): readonly [
  StudioState,
  Dispatch<SetStateAction<StudioState>>,
  SaveStatus,
] => {
  const [state, setState] = useState<StudioState>(initialState);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const dirtyRef = useRef(false);

  /**
   * Resets the studio state when a different project is opened.
   * Without this, switching projects keeps the previous panels because the
   * useState initializer only runs on mount.
   */
  useEffect(() => {
    setState(initialState);
    dirtyRef.current = false;
    setSaveStatus('idle');
  }, [projectName, initialState]);

  /**
   * Persists the current studio state to the server with a 500ms debounce.
   * Skips the very first render after a project load by checking dirtyRef,
   * which is set on subsequent setState calls.
   */
  useEffect(() => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      return;
    }

    setSaveStatus('saving');
    const handle = setTimeout(() => {
      void saveProjectState(projectName, state as unknown as ProjectState)
        .then(() => setSaveStatus('saved'))
        .catch((err: unknown) => {
          setSaveStatus('error');
          if (err instanceof ApiClientError) {
            console.error('[wps] failed to save project state:', err.message);
          } else {
            console.error('[wps] failed to save project state:', err);
          }
        });
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [state, projectName]);

  return [state, setState, saveStatus] as const;
};

export { useStudioState };
export type { SaveStatus };
