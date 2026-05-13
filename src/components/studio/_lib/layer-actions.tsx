import {
  Bot,
  Cloud,
  MessageCircle,
  Sparkles,
  SquarePen,
  Type,
} from 'lucide-react';
import { getBubbleShapePatch, resolveBubbleStyle } from './bubble-style';
import type { Bubble, LayerAction, LayerActionId } from './types';

const layerActions: LayerAction[] = [
  {
    id: 'speech',
    type: 'speech',
    label: 'Speech',
    icon: <MessageCircle className="size-4" />,
    patch: getBubbleShapePatch('rounded'),
  },
  {
    id: 'oval',
    type: 'speech',
    label: 'Oval',
    icon: <MessageCircle className="size-4" />,
    patch: getBubbleShapePatch('oval'),
  },
  {
    id: 'cloud',
    type: 'speech',
    label: 'Cloud',
    icon: <Cloud className="size-4" />,
    patch: getBubbleShapePatch('cloud'),
  },
  {
    id: 'jagged',
    type: 'speech',
    label: 'Jagged',
    icon: <Sparkles className="size-4" />,
    patch: getBubbleShapePatch('jagged'),
  },
  {
    id: 'box',
    type: 'monologue',
    label: 'Box',
    icon: <SquarePen className="size-4" />,
    patch: getBubbleShapePatch('square'),
  },
  {
    id: 'thought',
    type: 'thought',
    label: 'Thought',
    icon: <Bot className="size-4" />,
    patch: { ...getBubbleShapePatch('rounded'), borderStyle: 'dashed' },
  },
  {
    id: 'sfx',
    type: 'sfx',
    label: 'SFX',
    icon: <Type className="size-4" />,
    patch: {
      borderWidth: 0,
      fontFamily: 'display',
      fontWeight: 'bold',
    },
  },
];

const getLayerActionById = (id: string): LayerAction | null => {
  return layerActions.find((action) => action.id === id) ?? null;
};

const getLayerActionPatch = (action: LayerAction): Partial<Bubble> => {
  return { type: action.type, ...action.patch };
};

const getLayerActionIdForBubble = (bubble: Bubble): LayerActionId => {
  if (bubble.type === 'monologue') return 'box';
  if (bubble.type === 'thought') return 'thought';
  if (bubble.type === 'sfx') return 'sfx';

  const style = resolveBubbleStyle(bubble);
  if (style.shape === 'oval') return 'oval';
  if (style.shape === 'cloud') return 'cloud';
  if (style.shape === 'jagged') return 'jagged';

  return 'speech';
};

export {
  getLayerActionById,
  getLayerActionIdForBubble,
  getLayerActionPatch,
  layerActions,
};
