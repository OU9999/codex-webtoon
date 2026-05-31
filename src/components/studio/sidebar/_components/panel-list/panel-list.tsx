import { AlignVerticalSpaceBetween, Plus, Rows3 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useStudioContext } from '@/components/studio/studio-context';
import { MIN_CANVAS_HEIGHT } from '@shared/project-state';
import { FieldBlock } from '@/components/studio/_components/field-block';
import { PromptTextarea } from '@/components/studio/_components/prompt-textarea';
import { RangeField } from '@/components/studio/_components/range-field';
import type { SidebarDropPosition } from '@/components/studio/_lib/types';
import { SidebarCollapsibleSection } from '../sidebar-collapsible-section';
import { PanelListItem } from './_components/panel-list-item';

interface PanelDragTarget {
  panelId: string;
  position: SidebarDropPosition;
}

interface PanelPointerDrag {
  sourcePanelId: string;
  pointerId: number;
  startX: number;
  startY: number;
  hasMoved: boolean;
}

interface PanelAutoScroll {
  frame: number | null;
  pointerX: number;
  pointerY: number;
  velocity: number;
}

const PANEL_AUTO_SCROLL_ZONE = 44;
const PANEL_AUTO_SCROLL_MAX_SPEED = 14;

const getPanelDropPosition = (
  element: HTMLElement,
  clientY: number,
): SidebarDropPosition => {
  const rect = element.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;

  return clientY >= midpoint ? 'after' : 'before';
};

const getPanelDropTargetAtPoint = (
  clientX: number,
  clientY: number,
  sourcePanelId: string,
): PanelDragTarget | null => {
  const element = document.elementFromPoint(clientX, clientY);
  const item = element?.closest<HTMLElement>('[data-sidebar-panel-id]');
  const panelId = item?.dataset.sidebarPanelId;
  if (!item || !panelId) return null;
  if (panelId === sourcePanelId) return null;

  return {
    panelId,
    position: getPanelDropPosition(item, clientY),
  };
};

const getPanelDropTarget = (
  event: ReactPointerEvent<HTMLElement>,
  sourcePanelId: string,
): PanelDragTarget | null => {
  return getPanelDropTargetAtPoint(event.clientX, event.clientY, sourcePanelId);
};

const hasPanelPointerMoved = (
  drag: PanelPointerDrag,
  event: ReactPointerEvent<HTMLElement>,
): boolean => {
  return (
    Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4
  );
};

const getPanelAutoScrollVelocity = (
  container: HTMLElement,
  pointerY: number,
): number => {
  const rect = container.getBoundingClientRect();
  const topDistance = pointerY - rect.top;
  const bottomDistance = rect.bottom - pointerY;

  if (topDistance < PANEL_AUTO_SCROLL_ZONE) {
    const intensity =
      (PANEL_AUTO_SCROLL_ZONE - Math.max(0, topDistance)) /
      PANEL_AUTO_SCROLL_ZONE;
    return -Math.ceil(intensity * PANEL_AUTO_SCROLL_MAX_SPEED);
  }

  if (bottomDistance < PANEL_AUTO_SCROLL_ZONE) {
    const intensity =
      (PANEL_AUTO_SCROLL_ZONE - Math.max(0, bottomDistance)) /
      PANEL_AUTO_SCROLL_ZONE;
    return Math.ceil(intensity * PANEL_AUTO_SCROLL_MAX_SPEED);
  }

  return 0;
};

