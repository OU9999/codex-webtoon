import { getBubbleShapePatch, resolveBubbleStyle } from './bubble-style';
import type {
  Bubble,
  BubbleImpactStyle,
  LayerAction,
  LayerActionId,
} from './types';

const IMPACT_BASE_PATCH: Partial<Bubble> = {
  ...getBubbleShapePatch('jagged'),
  width: 360,
  height: 250,
  fontSize: 30,
  borderWidth: 1.4,
  fillColor: '#ffffff',
  textColor: '#000000',
  borderColor: '#000000',
  fontFamily: 'inter',
  fontWeight: 'bold',
};

const getImpactPatch = (
  impactStyle: BubbleImpactStyle,
  text: string,
  borderWidth: number,
): Partial<Bubble> => ({
  ...IMPACT_BASE_PATCH,
  impactStyle,
  text,
  borderWidth,
});

const layerActions: LayerAction[] = [
  {
    id: 'speech',
    type: 'speech',
    label: 'Speech',
    patch: getBubbleShapePatch('rounded'),
  },
  {
    id: 'oval',
    type: 'speech',
    label: 'Oval',
    patch: getBubbleShapePatch('oval'),
  },
  {
    id: 'cloud',
    type: 'speech',
    label: 'Cloud',
    patch: getBubbleShapePatch('cloud'),
  },
  {
    id: 'impact-thought-thick',
    type: 'speech',
    label: 'Impact Thought Thick',
    patch: getImpactPatch('impact-thought-thick', '임팩트 생각\n(두꺼움)', 1.7),
  },
  {
    id: 'shock-thought-thick',
    type: 'speech',
    label: 'Thought Thick',
    patch: getImpactPatch('shock-thought-thick', '생각\n(두꺼움)', 1.7),
  },
  {
    id: 'simple-thought-thick',
    type: 'speech',
    label: 'Simple Thought Thick',
    patch: getImpactPatch('simple-thought-thick', '단순 생각\n(두꺼움)', 1.7),
  },
  {
    id: 'box',
    type: 'monologue',
    label: 'Box',
    patch: getBubbleShapePatch('square'),
  },
  {
    id: 'thought',
    type: 'thought',
    label: 'Thought',
    patch: { ...getBubbleShapePatch('rounded'), borderStyle: 'dashed' },
  },
  {
    id: 'sfx',
    type: 'sfx',
    label: 'SFX',
    patch: {
      borderWidth: 0,
      fontFamily: 'display',
      fontWeight: 'bold',
    },
  },
];

const layerAddActionIds: LayerActionId[] = [
  'speech',
  'oval',
  'cloud',
  'shock-thought-thick',
  'box',
  'thought',
  'sfx',
];

const layerAddActions: LayerAction[] = layerAddActionIds.map((id) => {
  const action = layerActions.find((candidate) => candidate.id === id);
  if (!action) {
    throw new Error(`Missing layer action: ${id}`);
  }

  if (id === 'shock-thought-thick') {
    return { ...action, labelKey: 'layerActions.shockThought' };
  }

  return action;
});

const getLayerActionById = (id: string): LayerAction | null => {
  return layerActions.find((action) => action.id === id) ?? null;
};

const getLayerActionPatch = (action: LayerAction): Partial<Bubble> => {
  return { type: action.type, ...action.patch };
};

const getLayerActionStylePatch = (action: LayerAction): Partial<Bubble> => {
  const patch = { ...getLayerActionPatch(action) };
  delete patch.text;
  delete patch.x;
  delete patch.y;
  delete patch.width;
  delete patch.height;
  delete patch.fontSize;

  return patch;
};

const getLayerActionIdForBubble = (bubble: Bubble): LayerActionId => {
  if (bubble.type === 'monologue') return 'box';
  if (bubble.type === 'thought') return 'thought';
  if (bubble.type === 'sfx') return 'sfx';

  const style = resolveBubbleStyle(bubble);
  if (style.shape === 'oval') return 'oval';
  if (style.shape === 'cloud') return 'cloud';
  if (style.shape === 'jagged') return style.impactStyle;

  return 'speech';
};

export {
  getLayerActionById,
  getLayerActionIdForBubble,
  getLayerActionPatch,
  getLayerActionStylePatch,
  layerAddActions,
  layerActions,
};
