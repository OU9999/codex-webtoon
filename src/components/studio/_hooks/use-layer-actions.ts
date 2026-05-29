import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getBubbleTailSidePatch,
  isBubbleBorderStyle,
  isBubbleFontFamily,
  isBubbleFontWeight,
  isBubbleTailSide,
} from '../_lib/bubble-style';
import { createBubble, createPanel } from '../_lib/factories';
import { CANVAS_WIDTH } from '../_lib/constants';
import {
  getCanvasPanels,
  getPanelCanvas,
  getSelectedCanvas,
} from '../_lib/canvas-state';
import type { Bubble, BubbleType, Panel, StudioState } from '../_lib/types';

interface CanvasPoint {
  x: number;
  y: number;
}

interface LayerAddTarget {
  panel: Panel;
  createdPanel: boolean;
  canvasHeight: number;
  x: number;
  y: number;
}

const DEFAULT_LAYER_PANEL_HEIGHT = 420;

const clampLayerValue = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const getCanvasStageElement = (canvasId: string): HTMLElement | null => {
  if (typeof document === 'undefined') return null;

  return (
    Array.from(document.querySelectorAll<HTMLElement>('.webtoon-stage')).find(
      (element) => element.dataset.canvasId === canvasId,
    ) ?? null
  );
};

const getVisibleStageCenter = (
  canvasId: string,
  canvasHeight: number,
): CanvasPoint => {
  const stage = getCanvasStageElement(canvasId);
  if (!stage) return { x: CANVAS_WIDTH / 2, y: canvasHeight / 2 };

  const rect = stage.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: CANVAS_WIDTH / 2, y: canvasHeight / 2 };
  }

  const visibleLeft = Math.max(rect.left, 0);
  const visibleRight = Math.min(rect.right, window.innerWidth);
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  const centerClientX =
    visibleRight > visibleLeft
      ? (visibleLeft + visibleRight) / 2
      : rect.left + rect.width / 2;
  const centerClientY =
    visibleBottom > visibleTop
      ? (visibleTop + visibleBottom) / 2
      : rect.top + rect.height / 2;

  return {
    x: ((centerClientX - rect.left) / rect.width) * CANVAS_WIDTH,
    y: ((centerClientY - rect.top) / rect.height) * canvasHeight,
  };
};

const panelContainsPoint = (panel: Panel, point: CanvasPoint): boolean => {
  return (
    point.x >= panel.x &&
    point.x <= panel.x + panel.width &&
    point.y >= panel.y &&
    point.y <= panel.y + panel.height
  );
};

const getPanelDistanceToPoint = (panel: Panel, point: CanvasPoint): number => {
  const nearestX = Math.min(Math.max(point.x, panel.x), panel.x + panel.width);
  const nearestY = Math.min(Math.max(point.y, panel.y), panel.y + panel.height);
  const deltaX = point.x - nearestX;
  const deltaY = point.y - nearestY;

  return deltaX * deltaX + deltaY * deltaY;
};

const findViewCenterPanel = (
  panels: Panel[],
  point: CanvasPoint,
): Panel | null => {
  const containingPanel = panels.find((panel) =>
    panelContainsPoint(panel, point),
  );
  if (containingPanel) return containingPanel;

  return panels.reduce<Panel | null>((nearest, panel) => {
    if (!nearest) return panel;

    return getPanelDistanceToPoint(panel, point) <
      getPanelDistanceToPoint(nearest, point)
      ? panel
      : nearest;
  }, null);
};

const getBubblePositionInPanel = (
  panel: Panel,
  point: CanvasPoint,
  bubble: Bubble,
): CanvasPoint => {
  const maxX = Math.max(0, panel.width - bubble.width);
  const maxY = Math.max(0, panel.height - bubble.height);

  return {
    x: clampLayerValue(point.x - panel.x - bubble.width / 2, 0, maxX),
    y: clampLayerValue(point.y - panel.y - bubble.height / 2, 0, maxY),
  };
};

