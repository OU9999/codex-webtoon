import { useEffect, useRef, useState } from 'react';
import type { SetStateAction } from 'react';

import { ApiClientError, saveProjectState } from '@/api/client';
import { i18n } from '@/i18n/i18n';
import type { ProjectState } from '@shared/types';
import type { StudioState, StudioStateSetter } from '../_lib/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseStudioStateOptions {
  projectName: string;
  initialState: StudioState;
}

interface HistoryEntry {
  id: number;
  label: string;
  createdAt: number;
}

interface HistoryRecord extends HistoryEntry {
  state: StudioState;
}

const SAVE_DEBOUNCE_MS = 500;
const HISTORY_LIMIT = 40;

const cloneState = (state: StudioState): StudioState => {
  return structuredClone(state) as StudioState;
};

const countBubbles = (state: StudioState): number => {
  return state.panels.reduce((sum, panel) => sum + panel.bubbles.length, 0);
};

const panelsChanged = (previous: StudioState, next: StudioState): boolean => {
  return JSON.stringify(previous.panels) !== JSON.stringify(next.panels);
};

const canvasesChanged = (previous: StudioState, next: StudioState): boolean => {
  return JSON.stringify(previous.canvases) !== JSON.stringify(next.canvases);
};

const findChangedPanelLabel = (
  previous: StudioState,
  next: StudioState,
): string | null => {
  for (const panel of next.panels) {
    const previousPanel = previous.panels.find((item) => item.id === panel.id);
    if (!previousPanel) return i18n.t('history.panelAdded');

    if (
      previousPanel.title !== panel.title ||
      previousPanel.prompt !== panel.prompt
    ) {
      return i18n.t('history.panelContentUpdated');
    }

    if (
      previousPanel.x !== panel.x ||
      previousPanel.y !== panel.y ||
      previousPanel.width !== panel.width ||
      previousPanel.height !== panel.height
    ) {
      return i18n.t('history.panelMoved');
    }

    if (previousPanel.bubbles.length !== panel.bubbles.length) {
      return previousPanel.bubbles.length < panel.bubbles.length
        ? i18n.t('history.bubbleAdded')
        : i18n.t('history.bubbleDeleted');
    }

    for (const bubble of panel.bubbles) {
      const previousBubble = previousPanel.bubbles.find(
        (item) => item.id === bubble.id,
      );
      if (!previousBubble) return i18n.t('history.bubbleAdded');

      if (previousBubble.text !== bubble.text) {
        return i18n.t('history.bubbleTextUpdated');
      }

      if (
        previousBubble.x !== bubble.x ||
        previousBubble.y !== bubble.y ||
        previousBubble.width !== bubble.width ||
        previousBubble.height !== bubble.height
      ) {
        return i18n.t('history.bubbleMoved');
      }

      if (JSON.stringify(previousBubble) !== JSON.stringify(bubble)) {
        return i18n.t('history.bubbleStyleUpdated');
      }
    }

    if (
      previousPanel.candidates.length !== panel.candidates.length ||
      previousPanel.selectedCandidateId !== panel.selectedCandidateId ||
      previousPanel.deletedCandidates.length !== panel.deletedCandidates.length
    ) {
      return i18n.t('history.imageUpdated');
    }
  }

  return null;
};

const getHistoryLabel = (previous: StudioState, next: StudioState): string => {
  if (previous.panels.length !== next.panels.length) {
    return previous.panels.length < next.panels.length
      ? i18n.t('history.panelAdded')
      : i18n.t('history.panelDeleted');
  }

  const previousBubbleCount = countBubbles(previous);
  const nextBubbleCount = countBubbles(next);
  if (previousBubbleCount !== nextBubbleCount) {
    return previousBubbleCount < nextBubbleCount
      ? i18n.t('history.bubbleAdded')
      : i18n.t('history.bubbleDeleted');
  }

  if (previous.commonPrompt !== next.commonPrompt) {
    return i18n.t('history.commonPromptUpdated');
  }

  if (
    canvasesChanged(previous, next) ||
    previous.panelGap !== next.panelGap ||
    previous.panelGapColor !== next.panelGapColor
  ) {
    return i18n.t('history.canvasUpdated');
  }

  const panelLabel = findChangedPanelLabel(previous, next);
  if (panelLabel) return panelLabel;

  if (previous.variantCount !== next.variantCount) {
    return i18n.t('history.generationUpdated');
  }

  return i18n.t('history.edit');
};

