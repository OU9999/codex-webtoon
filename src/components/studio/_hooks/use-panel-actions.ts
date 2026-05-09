import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { createPanel } from '../_lib/factories';
import type { Panel, StudioState } from '../_lib/types';

const usePanelActions = (
  state: StudioState,
  setState: Dispatch<SetStateAction<StudioState>>,
) => {
  const patchSelectedPanel = (patch: Partial<Panel>): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) =>
        panel.id === current.selectedPanelId ? { ...panel, ...patch } : panel,
      ),
    }));
  };

  const moveSelectedPanel = (direction: number): void => {
    setState((current) => {
      const index = current.panels.findIndex(
        (panel) => panel.id === current.selectedPanelId,
      );
      const target = index + direction;
      if (index < 0) return current;
      if (target < 0) return current;
      if (target >= current.panels.length) return current;

      const panels = [...current.panels];
      const [panel] = panels.splice(index, 1);
      if (!panel) return current;

      panels.splice(target, 0, panel);
      return { ...current, panels };
    });
  };

  const handleCommonPromptChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    const commonPrompt = event.target.value;
    setState((current) => ({ ...current, commonPrompt }));
  };

  const handleAddPanel = (): void => {
    const panel = createPanel({
      title: `Panel ${state.panels.length + 1}`,
      height: 420,
    });

    setState((current) => {
      const selectedIndex = current.panels.findIndex(
        (item) => item.id === current.selectedPanelId,
      );
      const insertAt =
        selectedIndex >= 0 ? selectedIndex + 1 : current.panels.length;
      const panels = [...current.panels];
      panels.splice(insertAt, 0, panel);

      return {
        ...current,
        panels,
        selectedPanelId: panel.id,
        selectedBubbleId: null,
      };
    });
  };

  const handleDuplicatePanel = (): void => {
    setState((current) => {
      const selected = current.panels.find(
        (item) => item.id === current.selectedPanelId,
      );
      if (!selected) return current;

      const duplicate = createPanel({
        title: `${selected.title} copy`,
        height: selected.height,
        prompt: selected.prompt,
        candidates: selected.candidates,
        selectedCandidateId: selected.selectedCandidateId,
        bubbles: selected.bubbles.map((bubble) => ({
          ...bubble,
          id: crypto.randomUUID(),
        })),
      });

      const selectedIndex = current.panels.findIndex(
        (item) => item.id === current.selectedPanelId,
      );
      const panels = [...current.panels];
      panels.splice(selectedIndex + 1, 0, duplicate);

      return {
        ...current,
        panels,
        selectedPanelId: duplicate.id,
        selectedBubbleId: null,
      };
    });
  };

  const handleDeletePanel = (): void => {
    if (state.panels.length <= 1) return;

    setState((current) => {
      const index = current.panels.findIndex(
        (panel) => panel.id === current.selectedPanelId,
      );
      const panels = current.panels.filter(
        (panel) => panel.id !== current.selectedPanelId,
      );
      const nextPanel = panels[Math.min(index, panels.length - 1)];
      if (!nextPanel) return current;

      return {
        ...current,
        panels,
        selectedPanelId: nextPanel.id,
        selectedBubbleId: null,
      };
    });
  };

  const handleMovePanelUp = (): void => moveSelectedPanel(-1);
  const handleMovePanelDown = (): void => moveSelectedPanel(1);

  const handlePanelGapChange = (value: number[]): void => {
    const panelGap = value[0];
    if (typeof panelGap !== 'number') return;

    setState((current) => ({ ...current, panelGap }));
  };

  const handlePanelSelect = (panelId: string): void => {
    setState((current) => ({
      ...current,
      selectedPanelId: panelId,
      selectedBubbleId: null,
    }));
  };

  const handleSelectedPanelTitleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedPanel({ title: event.target.value });
  };

  const handleSelectedPanelHeightChange = (value: number[]): void => {
    const height = value[0];
    if (typeof height !== 'number') return;
    patchSelectedPanel({ height });
  };

  const handleSelectedPanelPromptChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    patchSelectedPanel({ prompt: event.target.value });
  };

  return {
    handleAddPanel,
    handleCommonPromptChange,
    handleDeletePanel,
    handleDuplicatePanel,
    handleMovePanelDown,
    handleMovePanelUp,
    handlePanelGapChange,
    handlePanelSelect,
    handleSelectedPanelHeightChange,
    handleSelectedPanelPromptChange,
    handleSelectedPanelTitleChange,
    patchSelectedPanel,
  };
};

export { usePanelActions };
