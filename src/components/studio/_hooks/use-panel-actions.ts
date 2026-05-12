import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import {
  MIN_CANVAS_HEIGHT,
  MIN_PANEL_HEIGHT,
  MIN_PANEL_WIDTH,
  normalizePanelGapColor,
  WEBTOON_CANVAS_WIDTH,
} from '@shared/project-state';
import { createPanel } from '../_lib/factories';
import { clamp } from '../_lib/canvas-primitives';
import { MAX_REFERENCE_IMAGES } from '../_lib/constants';
import type { Panel, ReferenceImageRef, StudioState } from '../_lib/types';

const isSameReferenceImage = (
  reference: ReferenceImageRef,
  target: ReferenceImageRef,
): boolean =>
  reference.panelId === target.panelId &&
  reference.candidateId === target.candidateId;

const removeReferenceImage = (
  references: ReferenceImageRef[],
  target: ReferenceImageRef,
): ReferenceImageRef[] =>
  references.filter((reference) => !isSameReferenceImage(reference, target));

const clampPanelToCanvas = (panel: Panel, canvasHeight: number): Panel => {
  const width = clamp(panel.width, MIN_PANEL_WIDTH, WEBTOON_CANVAS_WIDTH);
  const height = clamp(panel.height, MIN_PANEL_HEIGHT, canvasHeight);
  const x = clamp(panel.x, 0, WEBTOON_CANVAS_WIDTH - width);
  const y = clamp(panel.y, 0, canvasHeight - height);

  return { ...panel, x, y, width, height };
};

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
    setState((current) => {
      const selected = current.panels.find(
        (item) => item.id === current.selectedPanelId,
      );
      const panelHeight = 420;
      const rawY = selected
        ? selected.y + selected.height + current.panelGap
        : 0;
      const canvasHeight = Math.max(current.canvasHeight, rawY + panelHeight);
      const panel = createPanel({
        title: `Panel ${current.panels.length + 1}`,
        y: clamp(rawY, 0, canvasHeight - panelHeight),
        height: panelHeight,
      });
      const selectedIndex = current.panels.findIndex(
        (item) => item.id === current.selectedPanelId,
      );
      const insertAt =
        selectedIndex >= 0 ? selectedIndex + 1 : current.panels.length;
      const panels = [...current.panels];
      panels.splice(insertAt, 0, panel);

      return {
        ...current,
        canvasHeight,
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

      const x = clamp(
        selected.x + 24,
        0,
        WEBTOON_CANVAS_WIDTH - selected.width,
      );
      const y = selected.y + 24;
      const canvasHeight = Math.max(current.canvasHeight, y + selected.height);
      const duplicate = createPanel({
        title: `${selected.title} copy`,
        x,
        y,
        width: selected.width,
        height: selected.height,
        prompt: selected.prompt,
        candidates: selected.candidates,
        selectedCandidateId: selected.selectedCandidateId,
        referenceImages: selected.referenceImages,
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
        canvasHeight,
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
      const normalizedPanels = panels.map((panel) => ({
        ...panel,
        referenceImages: panel.referenceImages.filter(
          (reference) => reference.panelId !== current.selectedPanelId,
        ),
      }));

      return {
        ...current,
        panels: normalizedPanels,
        selectedPanelId: nextPanel.id,
        selectedBubbleId: null,
      };
    });
  };

  const handleMovePanelUp = (): void => moveSelectedPanel(-1);
  const handleMovePanelDown = (): void => moveSelectedPanel(1);

  const handleCanvasHeightChange = (value: number[]): void => {
    const raw = value[0];
    if (typeof raw !== 'number') return;
    const canvasHeight = Math.max(MIN_CANVAS_HEIGHT, Math.trunc(raw));

    setState((current) => ({
      ...current,
      canvasHeight,
      panels: current.panels.map((panel) =>
        clampPanelToCanvas(panel, canvasHeight),
      ),
    }));
  };

  const handlePanelGapChange = (value: number[]): void => {
    const panelGap = value[0];
    if (typeof panelGap !== 'number') return;

    setState((current) => ({ ...current, panelGap }));
  };

  const handlePanelGapColorChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const panelGapColor = normalizePanelGapColor(event.target.value);
    setState((current) => ({ ...current, panelGapColor }));
  };

  const handleVariantCountChange = (value: number[]): void => {
    const raw = value[0];
    if (typeof raw !== 'number') return;
    const variantCount = Math.min(4, Math.max(1, Math.trunc(raw)));
    setState((current) => ({ ...current, variantCount }));
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
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;

        return clampPanelToCanvas({ ...panel, height }, current.canvasHeight);
      }),
    }));
  };

  const handleSelectedPanelWidthChange = (value: number[]): void => {
    const width = value[0];
    if (typeof width !== 'number') return;
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;

        return clampPanelToCanvas({ ...panel, width }, current.canvasHeight);
      }),
    }));
  };

  const handleSelectedPanelPromptChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    patchSelectedPanel({ prompt: event.target.value });
  };

  const handleReferenceImageToggle = (reference: ReferenceImageRef): void => {
    setState((current) => {
      const selected = current.panels.find(
        (panel) => panel.id === current.selectedPanelId,
      );
      if (!selected) return current;

      const exists = selected.referenceImages.some((item) =>
        isSameReferenceImage(item, reference),
      );
      if (!exists && selected.referenceImages.length >= MAX_REFERENCE_IMAGES) {
        return current;
      }

      const referenceImages = exists
        ? removeReferenceImage(selected.referenceImages, reference)
        : [...selected.referenceImages, reference];

      return {
        ...current,
        panels: current.panels.map((panel) =>
          panel.id === current.selectedPanelId
            ? { ...panel, referenceImages }
            : panel,
        ),
      };
    });
  };

  const handleReferenceImageRemove = (reference: ReferenceImageRef): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) =>
        panel.id === current.selectedPanelId
          ? {
              ...panel,
              referenceImages: removeReferenceImage(
                panel.referenceImages,
                reference,
              ),
            }
          : panel,
      ),
    }));
  };

  const handleReferenceImagesClear = (): void => {
    setState((current) => {
      const selected = current.panels.find(
        (panel) => panel.id === current.selectedPanelId,
      );
      if (!selected || selected.referenceImages.length === 0) return current;

      return {
        ...current,
        panels: current.panels.map((panel) =>
          panel.id === current.selectedPanelId
            ? { ...panel, referenceImages: [] }
            : panel,
        ),
      };
    });
  };

  return {
    handleAddPanel,
    handleCanvasHeightChange,
    handleCommonPromptChange,
    handleDeletePanel,
    handleDuplicatePanel,
    handleMovePanelDown,
    handleMovePanelUp,
    handlePanelGapColorChange,
    handlePanelGapChange,
    handlePanelSelect,
    handleReferenceImageRemove,
    handleReferenceImageToggle,
    handleReferenceImagesClear,
    handleSelectedPanelHeightChange,
    handleSelectedPanelPromptChange,
    handleSelectedPanelTitleChange,
    handleSelectedPanelWidthChange,
    handleVariantCountChange,
    patchSelectedPanel,
  };
};

export { usePanelActions };