const PanelList = () => {
  const { t } = useTranslation();
  const suppressPanelClickRef = useRef(false);
  const panelListRef = useRef<HTMLOListElement | null>(null);
  const panelPointerDragRef = useRef<PanelPointerDrag | null>(null);
  const panelAutoScrollRef = useRef<PanelAutoScroll>({
    frame: null,
    pointerX: 0,
    pointerY: 0,
    velocity: 0,
  });
  const [panelPointerDrag, setPanelPointerDrag] =
    useState<PanelPointerDrag | null>(null);
  const [panelDragTarget, setPanelDragTarget] =
    useState<PanelDragTarget | null>(null);
  const {
    selectedCanvas,
    selectedCanvasPanels,
    selectedPanelIds,
    handleAddPanel,
    handleAutoAlignPanels,
    handleCanvasBackgroundColorChange,
    handleCanvasCommonPromptChange,
    handleCanvasHeightChange,
    handlePanelMove,
    handlePanelSelect,
  } = useStudioContext();
  const meta = selectedCanvas
    ? t('sidebar.canvas.meta', {
        count: selectedCanvasPanels.length,
        height: selectedCanvas.height,
      })
    : t('sidebar.canvas.noCanvas');
  const canReorderPanel = selectedCanvasPanels.length > 1;
  const canAutoAlignPanel = selectedCanvasPanels.length > 0;

  const suppressNextPanelClick = (): void => {
    suppressPanelClickRef.current = true;
    window.setTimeout(() => {
      suppressPanelClickRef.current = false;
    }, 0);
  };

  const handlePanelSelectRequest = (
    panelId: string,
    additive: boolean,
  ): void => {
    if (suppressPanelClickRef.current) return;

    handlePanelSelect(panelId, additive);
  };

  const setPanelDropTargetFromPoint = (
    clientX: number,
    clientY: number,
    sourcePanelId: string,
  ): void => {
    const target = getPanelDropTargetAtPoint(clientX, clientY, sourcePanelId);
    if (!target) {
      setPanelDragTarget(null);
      return;
    }

    setPanelDragTarget((current) => {
      if (
        current?.panelId === target.panelId &&
        current.position === target.position
      ) {
        return current;
      }

      return target;
    });
  };

  const stopPanelAutoScroll = (): void => {
    const autoScroll = panelAutoScrollRef.current;
    if (autoScroll.frame !== null) {
      window.cancelAnimationFrame(autoScroll.frame);
    }

    panelAutoScrollRef.current = {
      ...autoScroll,
      frame: null,
      velocity: 0,
    };
  };

  const runPanelAutoScroll = (): void => {
    const autoScroll = panelAutoScrollRef.current;
    const container = panelListRef.current;
    const drag = panelPointerDragRef.current;
    if (!container || !drag || !drag.hasMoved || autoScroll.velocity === 0) {
      stopPanelAutoScroll();
      return;
    }

    container.scrollTop += autoScroll.velocity;
    setPanelDropTargetFromPoint(
      autoScroll.pointerX,
      autoScroll.pointerY,
      drag.sourcePanelId,
    );
    panelAutoScrollRef.current = {
      ...autoScroll,
      frame: window.requestAnimationFrame(runPanelAutoScroll),
    };
  };

  const updatePanelAutoScroll = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    const container = panelListRef.current;
    if (!container) return;

    const velocity = getPanelAutoScrollVelocity(container, event.clientY);
    panelAutoScrollRef.current = {
      ...panelAutoScrollRef.current,
      pointerX: event.clientX,
      pointerY: event.clientY,
      velocity,
    };

    if (velocity === 0) {
      stopPanelAutoScroll();
      return;
    }

    if (panelAutoScrollRef.current.frame !== null) return;

    panelAutoScrollRef.current = {
      ...panelAutoScrollRef.current,
      frame: window.requestAnimationFrame(runPanelAutoScroll),
    };
  };

  const handlePanelPointerDown = (
    event: ReactPointerEvent<HTMLLIElement>,
    panelId: string,
  ): void => {
    if (event.button !== 0) return;
    if (!canReorderPanel) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    panelPointerDragRef.current = {
      sourcePanelId: panelId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
    };
    setPanelPointerDrag(null);
    setPanelDragTarget(null);
    stopPanelAutoScroll();
  };

  const handlePanelPointerMove = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    const drag = panelPointerDragRef.current;
    if (!drag) return;
    if (drag.pointerId !== event.pointerId) return;

    const hasMoved = drag.hasMoved || hasPanelPointerMoved(drag, event);
    if (!hasMoved) return;

    event.preventDefault();
    if (!drag.hasMoved) {
      const nextDrag = { ...drag, hasMoved: true };
      panelPointerDragRef.current = nextDrag;
      setPanelPointerDrag(nextDrag);
    }

    updatePanelAutoScroll(event);
    setPanelDropTargetFromPoint(
      event.clientX,
      event.clientY,
      drag.sourcePanelId,
    );
  };

  const finishPanelPointerDrag = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    const drag = panelPointerDragRef.current;
    if (!drag) return;
    if (drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const hasMoved = drag.hasMoved || hasPanelPointerMoved(drag, event);
    const target =
      panelDragTarget ?? getPanelDropTarget(event, drag.sourcePanelId);

    panelPointerDragRef.current = null;
    setPanelPointerDrag(null);
    setPanelDragTarget(null);
    stopPanelAutoScroll();
    if (!hasMoved) {
      suppressNextPanelClick();
      handlePanelSelect(drag.sourcePanelId, event.shiftKey);
      return;
    }

    suppressNextPanelClick();
    if (!target) return;

    handlePanelMove(drag.sourcePanelId, target.panelId, target.position);
  };

  const handlePanelPointerCancel = (
    event: ReactPointerEvent<HTMLLIElement>,
  ): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    panelPointerDragRef.current = null;
    setPanelPointerDrag(null);
    setPanelDragTarget(null);
    stopPanelAutoScroll();
  };

  return (
    <SidebarCollapsibleSection
      icon={<Rows3 className="size-4" />}
      title={t('sidebar.canvas.title')}
      meta={meta}
      className="min-h-0"
      contentClassName="grid gap-3 p-2"
    >
      <section className="grid gap-3 rounded-[4px] border border-rim-subtle bg-background p-2.5">
        <RangeField
          label={t('sidebar.canvas.height')}
          value={selectedCanvas?.height ?? MIN_CANVAS_HEIGHT}
          suffix="px"
          min={MIN_CANVAS_HEIGHT}
          max={3600}
          step={10}
          onValueChange={handleCanvasHeightChange}
        />
        <FieldBlock label={t('sidebar.canvas.commonPrompt')} compact>
          <PromptTextarea
            value={selectedCanvas?.commonPrompt ?? ''}
            onChange={handleCanvasCommonPromptChange}
            rows={3}
            className="max-h-32 min-h-18"
            disabled={!selectedCanvas}
          />
          <p className="text-right font-mono text-[9.5px] text-fg-muted">
            {t('common.charCount', {
              count: selectedCanvas?.commonPrompt.length ?? 0,
            })}
          </p>
        </FieldBlock>
        <section className="grid gap-2">
          <header className="flex items-center justify-between gap-3 font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            <span>{t('sidebar.canvas.background')}</span>
            <strong className="text-foreground">
              {selectedCanvas?.backgroundColor ?? '#ffffff'}
            </strong>
          </header>
          <label className="flex items-center gap-2 rounded-[4px] border border-rim bg-elevated px-2 py-1.5 text-[11px] text-fg-muted">
            <input
              type="color"
              aria-label={t('sidebar.canvas.backgroundColorLabel')}
              value={selectedCanvas?.backgroundColor ?? '#ffffff'}
              onChange={handleCanvasBackgroundColorChange}
              disabled={!selectedCanvas}
              className="size-7 cursor-pointer rounded-[3px] border border-rim bg-transparent p-0"
            />
            <span>{t('sidebar.canvas.selectedCanvasColor')}</span>
          </label>
        </section>
      </section>
      <section className="grid grid-cols-2 gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddPanel}
          className="h-7 justify-start rounded-[4px] px-2 font-mono text-[10px] font-semibold uppercase"
        >
          <Plus className="size-3.5" />
          {t('sidebar.canvas.addPanel')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutoAlignPanels}
          disabled={!canAutoAlignPanel}
          title={t('sidebar.canvas.autoAlignPanelsLabel')}
          className="h-7 justify-start rounded-[4px] px-2 font-mono text-[10px] font-semibold uppercase"
        >
          <AlignVerticalSpaceBetween className="size-3.5" />
          {t('sidebar.canvas.autoAlignPanels')}
        </Button>
      </section>
      <ol
        ref={panelListRef}
        className="grid max-h-[min(42vh,360px)] content-start gap-1.5 overflow-y-auto"
      >
        {selectedCanvasPanels.map((panel, index) => {
          const dropPosition =
            panelDragTarget?.panelId === panel.id
              ? panelDragTarget.position
              : null;

          return (
            <PanelListItem
              key={panel.id}
              panel={panel}
              index={index}
              isActive={selectedPanelIds.includes(panel.id)}
              isDragging={
                panel.id === panelPointerDrag?.sourcePanelId &&
                panelPointerDrag.hasMoved
              }
              canReorder={canReorderPanel}
              dropPosition={dropPosition}
              onSelect={handlePanelSelectRequest}
              onPointerDown={handlePanelPointerDown}
              onPointerMove={handlePanelPointerMove}
              onPointerUp={finishPanelPointerDrag}
              onPointerCancel={handlePanelPointerCancel}
            />
          );
        })}
      </ol>
    </SidebarCollapsibleSection>
  );
};

export { PanelList };
