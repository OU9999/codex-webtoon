import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { createBubble } from '../_lib/factories';
import type { Bubble, BubbleType, StudioState } from '../_lib/types';

const useLayerActions = (setState: Dispatch<SetStateAction<StudioState>>) => {
  const patchSelectedBubble = (patch: Partial<Bubble>): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;

        return {
          ...panel,
          bubbles: panel.bubbles.map((bubble) =>
            bubble.id === current.selectedBubbleId
              ? { ...bubble, ...patch }
              : bubble,
          ),
        };
      }),
    }));
  };

  const handleLayerAdd = (type: BubbleType): void => {
    const bubble = createBubble(type);
    setState((current) => ({
      ...current,
      selectedBubbleId: bubble.id,
      panels: current.panels.map((panel) =>
        panel.id === current.selectedPanelId
          ? { ...panel, bubbles: [...panel.bubbles, bubble] }
          : panel,
      ),
    }));
  };

  const handleBubbleTextChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ text: event.target.value });
  };

  const handleBubbleFontSizeChange = (value: number[]): void => {
    const fontSize = value[0];
    if (typeof fontSize !== 'number') return;
    patchSelectedBubble({ fontSize });
  };

  const handleSelectedBubbleDelete = (): void => {
    setState((current) => ({
      ...current,
      selectedBubbleId: null,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;

        return {
          ...panel,
          bubbles: panel.bubbles.filter(
            (bubble) => bubble.id !== current.selectedBubbleId,
          ),
        };
      }),
    }));
  };

  return {
    handleBubbleFontSizeChange,
    handleBubbleTextChange,
    handleLayerAdd,
    handleSelectedBubbleDelete,
  };
};

export { useLayerActions };
