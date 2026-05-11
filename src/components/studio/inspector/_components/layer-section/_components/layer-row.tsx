import { Bot, MessageCircle, SquarePen, Type } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Bubble, BubbleType } from '@/components/studio/_lib/types';

interface LayerRowProps {
  bubble: Bubble;
  isActive: boolean;
  onSelect: (bubbleId: string) => void;
}

const TYPE_ICONS: Record<BubbleType, ReactNode> = {
  speech: <MessageCircle className="size-3.5" />,
  monologue: <SquarePen className="size-3.5" />,
  thought: <Bot className="size-3.5" />,
  sfx: <Type className="size-3.5" />,
};

const TYPE_LABELS: Record<BubbleType, string> = {
  speech: 'SPEECH',
  monologue: 'BOX',
  thought: 'THOUGHT',
  sfx: 'SFX',
};

const LayerRow = ({ bubble, isActive, onSelect }: LayerRowProps) => {
  const handleSelect = (): void => {
    onSelect(bubble.id);
  };

  return (
    <button
      type="button"
      className={cn(
        'grid w-full grid-cols-[18px_58px_minmax(0,1fr)] items-center gap-2 rounded-md border border-rim bg-background px-2.5 py-2 text-left transition-colors hover:bg-hover',
        isActive && 'border-brand bg-brand-soft text-brand',
      )}
      onClick={handleSelect}
    >
      <span className="text-fg-muted">{TYPE_ICONS[bubble.type]}</span>
      <span className="font-mono text-[9.5px] tracking-[0.08em]">
        {TYPE_LABELS[bubble.type]}
      </span>
      <span className="truncate text-[11.5px] text-fg-secondary">
        {bubble.text}
      </span>
    </button>
  );
};

export { LayerRow };
