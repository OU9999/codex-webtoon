import { useState } from 'react';
import { renameProject, saveProjectState } from '@/api/client';
import type { ProjectState } from '@shared/types';
import { buildFinalPrompt } from '../_lib/prompt';
import {
  getCanvasPanels,
  getPanelCanvas,
  getSelectedCanvas,
  getSelectedCanvasPanels,
} from '../_lib/canvas-state';
import type {
  BubbleDragStartPayload,
  CanvasResizeStartPayload,
  PanelTransformStartPayload,
  StudioState,
} from '../_lib/types';
import { useBubbleDrag } from './use-bubble-drag';
import { useCanvasResize } from './use-canvas-resize';
import { useCandidateActions } from './use-candidate-actions';
import { useClipboardActions } from './use-clipboard-actions';
import { useDynamicStyles } from './use-dynamic-styles';
import { useExport } from './use-export';
import { useGeneratePanel } from './use-generate-panel';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';
import { useLayerActions } from './use-layer-actions';
import { usePanelActions } from './use-panel-actions';
import { usePanelTransform } from './use-panel-transform';
import { useStudioState } from './use-studio-state';

interface UseStudioOptions {
  projectName: string;
  initialState: StudioState;
  onBack: () => void;
  onProjectRename: (name: string) => void;
}

const useStudio = ({
  projectName,
  initialState,
  onBack,
  onProjectRename,
}: UseStudioOptions) => {
  const [state, setState, saveStatus, historyEntries, canUndo, handleUndo] =
    useStudioState({
      projectName,
      initialState,
    });
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);
  const selectedCanvas = getSelectedCanvas(state);
  const selectedCanvasPanels = getSelectedCanvasPanels(state);

  const selectedPanelCandidate = state.selectedPanelId
    ? (state.panels.find((panel) => panel.id === state.selectedPanelId) ?? null)
    : null;
  const selectedBubblePanel = state.selectedBubbleId
    ? (state.panels.find(
        (panel) =>
          panel.id === state.selectedPanelId &&
          panel.bubbles.some((bubble) => bubble.id === state.selectedBubbleId),
      ) ??
      state.panels.find((panel) =>
        panel.bubbles.some((bubble) => bubble.id === state.selectedBubbleId),
      ) ??
      null)
    : null;
  const selectedPanel = state.selectedBubbleId ? null : selectedPanelCandidate;
  const selectedPanelCanvas = selectedPanel
    ? getPanelCanvas(state, selectedPanel)
    : null;
  const selectedPanelCanvasPanels = selectedPanelCanvas
    ? getCanvasPanels(state, selectedPanelCanvas.id)
    : [];
  const selectedCandidate = selectedPanel?.candidates.find(
    (candidate) => candidate.id === selectedPanel.selectedCandidateId,
  );
  const selectedBubble = selectedBubblePanel?.bubbles.find(
    (bubble) => bubble.id === state.selectedBubbleId,
  );
  const finalPrompt = buildFinalPrompt({
    projectCommonPrompt: state.commonPrompt,
    canvasCommonPrompt: selectedPanelCanvas?.commonPrompt ?? '',
    panel: selectedPanel ?? undefined,
  });

  const panels = usePanelActions(state, setState);
  const generation = useGeneratePanel(
    state,
    setState,
    selectedPanel,
    finalPrompt,
    projectName,
  );
  const candidates = useCandidateActions(setState, panels.patchSelectedPanel);
  const layers = useLayerActions(setState);
  const drag = useBubbleDrag(setState);
  const transform = usePanelTransform(setState);
  const canvasResize = useCanvasResize(setState);
  const clipboard = useClipboardActions(state, setState);
  const exporting = useExport(state);

  const handleBubbleSelect = (bubbleId: string, panelId?: string): void => {
    setEditingBubbleId(null);
    layers.handleBubbleSelect(bubbleId, panelId);
  };

  const handleBubbleTextEditStart = (
    panelId: string,
    bubbleId: string,
  ): void => {
    layers.handleBubbleSelect(bubbleId, panelId);
    setEditingBubbleId(bubbleId);
  };

  const handleBubbleTextEditEnd = (): void => {
    setEditingBubbleId(null);
  };

  const handleBubbleDragStart = (payload: BubbleDragStartPayload): void => {
    setEditingBubbleId(null);
    drag.handleBubbleDragStart(payload);
  };

  const handlePanelSelect = (panelId: string): void => {
    setEditingBubbleId(null);
    panels.handlePanelSelect(panelId);
  };

  const handlePanelTransformStart = (
    payload: PanelTransformStartPayload,
  ): void => {
    setEditingBubbleId(null);
    transform.handlePanelTransformStart(payload);
  };

  const handleCanvasResizeStart = (payload: CanvasResizeStartPayload): void => {
    setEditingBubbleId(null);
    canvasResize.handleCanvasResizeStart(payload);
  };

  const handleSelectionClear = (): void => {
    setEditingBubbleId(null);
    panels.handleSelectionClear();
  };

  const handleSelectedBubbleDelete = (): void => {
    setEditingBubbleId(null);
    layers.handleSelectedBubbleDelete();
  };

  const handleSelectionDelete = (): void => {
    setEditingBubbleId(null);
    if (state.selectedBubbleId) {
      layers.handleSelectedBubbleDelete();
      return;
    }

    if (!state.selectedPanelId) return;
    panels.handleDeletePanel();
  };

  const handleSelectionCopy = (): void => {
    clipboard.handleSelectionCopy();
  };

  const handleClipboardPaste = (): void => {
    setEditingBubbleId(null);
    clipboard.handleClipboardPaste();
  };

  const handleProjectRename = async (name: string): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === projectName) return;

    await saveProjectState(projectName, state as unknown as ProjectState);
    const renamed = await renameProject(projectName, trimmedName);
    onProjectRename(renamed.name);
  };

  useDynamicStyles(state);
  useKeyboardShortcuts({
    onGenerate: generation.handleGenerateSelectedPanel,
    generateEnabled: Boolean(selectedPanel) && !generation.isGenerating,
    onUndo: handleUndo,
    undoEnabled: canUndo,
    onSelectionDelete: handleSelectionDelete,
    selectionDeleteEnabled: Boolean(state.selectedBubbleId || selectedPanel),
    onSelectionCopy: handleSelectionCopy,
    selectionCopyEnabled: clipboard.selectionCopyEnabled,
    onClipboardPaste: handleClipboardPaste,
    clipboardPasteEnabled: clipboard.clipboardPasteEnabled,
  });

  return {
    state,
    selectedCanvas,
    selectedCanvasPanels,
    selectedPanel,
    selectedPanelCanvas,
    selectedPanelCanvasPanels,
    selectedBubblePanel,
    selectedCandidate,
    selectedBubble,
    finalPrompt,
    projectName,
    saveStatus,
    historyEntries,
    canUndo,
    onBack,
    handleUndo,
    ...panels,
    ...generation,
    ...candidates,
    ...layers,
    ...drag,
    ...transform,
    ...clipboard,
    ...exporting,
    editingBubbleId,
    handleBubbleDragStart,
    handleBubbleSelect,
    handleBubbleTextEditEnd,
    handleBubbleTextEditStart,
    handleCanvasResizeStart,
    handleClipboardPaste,
    handlePanelSelect,
    handlePanelTransformStart,
    handleProjectRename,
    handleSelectionCopy,
    handleSelectionClear,
    handleSelectedBubbleDelete,
  };
};

export { useStudio };
