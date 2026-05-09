import { ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPanelClassName } from '@/components/studio/_lib/class-names';
import type {
  BubbleDragStartPayload,
  Panel,
} from '@/components/studio/_lib/types';
import { BubbleLayer } from './_components/bubble-layer';

interface PanelCanvasItemProps {
  panel: Panel;
  index: number;
  isSelected: boolean;
  selectedBubbleId: string | null;
  onBubbleDragStart: (payload: BubbleDragStartPayload) => void;
  onSelect: (panelId: string) => void;
}

const PanelCanvasItem = ({
  panel,
  index,
  isSelected,
  selectedBubbleId,
  onBubbleDragStart,
  onSelect,
}: PanelCanvasItemProps) => {
  const selectedCandidate = panel.candidates.find(
    (item) => item.id === panel.selectedCandidateId,
  );

  const handleSelect = (): void => {
    onSelect(panel.id);
  };

  return (
    <article
      className={cn(
        'panel-frame',
        getPanelClassName(panel),
        isSelected && 'selected',
      )}
      onClick={handleSelect}
    >
      {selectedCandidate ? (
        <img
          src={selectedCandidate.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <p className="empty-panel">
          <ImagePlus className="size-9" />
          <span>빈 패널</span>
        </p>
      )}
      <span className="panel-number">{index + 1}</span>
      {isSelected && <span className="selected-rim" />}
      {panel.bubbles.map((bubble) => (
        <BubbleLayer
          key={bubble.id}
          bubble={bubble}
          panel={panel}
          isSelected={bubble.id === selectedBubbleId}
          onDragStart={onBubbleDragStart}
        />
      ))}
    </article>
  );
};

export { PanelCanvasItem };
