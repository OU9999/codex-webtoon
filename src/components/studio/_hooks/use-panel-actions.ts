import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MIN_CANVAS_HEIGHT,
  normalizePanelGapColor,
  WEBTOON_CANVAS_WIDTH,
} from '@shared/project-state';
import { getReferenceImageKey } from '@shared/reference-images';
import { createPanel, createWebtoonCanvas } from '../_lib/factories';
import { clamp } from '../_lib/canvas-primitives';
import { MAX_REFERENCE_IMAGES } from '../_lib/constants';
import {
  getCanvasPanels,
  getPanelCanvasHeight,
  getSelectedCanvas,
} from '../_lib/canvas-state';
import {
  clampPanelToCanvas,
  getMinimumCanvasHeightForContent,
} from '../_lib/panel-geometry';
import type {
  Panel,
  PanelFitMode,
  ReferenceImageRef,
  SidebarDropPosition,
  StudioState,
} from '../_lib/types';

const isSameReferenceImage = (
  reference: ReferenceImageRef,
  target: ReferenceImageRef,
): boolean => getReferenceImageKey(reference) === getReferenceImageKey(target);

const removeReferenceImage = (
  references: ReferenceImageRef[],
  target: ReferenceImageRef,
): ReferenceImageRef[] =>
  references.filter((reference) => !isSameReferenceImage(reference, target));

const DEFAULT_PANEL_HEIGHT = 420;
const CANVAS_SCROLL_CONTAINER_SELECTOR = '[data-canvas-scroll-container]';

const getPanelBottom = (panel: Panel): number => panel.y + panel.height;

const getAppendPanelY = (panels: Panel[], panelGap: number): number => {
  if (panels.length === 0) return 0;

  return Math.max(...panels.map(getPanelBottom)) + panelGap;
};

