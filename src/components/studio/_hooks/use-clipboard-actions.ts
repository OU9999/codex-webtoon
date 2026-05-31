import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createClipboardItem,
  pasteClipboardItem,
} from '../_lib/clipboard-actions';
import type { StudioClipboardItem } from '../_lib/clipboard-actions';
import {
  getSelectedBubbleIds,
  getSelectedPanelIds,
} from '../_lib/selection-state';
import type { StudioState, StudioStateSetter } from '../_lib/types';

const useClipboardActions = (
  state: StudioState,
  setState: StudioStateSetter,
) => {
  const { t } = useTranslation();
  const [clipboardItem, setClipboardItem] =
    useState<StudioClipboardItem | null>(null);

  const handleSelectionCopy = (): void => {
    const item = createClipboardItem(state);
    if (!item) return;

    setClipboardItem(item);
  };

  const handleClipboardPaste = (): void => {
    if (!clipboardItem) return;

    setState((current) =>
      pasteClipboardItem(current, clipboardItem, {
        getPanelCopyTitle: (title) => t('defaults.copyTitle', { title }),
      }),
    );
  };

  return {
    clipboardPasteEnabled: clipboardItem !== null,
    handleClipboardPaste,
    handleSelectionCopy,
    selectionCopyEnabled:
      getSelectedBubbleIds(state).length > 0 ||
      getSelectedPanelIds(state).length > 0,
  };
};

export { useClipboardActions };
