import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { getLayerActionPatch, layerAddActions } from '../../_lib/layer-actions';
import type { BubbleType, LayerAction } from '../../_lib/types';
import { useStudioContext } from '../../studio-context';
import { SidebarCollapsibleSection } from './sidebar-collapsible-section';

interface BubbleActionButtonProps {
  action: LayerAction;
  disabled: boolean;
  onAdd: (type: BubbleType, patch?: LayerAction['patch']) => void;
}

const BubbleActionButton = ({
  action,
  disabled,
  onAdd,
}: BubbleActionButtonProps) => {
  const { t } = useTranslation();

  const handleAdd = (): void => {
    onAdd(action.type, getLayerActionPatch(action));
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={handleAdd}
      className="h-7 justify-start rounded-[4px] px-2 font-mono text-[10px] font-semibold uppercase"
    >
      {action.icon}
      <span>+ {t(action.labelKey ?? `layerActions.${action.id}`)}</span>
    </Button>
  );
};

const BubbleActions = () => {
  const { t } = useTranslation();
  const {
    handleLayerAdd,
    selectedCanvas,
    selectedCanvasPanels,
    selectedPanel,
  } = useStudioContext();
  const isDisabled = !selectedCanvas;
  const layerCount = selectedPanel
    ? selectedPanel.bubbles.length
    : selectedCanvasPanels.reduce(
        (count, panel) => count + panel.bubbles.length,
        0,
      );
  const meta = t('sidebar.balloons.meta', { count: layerCount });

  return (
    <SidebarCollapsibleSection
      icon={<MessageCircle className="size-4" />}
      title={t('sidebar.balloons.title')}
      meta={meta}
    >
      <header className="mb-2 flex items-center justify-between gap-3 font-mono text-[9.5px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
        <span>{t('sidebar.balloons.layerTools')}</span>
        <span>
          {isDisabled ? t('sidebar.balloons.noPanels') : t('common.ready')}
        </span>
      </header>
      <nav
        className="grid grid-cols-2 gap-2"
        aria-label={t('sidebar.balloons.actionsLabel')}
      >
        {layerAddActions.map((action) => (
          <BubbleActionButton
            key={action.id}
            action={action}
            disabled={isDisabled}
            onAdd={handleLayerAdd}
          />
        ))}
      </nav>
    </SidebarCollapsibleSection>
  );
};

export { BubbleActions };
