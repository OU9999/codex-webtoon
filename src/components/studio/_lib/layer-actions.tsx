import {
  Bot,
  Cloud,
  MessageCircle,
  Sparkles,
  SquarePen,
  Type,
} from 'lucide-react';
import { getBubbleShapePatch } from './bubble-style';
import type { LayerAction } from './types';

const layerActions: LayerAction[] = [
  {
    type: 'speech',
    label: 'Speech',
    icon: <MessageCircle className="size-4" />,
  },
  {
    type: 'speech',
    label: 'Oval',
    icon: <MessageCircle className="size-4" />,
    patch: getBubbleShapePatch('oval'),
  },
  {
    type: 'speech',
    label: 'Cloud',
    icon: <Cloud className="size-4" />,
    patch: getBubbleShapePatch('cloud'),
  },
  {
    type: 'speech',
    label: 'Jagged',
    icon: <Sparkles className="size-4" />,
    patch: getBubbleShapePatch('jagged'),
  },
  { type: 'monologue', label: 'Box', icon: <SquarePen className="size-4" /> },
  { type: 'thought', label: 'Thought', icon: <Bot className="size-4" /> },
  { type: 'sfx', label: 'SFX', icon: <Type className="size-4" /> },
];

export { layerActions };