const scrollPanelIntoView = (panelId: string): void => {
  window.requestAnimationFrame(() => {
    const panelElement = Array.from(
      document.querySelectorAll<HTMLElement>('[data-panel-id]'),
    ).find((element) => element.dataset.panelId === panelId);
    if (!panelElement) return;

    const scrollContainer = panelElement.closest<HTMLElement>(
      CANVAS_SCROLL_CONTAINER_SELECTOR,
    );
    if (!scrollContainer) {
      panelElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const panelRect = panelElement.getBoundingClientRect();
    const centeredTop =
      scrollContainer.scrollTop +
      panelRect.top -
      containerRect.top -
      (containerRect.height - panelRect.height) / 2;

    scrollContainer.scrollTo({
      top: Math.max(0, centeredTop),
      behavior: 'smooth',
    });
  });
};

const scrollCanvasIntoView = (canvasId: string): void => {
  window.requestAnimationFrame(() => {
    const canvasElement = Array.from(
      document.querySelectorAll<HTMLElement>('[data-canvas-id]'),
    ).find((element) => element.dataset.canvasId === canvasId);
    if (!canvasElement) return;

    const scrollContainer = canvasElement.closest<HTMLElement>(
      CANVAS_SCROLL_CONTAINER_SELECTOR,
    );
    if (!scrollContainer) {
      canvasElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const canvasRect = canvasElement.getBoundingClientRect();
    const centeredTop =
      scrollContainer.scrollTop +
      canvasRect.top -
      containerRect.top -
      (containerRect.height - canvasRect.height) / 2;

    scrollContainer.scrollTo({
      top: Math.max(0, centeredTop),
      behavior: 'smooth',
    });
  });
};

const getCanvasAfterDelete = (
  canvases: StudioState['canvases'],
  canvasId: string,
): StudioState['canvases'][number] | null => {
  const canvasIndex = canvases.findIndex((canvas) => canvas.id === canvasId);
  if (canvasIndex < 0) return null;

  const remainingCanvases = canvases.filter((canvas) => canvas.id !== canvasId);
  return remainingCanvases[Math.min(canvasIndex, remainingCanvases.length - 1)];
};

const usePanelActions = (
  state: StudioState,
  setState: Dispatch<SetStateAction<StudioState>>,
) => {
  const { t } = useTranslation();

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
      const selected = current.panels.find(
        (panel) => panel.id === current.selectedPanelId,
      );
      if (!selected) return current;

      const canvasPanels = getCanvasPanels(current, selected.canvasId);
      const index = canvasPanels.findIndex((panel) => panel.id === selected.id);
      const target = index + direction;
      if (index < 0) return current;
      if (target < 0) return current;
      if (target >= canvasPanels.length) return current;

      const reordered = [...canvasPanels];
      const [panel] = reordered.splice(index, 1);
      if (!panel) return current;

      reordered.splice(target, 0, panel);
      let canvasPanelIndex = 0;
      const panels = current.panels.map((item) => {
        if (item.canvasId !== selected.canvasId) return item;

        const nextPanel = reordered[canvasPanelIndex];
        canvasPanelIndex += 1;
        return nextPanel ?? item;
      });

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
      const canvas = getSelectedCanvas(current);
      if (!canvas) return current;

      const canvasPanels = getCanvasPanels(current, canvas.id);
      const panelHeight = DEFAULT_PANEL_HEIGHT;
      const rawY = getAppendPanelY(canvasPanels, current.panelGap);
      const canvasHeight = Math.max(canvas.height, rawY + panelHeight);
      const panel = createPanel({
        canvasId: canvas.id,
        title: t('defaults.newPanelTitle', {
          count: canvasPanels.length + 1,
        }),
        y: clamp(rawY, 0, canvasHeight - panelHeight),
        height: panelHeight,
      });

      return {
        ...current,
        canvases: current.canvases.map((item) =>
          item.id === canvas.id ? { ...item, height: canvasHeight } : item,
        ),
        panels: [...current.panels, panel],
        selectedCanvasId: canvas.id,
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
      const selectedCanvasHeight = getPanelCanvasHeight(current, selected);
      const canvasHeight = Math.max(selectedCanvasHeight, y + selected.height);
      const duplicate = createPanel({
        canvasId: selected.canvasId,
        title: t('defaults.copyTitle', { title: selected.title }),
        x,
        y,
        width: selected.width,
        height: selected.height,
        prompt: selected.prompt,
        candidates: selected.candidates,
        selectedCandidateId: selected.selectedCandidateId,
        fitMode: selected.fitMode,
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
        canvases: current.canvases.map((canvas) =>
          canvas.id === selected.canvasId
            ? { ...canvas, height: canvasHeight }
            : canvas,
        ),
        panels,
        selectedCanvasId: selected.canvasId,
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
        selectedCanvasId: nextPanel.canvasId,
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

    setState((current) => {
      const canvas = getSelectedCanvas(current);
      if (!canvas) return current;

      const canvasPanels = getCanvasPanels(current, canvas.id);
      const canvasHeight = Math.max(
        MIN_CANVAS_HEIGHT,
        Math.trunc(raw),
        getMinimumCanvasHeightForContent(canvasPanels),
      );

      return {
        ...current,
        canvases: current.canvases.map((item) =>
          item.id === canvas.id ? { ...item, height: canvasHeight } : item,
        ),
      };
    });
  };

  const handlePanelGapChange = (value: number[]): void => {
    const panelGap = value[0];
    if (typeof panelGap !== 'number') return;

    setState((current) => ({ ...current, panelGap }));
  };

  const handleCanvasBackgroundColorChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const backgroundColor = normalizePanelGapColor(event.target.value);
    setState((current) => {
      const canvas = getSelectedCanvas(current);
      if (!canvas) return current;

      return {
        ...current,
        canvases: current.canvases.map((item) =>
          item.id === canvas.id ? { ...item, backgroundColor } : item,
        ),
      };
    });
  };

  const handleCanvasCommonPromptChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    const commonPrompt = event.target.value;
    setState((current) => {
      const canvas = getSelectedCanvas(current);
      if (!canvas) return current;

      return {
        ...current,
        canvases: current.canvases.map((item) =>
          item.id === canvas.id ? { ...item, commonPrompt } : item,
        ),
      };
    });
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
      selectedCanvasId:
        current.panels.find((panel) => panel.id === panelId)?.canvasId ??
        current.selectedCanvasId,
      selectedPanelId: panelId,
      selectedBubbleId: null,
    }));
    scrollPanelIntoView(panelId);
  };

  const handleCanvasSelect = (canvasId: string): void => {
    setState((current) => {
      const canvas = current.canvases.find((item) => item.id === canvasId);
      if (!canvas) return current;

      return {
        ...current,
        selectedCanvasId: canvas.id,
        selectedPanelId: null,
        selectedBubbleId: null,
      };
    });
    scrollCanvasIntoView(canvasId);
  };

  const handleCanvasMove = (
    sourceCanvasId: string,
    targetCanvasId: string,
    position: SidebarDropPosition,
  ): void => {
    if (sourceCanvasId === targetCanvasId) return;

    setState((current) => {
      const sourceIndex = current.canvases.findIndex(
        (canvas) => canvas.id === sourceCanvasId,
      );
      const targetIndex = current.canvases.findIndex(
        (canvas) => canvas.id === targetCanvasId,
      );
      if (sourceIndex < 0 || targetIndex < 0) return current;

      const canvases = [...current.canvases];
      const [sourceCanvas] = canvases.splice(sourceIndex, 1);
      if (!sourceCanvas) return current;

      const adjustedTargetIndex =
        sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      const rawInsertIndex =
        position === 'after' ? adjustedTargetIndex + 1 : adjustedTargetIndex;
      const insertIndex = clamp(rawInsertIndex, 0, canvases.length);
      canvases.splice(insertIndex, 0, sourceCanvas);

      return { ...current, canvases };
    });
  };

  const handlePanelMove = (
    sourcePanelId: string,
    targetPanelId: string,
    position: SidebarDropPosition,
  ): void => {
    if (sourcePanelId === targetPanelId) return;

    setState((current) => {
      const sourcePanel = current.panels.find(
        (panel) => panel.id === sourcePanelId,
      );
      const targetPanel = current.panels.find(
        (panel) => panel.id === targetPanelId,
      );
      if (!sourcePanel || !targetPanel) return current;
      if (sourcePanel.canvasId !== targetPanel.canvasId) return current;

      const canvasPanels = getCanvasPanels(current, sourcePanel.canvasId);
      const sourceIndex = canvasPanels.findIndex(
        (panel) => panel.id === sourcePanel.id,
      );
      const targetIndex = canvasPanels.findIndex(
        (panel) => panel.id === targetPanel.id,
      );
      if (sourceIndex < 0 || targetIndex < 0) return current;

      const reordered = [...canvasPanels];
      const [source] = reordered.splice(sourceIndex, 1);
      if (!source) return current;

      const adjustedTargetIndex =
        sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      const rawInsertIndex =
        position === 'after' ? adjustedTargetIndex + 1 : adjustedTargetIndex;
      const insertIndex = clamp(rawInsertIndex, 0, reordered.length);
      reordered.splice(insertIndex, 0, source);

      let canvasPanelIndex = 0;
      const panels = current.panels.map((panel) => {
        if (panel.canvasId !== sourcePanel.canvasId) return panel;

        const nextPanel = reordered[canvasPanelIndex];
        canvasPanelIndex += 1;
        return nextPanel ?? panel;
      });

      return {
        ...current,
        panels,
        selectedCanvasId: sourcePanel.canvasId,
        selectedPanelId: sourcePanel.id,
        selectedBubbleId: null,
      };
    });
  };

  const handleAddCanvas = (): void => {
    const canvas = createWebtoonCanvas({
      title: t('defaults.newCanvasTitle', {
        count: state.canvases.length + 1,
      }),
    });

    setState((current) => ({
      ...current,
      canvases: [...current.canvases, canvas],
      selectedCanvasId: canvas.id,
      selectedPanelId: null,
      selectedBubbleId: null,
    }));
    scrollCanvasIntoView(canvas.id);
  };

  const handleDeleteCanvas = (canvasId: string): void => {
    if (state.canvases.length <= 1) return;

    const nextCanvas = getCanvasAfterDelete(state.canvases, canvasId);
    const shouldScrollToNextCanvas = state.selectedCanvasId === canvasId;

    setState((current) => {
      if (current.canvases.length <= 1) return current;

      const canvas = current.canvases.find((item) => item.id === canvasId);
      if (!canvas) return current;

      const remainingCanvases = current.canvases.filter(
        (item) => item.id !== canvas.id,
      );
      const fallbackCanvas =
        getCanvasAfterDelete(current.canvases, canvas.id) ??
        remainingCanvases[0];
      if (!fallbackCanvas) return current;

      const deletedPanelIds = new Set(
        current.panels
          .filter((panel) => panel.canvasId === canvas.id)
          .map((panel) => panel.id),
      );
      const panels = current.panels
        .filter((panel) => panel.canvasId !== canvas.id)
        .map((panel) => ({
          ...panel,
          referenceImages: panel.referenceImages.filter(
            (reference) =>
              !reference.panelId || !deletedPanelIds.has(reference.panelId),
          ),
        }));
      const selectedCanvasExists = remainingCanvases.some(
        (item) => item.id === current.selectedCanvasId,
      );
      const selectedPanelExists =
        current.selectedPanelId !== null &&
        panels.some((panel) => panel.id === current.selectedPanelId);
      const selectedBubbleExists =
        current.selectedBubbleId !== null &&
        panels.some((panel) =>
          panel.bubbles.some(
            (bubble) => bubble.id === current.selectedBubbleId,
          ),
        );

      return {
        ...current,
        canvases: remainingCanvases,
        panels,
        selectedCanvasId: selectedCanvasExists
          ? current.selectedCanvasId
          : fallbackCanvas.id,
        selectedPanelId: selectedPanelExists ? current.selectedPanelId : null,
        selectedBubbleId: selectedBubbleExists
          ? current.selectedBubbleId
          : null,
      };
    });

    if (shouldScrollToNextCanvas && nextCanvas) {
      scrollCanvasIntoView(nextCanvas.id);
    }
  };

  const handleSelectionClear = (): void => {
    setState((current) => {
      if (!current.selectedPanelId && !current.selectedBubbleId) return current;

      return {
        ...current,
        selectedPanelId: null,
        selectedBubbleId: null,
      };
    });
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

        return clampPanelToCanvas(
          { ...panel, height },
          getPanelCanvasHeight(current, panel),
        );
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

        return clampPanelToCanvas(
          { ...panel, width },
          getPanelCanvasHeight(current, panel),
        );
      }),
    }));
  };

  const handleSelectedPanelPromptChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    patchSelectedPanel({ prompt: event.target.value });
  };

  const handleSelectedPanelFitModeChange = (fitMode: PanelFitMode): void => {
    patchSelectedPanel({ fitMode });
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
    handleAddCanvas,
    handleAddPanel,
    handleCanvasMove,
    handleCanvasSelect,
    handleDeleteCanvas,
    handleCanvasHeightChange,
    handleCanvasCommonPromptChange,
    handleCommonPromptChange,
    handleDeletePanel,
    handleDuplicatePanel,
    handleMovePanelDown,
    handleMovePanelUp,
    handleCanvasBackgroundColorChange,
    handlePanelGapChange,
    handlePanelMove,
    handlePanelSelect,
    handleReferenceImageRemove,
    handleReferenceImageToggle,
    handleReferenceImagesClear,
    handleSelectedPanelFitModeChange,
    handleSelectedPanelHeightChange,
    handleSelectedPanelPromptChange,
    handleSelectedPanelTitleChange,
    handleSelectedPanelWidthChange,
    handleSelectionClear,
    handleVariantCountChange,
    patchSelectedPanel,
  };
};

export { usePanelActions };
