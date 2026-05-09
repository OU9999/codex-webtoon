import type { Bubble, BubbleType, CreatePanelOverrides, Panel } from './types';

const createPanel = (overrides: CreatePanelOverrides = {}): Panel => {
  return {
    id: crypto.randomUUID(),
    title: overrides.title ?? 'New panel',
    height: overrides.height ?? 420,
    prompt: overrides.prompt ?? '',
    candidates: overrides.candidates ?? [],
    selectedCandidateId: overrides.selectedCandidateId ?? null,
    deletedCandidates: [],
    bubbles: overrides.bubbles ?? [],
  };
};

const createBubble = (type: BubbleType): Bubble => {
  const defaults: Record<BubbleType, Omit<Bubble, 'id' | 'type'>> = {
    speech: {
      text: '대사',
      x: 58,
      y: 40,
      width: 210,
      height: 74,
      fontSize: 24,
    },
    monologue: {
      text: '독백',
      x: 46,
      y: 56,
      width: 250,
      height: 78,
      fontSize: 22,
    },
    thought: {
      text: '생각',
      x: 390,
      y: 54,
      width: 210,
      height: 76,
      fontSize: 22,
    },
    sfx: { text: '탁', x: 420, y: 170, width: 150, height: 82, fontSize: 48 },
  };

  return {
    id: crypto.randomUUID(),
    type,
    ...defaults[type],
  };
};

const starterPanels: Panel[] = [
  createPanel({
    title: 'Opening beat',
    height: 420,
    prompt:
      '비 오는 저녁, 민지가 버스정류장 아래에서 휴대폰 알림을 확인한다. 미디엄 샷.',
  }),
  createPanel({
    title: 'Reaction close-up',
    height: 330,
    prompt:
      '민지의 눈이 흔들리는 클로즈업. 화면에는 텍스트 없이 감정만 드러난다.',
  }),
  createPanel({
    title: 'Long pause',
    height: 560,
    prompt: '',
  }),
];

export { createBubble, createPanel, starterPanels };