const createLayerFallbackPanel = (
  canvasId: string,
  canvasHeight: number,
  center: CanvasPoint,
  title: string,
): Panel => {
  const maxPanelY = Math.max(0, canvasHeight - DEFAULT_LAYER_PANEL_HEIGHT);
  const y = clampLayerValue(
    center.y - DEFAULT_LAYER_PANEL_HEIGHT / 2,
    0,
    maxPanelY,
  );

  return createPanel({
    canvasId,
    title,
    y,
    height: DEFAULT_LAYER_PANEL_HEIGHT,
  });
};

const getLayerAddTarget = (
  state: StudioState,
  bubble: Bubble,
  fallbackPanelTitle: string,
): LayerAddTarget | null => {
  const canvas = getSelectedCanvas(state);
  if (!canvas) return null;

  const center = getVisibleStageCenter(canvas.id, canvas.height);
  const canvasPanels = getCanvasPanels(state, canvas.id);
  const existingPanel = findViewCenterPanel(canvasPanels, center);
  const panel =
    existingPanel ??
    createLayerFallbackPanel(
      canvas.id,
      canvas.height,
      center,
      fallbackPanelTitle,
    );
  const position = getBubblePositionInPanel(panel, center, bubble);

  return {
    panel,
    createdPanel: !existingPanel,
    canvasHeight: Math.max(canvas.height, panel.y + panel.height),
    x: position.x,
    y: position.y,
  };
};

