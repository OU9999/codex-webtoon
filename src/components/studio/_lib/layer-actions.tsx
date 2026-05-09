import { Bot, MessageCircle, SquarePen, Type } from 'lucide-react';
import type { LayerAction } from './types';

const layerActions: LayerAction[] = [
  {
    type: 'speech',
    label: 'Speech',
    icon: <MessageCircle className="size-4" />,
  },
  { type: 'monologue', label: 'Box', icon: <SquarePen className="size-4" /> },
  { type: 'thought', label: 'Thought', icon: <Bot className="size-4" /> },
  { type: 'sfx', label: 'SFX', icon: <Type className="size-4" /> },
];

export { layerActions };