const shouldRecordHistory = (
  previous: StudioState,
  next: StudioState,
): boolean => {
  return (
    previous.commonPrompt !== next.commonPrompt ||
    canvasesChanged(previous, next) ||
    panelsChanged(previous, next) ||
    previous.panelGap !== next.panelGap ||
    previous.panelGapColor !== next.panelGapColor ||
    previous.variantCount !== next.variantCount
  );
};

const useStudioState = ({
  projectName,
  initialState,
}: UseStudioStateOptions): readonly [
  StudioState,
  StudioStateSetter,
  SaveStatus,
  HistoryEntry[],
  boolean,
  () => void,
] => {
  const [state, setStateInternal] = useState<StudioState>(initialState);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const dirtyRef = useRef(false);
  const historyIdRef = useRef(1);
  const historyRef = useRef<HistoryRecord[]>([]);
  const stateRef = useRef(initialState);
  const trackedSetStateRef = useRef<StudioStateSetter | null>(null);

  const setHistory = (history: HistoryRecord[]): void => {
    historyRef.current = history;
    setHistoryEntries(
      history.map(({ id, label, createdAt }) => ({
        id,
        label,
        createdAt,
      })),
    );
  };

  const pushHistory = (previous: StudioState, next: StudioState): void => {
    if (!shouldRecordHistory(previous, next)) return;

    const historyRecord: HistoryRecord = {
      id: historyIdRef.current,
      label: getHistoryLabel(previous, next),
      createdAt: Date.now(),
      state: cloneState(previous),
    };
    historyIdRef.current += 1;
    setHistory([historyRecord, ...historyRef.current].slice(0, HISTORY_LIMIT));
  };

  const applyState = (
    action: SetStateAction<StudioState>,
    options: { recordHistory: boolean },
  ): void => {
    const previous = stateRef.current;
    const next =
      typeof action === 'function'
        ? (action as (current: StudioState) => StudioState)(previous)
        : action;

    if (Object.is(previous, next)) return;

    if (options.recordHistory) {
      pushHistory(previous, next);
    }

    stateRef.current = next;
    setStateInternal(next);
  };

  if (!trackedSetStateRef.current) {
    const trackedSetState = ((action: SetStateAction<StudioState>): void => {
      applyState(action, { recordHistory: true });
    }) as StudioStateSetter;

    trackedSetState.transient = (action): void => {
      applyState(action, { recordHistory: false });
    };

    trackedSetState.commitHistory = (previous): void => {
      pushHistory(previous, stateRef.current);
    };

    trackedSetState.getSnapshot = (): StudioState => {
      return cloneState(stateRef.current);
    };

    trackedSetStateRef.current = trackedSetState;
  }

  const handleUndo = (): void => {
    const [record, ...rest] = historyRef.current;
    if (!record) return;

    const restoredState = cloneState(record.state);
    setHistory(rest);
    stateRef.current = restoredState;
    setStateInternal(restoredState);
  };

  /**
   * Resets the studio state when a different project is opened.
   * Without this, switching projects keeps the previous panels because the
   * useState initializer only runs on mount.
   */
  useEffect(() => {
    const nextState = cloneState(initialState);
    stateRef.current = nextState;
    setStateInternal(nextState);
    setHistory([]);
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

  return [
    state,
    trackedSetStateRef.current,
    saveStatus,
    historyEntries,
    historyEntries.length > 0,
    handleUndo,
  ] as const;
};

export { useStudioState };
export type { HistoryEntry, SaveStatus };