const useLayerActions = (setState: Dispatch<SetStateAction<StudioState>>) => {
  const { t } = useTranslation();

  const patchBubble = (
    panelId: string,
    bubbleId: string,
    patch: Partial<Bubble>,
  ): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
        if (panel.id !== panelId) return panel;

        return {
          ...panel,
          bubbles: panel.bubbles.map((bubble) =>
            bubble.id === bubbleId ? { ...bubble, ...patch } : bubble,
          ),
        };
      }),
    }));
  };

  const patchSelectedBubbleNumber = (
    key: keyof Pick<
      Bubble,
      | 'radiusTopLeft'
      | 'radiusTopRight'
      | 'radiusBottomRight'
      | 'radiusBottomLeft'
      | 'tailPosition'
      | 'tailWidth'
      | 'tailHeight'
      | 'tailSkew'
      | 'tailTipX'
      | 'tailTipY'
    >,
    value: number[],
  ): void => {
    const nextValue = value[0];
    if (typeof nextValue !== 'number') return;
    patchSelectedBubble({ [key]: nextValue });
  };

  const patchSelectedBubble = (patch: Partial<Bubble>): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
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

  const handleLayerAdd = (
    type: BubbleType,
    patch: Partial<Bubble> = {},
  ): void => {
    const bubble = {
      ...createBubble(type),
      text: t(`bubbles.defaultText.${type}`),
      ...patch,
    };
    setState((current) => {
      const target = getLayerAddTarget(
        current,
        bubble,
        t('defaults.newPanelTitle', { count: 1 }),
      );
      if (!target) return current;
      const nextBubble = {
        ...bubble,
        x: target.x,
        y: target.y,
      };
      const panels = target.createdPanel
        ? [...current.panels, target.panel]
        : current.panels;

      return {
        ...current,
        canvases: current.canvases.map((canvas) =>
          canvas.id === target.panel.canvasId
            ? { ...canvas, height: target.canvasHeight }
            : canvas,
        ),
        selectedCanvasId: target.panel.canvasId,
        selectedPanelId: null,
        selectedBubbleId: nextBubble.id,
        panels: panels.map((panel) =>
          panel.id === target.panel.id
            ? { ...panel, bubbles: [...panel.bubbles, nextBubble] }
            : panel,
        ),
      };
    });
  };

  const handleBubbleSelect = (bubbleId: string, panelId?: string): void => {
    setState((current) => {
      const panel = panelId
        ? current.panels.find((item) => item.id === panelId)
        : current.panels.find((item) =>
            item.bubbles.some((bubble) => bubble.id === bubbleId),
          );
      const canvas = panel ? getPanelCanvas(current, panel) : null;

      return {
        ...current,
        selectedCanvasId: canvas?.id ?? current.selectedCanvasId,
        selectedPanelId: null,
        selectedBubbleId: bubbleId,
      };
    });
  };

  const handleBubbleTextChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    patchSelectedBubble({ text: event.target.value });
  };

  const handleBubbleTextValueChange = (
    panelId: string,
    bubbleId: string,
    text: string,
  ): void => {
    patchBubble(panelId, bubbleId, { text });
  };

  const handleBubbleFontSizeChange = (value: number[]): void => {
    const fontSize = value[0];
    if (typeof fontSize !== 'number') return;
    patchSelectedBubble({ fontSize });
  };

  const handleBubbleFillColorChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ fillColor: event.target.value });
  };

  const handleBubbleTextColorChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ textColor: event.target.value });
  };

  const handleBubbleBorderColorChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ borderColor: event.target.value });
  };

  const handleBubbleBorderWidthChange = (value: number[]): void => {
    const borderWidth = value[0];
    if (typeof borderWidth !== 'number') return;
    patchSelectedBubble({ borderWidth });
  };

  const handleBubbleBorderStyleChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleBorderStyle(event.target.value)) return;
    patchSelectedBubble({ borderStyle: event.target.value });
  };

  const handleBubbleFontFamilyChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleFontFamily(event.target.value)) return;
    patchSelectedBubble({ fontFamily: event.target.value });
  };

  const handleBubbleFontWeightChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleFontWeight(event.target.value)) return;
    patchSelectedBubble({ fontWeight: event.target.value });
  };

  const handleBubbleRadiusTopLeftChange = (value: number[]): void => {
    patchSelectedBubbleNumber('radiusTopLeft', value);
  };

  const handleBubbleRadiusTopRightChange = (value: number[]): void => {
    patchSelectedBubbleNumber('radiusTopRight', value);
  };

  const handleBubbleRadiusBottomRightChange = (value: number[]): void => {
    patchSelectedBubbleNumber('radiusBottomRight', value);
  };

  const handleBubbleRadiusBottomLeftChange = (value: number[]): void => {
    patchSelectedBubbleNumber('radiusBottomLeft', value);
  };

  const handleBubbleTailPositionChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailPosition', value);
  };

  const handleBubbleTailSideChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleTailSide(event.target.value)) return;
    patchSelectedBubble(getBubbleTailSidePatch(event.target.value));
  };

  const handleBubbleTailWidthChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailWidth', value);
  };

  const handleBubbleTailHeightChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailHeight', value);
  };

  const handleBubbleTailSkewChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailSkew', value);
  };

  const handleBubbleTailTipXChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailTipX', value);
  };

  const handleBubbleTailTipYChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailTipY', value);
  };

  const handleBubbleStylePatch = (patch: Partial<Bubble>): void => {
    patchSelectedBubble(patch);
  };

  const handleSelectedBubbleDelete = (): void => {
    setState((current) => ({
      ...current,
      selectedPanelId: null,
      selectedBubbleId: null,
      panels: current.panels.map((panel) => {
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
    handleBubbleBorderColorChange,
    handleBubbleBorderStyleChange,
    handleBubbleBorderWidthChange,
    handleBubbleFillColorChange,
    handleBubbleFontFamilyChange,
    handleBubbleFontSizeChange,
    handleBubbleFontWeightChange,
    handleBubbleRadiusBottomLeftChange,
    handleBubbleRadiusBottomRightChange,
    handleBubbleRadiusTopLeftChange,
    handleBubbleRadiusTopRightChange,
    handleBubbleSelect,
    handleBubbleStylePatch,
    handleBubbleTailHeightChange,
    handleBubbleTailPositionChange,
    handleBubbleTailSideChange,
    handleBubbleTailSkewChange,
    handleBubbleTailTipXChange,
    handleBubbleTailTipYChange,
    handleBubbleTailWidthChange,
    handleBubbleTextChange,
    handleBubbleTextColorChange,
    handleBubbleTextValueChange,
    handleLayerAdd,
    handleSelectedBubbleDelete,
  };
};

export { useLayerActions };
