import { useEffect, useRef, useState } from 'react';
import type {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bot,
  ChevronLeft,
  Copy,
  Download,
  GripVertical,
  ImagePlus,
  MessageCircle,
  PanelTop,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  SquarePen,
  Trash2,
  Type,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const CANVAS_WIDTH = 720;
const STORAGE_KEY = 'webtoon-panel-studio:v1';
const DYNAMIC_STYLE_ELEMENT_ID = 'webtoon-panel-studio-dynamic-styles';

const defaultCommonPrompt = [
  '현대 한국 로맨스 웹툰, 부드러운 선화, 세미 리얼 캐릭터, 따뜻하지만 선명한 색감.',
  '캐릭터: 민지, 20대 초반 여성, 짧은 흑발 단발, 베이지 니트, 차분하지만 예민한 표정.',
  '공통 금지사항: 이미지 안에 읽을 수 있는 텍스트, 말풍선, 워터마크를 만들지 말 것.',
].join('\n');

type BubbleType = 'speech' | 'monologue' | 'thought' | 'sfx';
type BubbleDragMode = 'move' | 'resize';

interface Candidate {
  id: string;
  imageUrl: string;
  createdAt: string;
  promptSnapshot: string;
  height: number;
  provider: 'local-mock';
}

interface Bubble {
  id: string;
  type: BubbleType;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

interface Panel {
  id: string;
  title: string;
  height: number;
  prompt: string;
  candidates: Candidate[];
  selectedCandidateId: string | null;
  deletedCandidates: Candidate[];
  bubbles: Bubble[];
}

interface StudioState {
  commonPrompt: string;
  panels: Panel[];
  selectedPanelId: string;
  selectedBubbleId: string | null;
  panelGap: number;
}

interface CreatePanelOverrides extends Partial<
  Pick<
    Panel,
    | 'title'
    | 'height'
    | 'prompt'
    | 'candidates'
    | 'selectedCandidateId'
    | 'bubbles'
  >
> {}

interface Palette {
  sky: string;
  mid: string;
  ground: string;
  accent: string;
  skin: string;
  hair: string;
  ink: string;
}

interface BubbleDrag {
  mode: BubbleDragMode;
  panelId: string;
  bubbleId: string;
  rect: DOMRect;
  panelHeight: number;
  offsetX: number;
  offsetY: number;
}

interface BubbleDragStartPayload {
  event: ReactPointerEvent<HTMLElement>;
  bubble: Bubble;
  panel: Panel;
  mode: BubbleDragMode;
}

interface LayerAction {
  type: BubbleType;
  label: string;
  icon: ReactNode;
}

const createPanel = (overrides: CreatePanelOverrides = {}): Panel => {
  const id = crypto.randomUUID();

  return {
    id,
    title: overrides.title ?? 'New panel',
    height: overrides.height ?? 420,
    prompt: overrides.prompt ?? '',
    candidates: overrides.candidates ?? [],
    selectedCandidateId: overrides.selectedCandidateId ?? null,
    deletedCandidates: [],
    bubbles: overrides.bubbles ?? [],
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

const normalizeLoadedState = (value: unknown): StudioState | null => {
  const loaded = value as Partial<StudioState> | null;

  if (!loaded) return null;
  if (!Array.isArray(loaded.panels)) return null;
  if (loaded.panels.length === 0) return null;

  return {
    commonPrompt: loaded.commonPrompt ?? defaultCommonPrompt,
    panels: loaded.panels.map((panel) => ({
      ...panel,
      deletedCandidates: panel.deletedCandidates ?? [],
      bubbles: panel.bubbles ?? [],
    })),
    selectedPanelId: loaded.selectedPanelId ?? loaded.panels[0].id,
    selectedBubbleId: loaded.selectedBubbleId ?? null,
    panelGap:
      typeof loaded.panelGap === 'number' && Number.isFinite(loaded.panelGap)
        ? loaded.panelGap
        : 28,
  };
};

const getInitialState = (): StudioState => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) {
      return {
        commonPrompt: defaultCommonPrompt,
        panels: starterPanels,
        selectedPanelId: starterPanels[0].id,
        selectedBubbleId: null,
        panelGap: 28,
      };
    }

    const loaded = normalizeLoadedState(JSON.parse(savedState));
    if (loaded) return loaded;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    commonPrompt: defaultCommonPrompt,
    panels: starterPanels,
    selectedPanelId: starterPanels[0].id,
    selectedBubbleId: null,
    panelGap: 28,
  };
};

const safeClassSegment = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '-');

const getStripGapClassName = (gap: number): string => `wps-strip-gap-${gap}`;

const getPanelClassName = (panel: Panel): string =>
  `wps-panel-${safeClassSegment(panel.id)}`;

const getBubbleClassName = (panel: Panel, bubble: Bubble): string =>
  `wps-bubble-${safeClassSegment(panel.id)}-${safeClassSegment(bubble.id)}`;

const buildFinalPrompt = ({
  commonPrompt,
  panel,
}: {
  commonPrompt: string;
  panel?: Panel;
}): string => {
  if (!panel) return commonPrompt.trim();

  return [
    commonPrompt.trim(),
    panel.prompt.trim(),
    `Panel spec: vertical webtoon panel, output width ${CANVAS_WIDTH}px, panel height ${panel.height}px, no readable text in image.`,
  ]
    .filter(Boolean)
    .join('\n\n');
};

const buildDynamicStyles = (state: StudioState): string => {
  const rules = [
    `.${getStripGapClassName(state.panelGap)}{gap:${state.panelGap}px}`,
  ];

  state.panels.forEach((panel) => {
    rules.push(
      `.${getPanelClassName(panel)}{aspect-ratio:${CANVAS_WIDTH}/${panel.height}}`,
    );

    panel.bubbles.forEach((bubble) => {
      const left = (bubble.x / CANVAS_WIDTH) * 100;
      const top = (bubble.y / panel.height) * 100;
      const width = (bubble.width / CANVAS_WIDTH) * 100;
      const height = (bubble.height / panel.height) * 100;
      const viewportSize = (bubble.fontSize / CANVAS_WIDTH) * 100;

      rules.push(
        [
          `.${getBubbleClassName(panel, bubble)}{`,
          `left:${left}%;`,
          `top:${top}%;`,
          `width:${width}%;`,
          `height:${height}%;`,
          `font-size:clamp(12px,${viewportSize}vw,${bubble.fontSize}px);`,
          '}',
        ].join(''),
      );
    });
  });

  return rules.join('\n');
};

const generatePanelImage = ({
  panel,
  commonPrompt,
}: {
  panel: Panel;
  commonPrompt: string;
}): string => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = panel.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  const seed = hashString(`${commonPrompt}|${panel.prompt}|${Date.now()}`);
  const palette = pickPalette(seed);
  const horizon = Math.max(panel.height * 0.35, 128);

  const sky = ctx.createLinearGradient(0, 0, 0, panel.height);
  sky.addColorStop(0, palette.sky);
  sky.addColorStop(0.52, palette.mid);
  sky.addColorStop(1, palette.ground);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, panel.height);

  ctx.fillStyle = withAlpha(palette.ink, 0.12);
  for (let i = 0; i < 9; i += 1) {
    const x = ((seed >> (i % 12)) % 640) - 60 + i * 22;
    const w = 58 + ((seed + i * 37) % 86);
    const h = 90 + ((seed + i * 53) % 170);
    ctx.fillRect(x, horizon - h + 24, w, h);
  }

  drawSpeedLines(ctx, seed, panel.height, palette.ink);
  drawCharacter(
    ctx,
    260 + (seed % 90),
    Math.min(panel.height - 42, horizon + 210),
    palette,
    seed,
  );
  drawCharacter(
    ctx,
    448 - (seed % 70),
    Math.min(panel.height - 36, horizon + 230),
    palette,
    seed + 19,
    true,
  );
  drawForeground(ctx, panel.height, palette);

  ctx.lineWidth = 7;
  ctx.strokeStyle = withAlpha(palette.ink, 0.58);
  ctx.strokeRect(18, 18, CANVAS_WIDTH - 36, panel.height - 36);

  return canvas.toDataURL('image/png');
};

const drawSpeedLines = (
  ctx: CanvasRenderingContext2D,
  seed: number,
  height: number,
  ink: string,
): void => {
  ctx.save();
  ctx.strokeStyle = withAlpha(ink, 0.12);
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i += 1) {
    const x = (seed * (i + 3)) % CANVAS_WIDTH;
    const y = (seed >> (i % 15)) % Math.max(height, 1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 80 + (i % 3) * 32, y + 24 + (i % 4) * 8);
    ctx.stroke();
  }
  ctx.restore();
};

const drawCharacter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  palette: Palette,
  seed: number,
  mirrored = false,
): void => {
  ctx.save();
  ctx.translate(x, baseline);
  ctx.scale(mirrored ? -1 : 1, 1);

  ctx.fillStyle = palette.accent;
  roundedRect(ctx, -58, -152, 116, 142, 58);
  ctx.fill();

  ctx.fillStyle = palette.skin;
  ctx.beginPath();
  ctx.ellipse(0, -190, 48, 56, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.hair;
  ctx.beginPath();
  ctx.ellipse(-6, -208, 54, 48, -0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-48, -206, 96, 36);

  ctx.strokeStyle = withAlpha(palette.ink, 0.5);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-24, -190);
  ctx.quadraticCurveTo(-8, -182 + (seed % 6), 8, -190);
  ctx.moveTo(18, -190);
  ctx.quadraticCurveTo(30, -184, 40, -190);
  ctx.stroke();

  ctx.fillStyle = withAlpha(palette.ink, 0.84);
  ctx.beginPath();
  ctx.ellipse(-15, -197, 4, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(23, -197, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = withAlpha(palette.ink, 0.4);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-66, -122);
  ctx.lineTo(-108, -64);
  ctx.moveTo(66, -122);
  ctx.lineTo(102, -68);
  ctx.stroke();

  ctx.restore();
};

const drawForeground = (
  ctx: CanvasRenderingContext2D,
  height: number,
  palette: Palette,
): void => {
  ctx.fillStyle = withAlpha(palette.ink, 0.16);
  ctx.fillRect(0, height - 34, CANVAS_WIDTH, 34);
  ctx.strokeStyle = withAlpha(palette.ink, 0.2);
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    const y = height - 28 + i * 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y + (i % 2 ? 3 : -2));
    ctx.stroke();
  }
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const pickPalette = (seed: number): Palette => {
  const palettes: Palette[] = [
    {
      sky: '#f7d9c4',
      mid: '#9cc7bf',
      ground: '#4b6f68',
      accent: '#ef775f',
      skin: '#f4c9a8',
      hair: '#2d2a2c',
      ink: '#202427',
    },
    {
      sky: '#c9e6e0',
      mid: '#f0c96f',
      ground: '#6e8063',
      accent: '#3f7f93',
      skin: '#ecc09d',
      hair: '#31313a',
      ink: '#1f2828',
    },
    {
      sky: '#efc7bd',
      mid: '#e9e0a9',
      ground: '#58717b',
      accent: '#b75e69',
      skin: '#f1c7ad',
      hair: '#29272b',
      ink: '#242629',
    },
    {
      sky: '#d6d5ef',
      mid: '#9fcbbb',
      ground: '#67755f',
      accent: '#d98745',
      skin: '#eec3a4',
      hair: '#23282e',
      ink: '#20252a',
    },
  ];

  return palettes[seed % palettes.length]!;
};

const withAlpha = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const words = String(text || '')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
      return;
    }
    lines.push(line);
    line = word;
  });

  lines.push(line);
  return lines;
};

const loadImage = async (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const drawEmptyPanel = (
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
): void => {
  ctx.fillStyle = '#eceee8';
  ctx.fillRect(0, y, CANVAS_WIDTH, height);
  ctx.strokeStyle = '#ced4cb';
  ctx.lineWidth = 2;
  for (let i = -height; i < CANVAS_WIDTH; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, y + height);
    ctx.lineTo(i + height, y);
    ctx.stroke();
  }
};

const drawBubbleToCanvas = (
  ctx: CanvasRenderingContext2D,
  bubble: Bubble,
  offsetY: number,
): void => {
  ctx.save();
  ctx.font = `700 ${bubble.fontSize}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (bubble.type === 'sfx') {
    ctx.fillStyle = '#111417';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.font = `900 ${bubble.fontSize}px Inter, Arial, sans-serif`;
    ctx.strokeText(
      bubble.text,
      bubble.x + bubble.width / 2,
      offsetY + bubble.y + bubble.height / 2,
    );
    ctx.fillText(
      bubble.text,
      bubble.x + bubble.width / 2,
      offsetY + bubble.y + bubble.height / 2,
    );
    ctx.restore();
    return;
  }

  ctx.fillStyle = bubble.type === 'monologue' ? '#fff4cf' : '#ffffff';
  ctx.strokeStyle = '#1e2225';
  ctx.lineWidth = 4;
  roundedRect(
    ctx,
    bubble.x,
    offsetY + bubble.y,
    bubble.width,
    bubble.height,
    bubble.type === 'monologue' ? 6 : 34,
  );
  ctx.fill();
  ctx.stroke();

  if (bubble.type === 'speech') {
    ctx.beginPath();
    ctx.moveTo(
      bubble.x + bubble.width * 0.62,
      offsetY + bubble.y + bubble.height - 2,
    );
    ctx.lineTo(
      bubble.x + bubble.width * 0.72,
      offsetY + bubble.y + bubble.height + 34,
    );
    ctx.lineTo(
      bubble.x + bubble.width * 0.49,
      offsetY + bubble.y + bubble.height - 6,
    );
    ctx.fill();
    ctx.stroke();
  }

  const lines = wrapText(ctx, bubble.text, bubble.width - 28).slice(0, 4);
  ctx.fillStyle = '#111417';
  lines.forEach((line, index) => {
    const lineHeight = bubble.fontSize * 1.15;
    const lineY =
      offsetY +
      bubble.y +
      bubble.height / 2 +
      (index - (lines.length - 1) / 2) * lineHeight;
    ctx.fillText(line, bubble.x + bubble.width / 2, lineY);
  });
  ctx.restore();
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const App = () => {
  const [state, setState] = useState<StudioState>(getInitialState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dragRef = useRef<BubbleDrag | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  const selectedPanel =
    state.panels.find((panel) => panel.id === state.selectedPanelId) ??
    state.panels[0];
  const selectedCandidate = selectedPanel?.candidates.find(
    (candidate) => candidate.id === selectedPanel.selectedCandidateId,
  );
  const selectedBubble = selectedPanel?.bubbles.find(
    (bubble) => bubble.id === state.selectedBubbleId,
  );
  const finalPrompt = buildFinalPrompt({
    commonPrompt: state.commonPrompt,
    panel: selectedPanel,
  });
  const dynamicStyles = buildDynamicStyles(state);

  const patchSelectedPanel = (patch: Partial<Panel>): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) =>
        panel.id === current.selectedPanelId ? { ...panel, ...patch } : panel,
      ),
    }));
  };

  const patchSelectedBubble = (patch: Partial<Bubble>): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;

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

  const moveSelectedPanel = (direction: number): void => {
    setState((current) => {
      const index = current.panels.findIndex(
        (panel) => panel.id === current.selectedPanelId,
      );
      const target = index + direction;
      if (index < 0) return current;
      if (target < 0) return current;
      if (target >= current.panels.length) return current;

      const panels = [...current.panels];
      const [panel] = panels.splice(index, 1);
      if (!panel) return current;

      panels.splice(target, 0, panel);
      return { ...current, panels };
    });
  };

  const handleCommonPromptChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    const commonPrompt = event.target.value;
    setState((current) => ({ ...current, commonPrompt }));
  };

  const handleAddPanel = (): void => {
    const panel = createPanel({
      title: `Panel ${state.panels.length + 1}`,
      height: 420,
    });

    setState((current) => {
      const selectedIndex = current.panels.findIndex(
        (item) => item.id === current.selectedPanelId,
      );
      const insertAt =
        selectedIndex >= 0 ? selectedIndex + 1 : current.panels.length;
      const panels = [...current.panels];
      panels.splice(insertAt, 0, panel);

      return {
        ...current,
        panels,
        selectedPanelId: panel.id,
        selectedBubbleId: null,
      };
    });
  };

  const handleDuplicatePanel = (): void => {
    if (!selectedPanel) return;

    const duplicate = createPanel({
      title: `${selectedPanel.title} copy`,
      height: selectedPanel.height,
      prompt: selectedPanel.prompt,
      candidates: selectedPanel.candidates,
      selectedCandidateId: selectedPanel.selectedCandidateId,
      bubbles: selectedPanel.bubbles.map((bubble) => ({
        ...bubble,
        id: crypto.randomUUID(),
      })),
    });

    setState((current) => {
      const selectedIndex = current.panels.findIndex(
        (item) => item.id === current.selectedPanelId,
      );
      const panels = [...current.panels];
      panels.splice(selectedIndex + 1, 0, duplicate);
      return {
        ...current,
        panels,
        selectedPanelId: duplicate.id,
        selectedBubbleId: null,
      };
    });
  };

  const handleDeletePanel = (): void => {
    if (state.panels.length <= 1) return;

    setState((current) => {
      const index = current.panels.findIndex(
        (panel) => panel.id === current.selectedPanelId,
      );
      const panels = current.panels.filter(
        (panel) => panel.id !== current.selectedPanelId,
      );
      const nextPanel = panels[Math.min(index, panels.length - 1)];
      if (!nextPanel) return current;

      return {
        ...current,
        panels,
        selectedPanelId: nextPanel.id,
        selectedBubbleId: null,
      };
    });
  };

  const handleMovePanelUp = (): void => {
    moveSelectedPanel(-1);
  };

  const handleMovePanelDown = (): void => {
    moveSelectedPanel(1);
  };

  const handlePanelGapChange = (value: number[]): void => {
    const panelGap = value[0];
    if (typeof panelGap !== 'number') return;

    setState((current) => ({ ...current, panelGap }));
  };

  const handlePanelSelect = (panelId: string): void => {
    setState((current) => ({
      ...current,
      selectedPanelId: panelId,
      selectedBubbleId: null,
    }));
  };

  const handleSelectedPanelTitleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedPanel({ title: event.target.value });
  };

  const handleSelectedPanelHeightChange = (value: number[]): void => {
    const height = value[0];
    if (typeof height !== 'number') return;

    patchSelectedPanel({ height });
  };

  const handleSelectedPanelPromptChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    patchSelectedPanel({ prompt: event.target.value });
  };

  const handleGenerateSelectedPanel = async (): Promise<void> => {
    if (!selectedPanel) return;
    if (isGenerating) return;

    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 450));
    const imageUrl = generatePanelImage({
      panel: selectedPanel,
      commonPrompt: state.commonPrompt,
    });
    const candidate: Candidate = {
      id: crypto.randomUUID(),
      imageUrl,
      createdAt: new Date().toISOString(),
      promptSnapshot: finalPrompt,
      height: selectedPanel.height,
      provider: 'local-mock',
    };

    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) =>
        panel.id === current.selectedPanelId
          ? {
              ...panel,
              candidates: [candidate, ...panel.candidates],
              selectedCandidateId: candidate.id,
            }
          : panel,
      ),
    }));
    setIsGenerating(false);
  };

  const handleCandidateSelect = (candidateId: string): void => {
    patchSelectedPanel({ selectedCandidateId: candidateId });
  };

  const handleCandidateDelete = (candidateId: string): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;

        const candidate = panel.candidates.find(
          (item) => item.id === candidateId,
        );
        const candidates = panel.candidates.filter(
          (item) => item.id !== candidateId,
        );
        return {
          ...panel,
          candidates,
          selectedCandidateId:
            panel.selectedCandidateId === candidateId
              ? (candidates[0]?.id ?? null)
              : panel.selectedCandidateId,
          deletedCandidates: candidate
            ? [candidate, ...panel.deletedCandidates].slice(0, 5)
            : panel.deletedCandidates,
        };
      }),
    }));
  };

  const handleRestoreCandidate = (): void => {
    setState((current) => ({
      ...current,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;
        if (panel.deletedCandidates.length === 0) return panel;

        const [candidate, ...deletedCandidates] = panel.deletedCandidates;
        if (!candidate) return panel;

        return {
          ...panel,
          candidates: [candidate, ...panel.candidates],
          selectedCandidateId: candidate.id,
          deletedCandidates,
        };
      }),
    }));
  };

  const handleLayerAdd = (type: BubbleType): void => {
    const bubble = createBubble(type);
    setState((current) => ({
      ...current,
      selectedBubbleId: bubble.id,
      panels: current.panels.map((panel) =>
        panel.id === current.selectedPanelId
          ? { ...panel, bubbles: [...panel.bubbles, bubble] }
          : panel,
      ),
    }));
  };

  const handleBubbleTextChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ text: event.target.value });
  };

  const handleBubbleFontSizeChange = (value: number[]): void => {
    const fontSize = value[0];
    if (typeof fontSize !== 'number') return;

    patchSelectedBubble({ fontSize });
  };

  const handleSelectedBubbleDelete = (): void => {
    setState((current) => ({
      ...current,
      selectedBubbleId: null,
      panels: current.panels.map((panel) => {
        if (panel.id !== current.selectedPanelId) return panel;

        return {
          ...panel,
          bubbles: panel.bubbles.filter(
            (bubble) => bubble.id !== current.selectedBubbleId,
          ),
        };
      }),
    }));
  };

  const handleBubbleDragStart = ({
    event,
    bubble,
    panel,
    mode,
  }: BubbleDragStartPayload): void => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const frame = event.currentTarget.closest<HTMLElement>('.panel-frame');
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const pointerY = ((event.clientY - rect.top) / rect.height) * panel.height;

    setState((current) => ({
      ...current,
      selectedPanelId: panel.id,
      selectedBubbleId: bubble.id,
    }));
    dragRef.current = {
      mode,
      panelId: panel.id,
      bubbleId: bubble.id,
      rect,
      panelHeight: panel.height,
      offsetX: pointerX - bubble.x,
      offsetY: pointerY - bubble.y,
    };
  };

  const handleWebtoonPngExport = async (): Promise<void> => {
    setIsExporting(true);
    const totalHeight =
      state.panels.reduce((sum, panel) => sum + panel.height, 0) +
      state.panelGap * (state.panels.length - 1);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    ctx.fillStyle = '#f7f7f4';
    ctx.fillRect(0, 0, CANVAS_WIDTH, totalHeight);

    let y = 0;
    for (const panel of state.panels) {
      const candidate = panel.candidates.find(
        (item) => item.id === panel.selectedCandidateId,
      );
      if (candidate?.imageUrl) {
        try {
          const image = await loadImage(candidate.imageUrl);
          ctx.drawImage(image, 0, y, CANVAS_WIDTH, panel.height);
        } catch {
          drawEmptyPanel(ctx, y, panel.height);
        }
      } else {
        drawEmptyPanel(ctx, y, panel.height);
      }

      ctx.strokeStyle = '#1f2326';
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, y + 1.5, CANVAS_WIDTH - 3, panel.height - 3);
      panel.bubbles.forEach((bubble) => drawBubbleToCanvas(ctx, bubble, y));
      y += panel.height + state.panelGap;
    }

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `webtoon-panel-${Date.now()}.png`);
      setIsExporting(false);
    }, 'image/png');
  };

  const handleProjectJsonExport = (): void => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `webtoon-panel-project-${Date.now()}.json`);
  };

  /**
   * Persists the current studio state locally so the editor can resume after refresh.
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  /**
   * Synchronizes dynamic panel and bubble layout CSS without using JSX inline style props.
   */
  useEffect(() => {
    if (!styleElementRef.current) {
      const existingElement = document.getElementById(DYNAMIC_STYLE_ELEMENT_ID);
      if (existingElement instanceof HTMLStyleElement) {
        styleElementRef.current = existingElement;
      } else {
        const styleElement = document.createElement('style');
        styleElement.id = DYNAMIC_STYLE_ELEMENT_ID;
        document.head.appendChild(styleElement);
        styleElementRef.current = styleElement;
      }
    }

    styleElementRef.current.textContent = dynamicStyles;
  }, [dynamicStyles]);

  /**
   * Handles global pointer movement while a canvas bubble layer is being dragged or resized.
   */
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const drag = dragRef.current;
      if (!drag) return;

      const x = clamp(
        ((event.clientX - drag.rect.left) / drag.rect.width) * CANVAS_WIDTH,
        0,
        CANVAS_WIDTH - 24,
      );
      const y = clamp(
        ((event.clientY - drag.rect.top) / drag.rect.height) * drag.panelHeight,
        0,
        drag.panelHeight - 24,
      );

      setState((current) => ({
        ...current,
        panels: current.panels.map((panel) => {
          if (panel.id !== drag.panelId) return panel;

          return {
            ...panel,
            bubbles: panel.bubbles.map((bubble) => {
              if (bubble.id !== drag.bubbleId) return bubble;
              if (drag.mode === 'move') {
                return {
                  ...bubble,
                  x: clamp(x - drag.offsetX, 0, CANVAS_WIDTH - bubble.width),
                  y: clamp(y - drag.offsetY, 0, panel.height - bubble.height),
                };
              }

              return {
                ...bubble,
                width: clamp(x - bubble.x, 72, CANVAS_WIDTH - bubble.x),
                height: clamp(y - bubble.y, 44, panel.height - bubble.y),
              };
            }),
          };
        }),
      }));
    };

    const handlePointerUp = (): void => {
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-auto flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:h-[68px] md:flex-row md:items-center md:justify-between md:px-6 md:py-0">
        <h1 className="flex items-center gap-3">
          <PanelTop className="size-6 text-primary" />
          <span>
            <strong className="block text-base leading-none">
              Webtoon Panel Studio
            </strong>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Local MVP
            </span>
          </span>
        </h1>
        <nav
          className="flex flex-wrap items-center gap-2"
          aria-label="Export actions"
        >
          <Badge variant="secondary" className="h-8 rounded-full px-3">
            <Bot className="size-4" />
            Local mock
          </Badge>
          <Button
            type="button"
            variant="outline"
            onClick={handleProjectJsonExport}
          >
            <Save className="size-4" />
            JSON
          </Button>
          <Button
            type="button"
            onClick={handleWebtoonPngExport}
            disabled={isExporting}
          >
            <Download className="size-4" />
            {isExporting ? 'Exporting' : 'PNG'}
          </Button>
        </nav>
      </header>

      <section className="grid min-h-[calc(100vh-68px)] grid-cols-1 lg:grid-cols-[318px_minmax(360px,1fr)] xl:grid-cols-[318px_minmax(360px,1fr)_356px]">
        <aside className="border-b bg-card/85 p-4 lg:border-r lg:border-b-0 xl:p-[18px]">
          <SectionTitle
            icon={<SquarePen className="size-4" />}
            title="Project"
          />
          <FieldBlock label="공용 프롬프트">
            <Textarea
              value={state.commonPrompt}
              onChange={handleCommonPromptChange}
              rows={11}
              className="resize-y bg-background leading-relaxed"
            />
          </FieldBlock>

          <nav className="mb-4 flex flex-wrap gap-2" aria-label="Panel actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPanel}
            >
              <Plus className="size-4" />
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDuplicatePanel}
            >
              <Copy className="size-4" />
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleMovePanelUp}
              aria-label="Move up"
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleMovePanelDown}
              aria-label="Move down"
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDeletePanel}
              aria-label="Delete panel"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </nav>

          <RangeField
            label="컷 사이 여백"
            value={state.panelGap}
            suffix="px"
            min={0}
            max={96}
            onValueChange={handlePanelGapChange}
          />

          <ol className="mt-4 grid gap-2">
            {state.panels.map((panel, index) => (
              <PanelListItem
                key={panel.id}
                panel={panel}
                index={index}
                isActive={panel.id === selectedPanel?.id}
                onSelect={handlePanelSelect}
              />
            ))}
          </ol>
        </aside>

        <section
          className="min-w-0 overflow-auto px-3 py-4 md:px-7 md:py-5"
          aria-label="Webtoon canvas"
        >
          <header className="mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-4 text-xs text-muted-foreground">
            <h2>
              <span>Episode canvas</span>
              <strong className="mt-0.5 block text-xl text-foreground">
                {state.panels.length} panels
              </strong>
            </h2>
            <Badge variant="outline" className="h-8 rounded-full px-3">
              <GripVertical className="size-4" />
              720px
            </Badge>
          </header>

          <section
            className={cn(
              'mx-auto flex w-full max-w-[720px] flex-col',
              getStripGapClassName(state.panelGap),
            )}
            aria-label="Panel strip"
          >
            {state.panels.map((panel, index) => (
              <PanelCanvasItem
                key={panel.id}
                panel={panel}
                index={index}
                isSelected={panel.id === selectedPanel?.id}
                selectedBubbleId={state.selectedBubbleId}
                onBubbleDragStart={handleBubbleDragStart}
                onSelect={handlePanelSelect}
              />
            ))}
          </section>
        </section>

        <aside className="border-t bg-card/85 p-4 lg:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l xl:p-[18px]">
          {selectedPanel && (
            <section className="grid gap-1 md:grid-cols-2 md:gap-x-5 xl:block">
              <SectionTitle
                icon={<ChevronLeft className="size-4" />}
                title="Selected Cut"
              />
              <FieldBlock label="패널 이름" compact>
                <Input
                  value={selectedPanel.title}
                  onChange={handleSelectedPanelTitleChange}
                  className="bg-background"
                />
              </FieldBlock>
              <RangeField
                label="패널 높이"
                value={selectedPanel.height}
                suffix="px"
                min={220}
                max={900}
                step={10}
                onValueChange={handleSelectedPanelHeightChange}
              />
              <FieldBlock label="컷별 프롬프트">
                <Textarea
                  value={selectedPanel.prompt}
                  onChange={handleSelectedPanelPromptChange}
                  rows={6}
                  className="resize-y bg-background leading-relaxed"
                />
              </FieldBlock>

              <section className="mb-5 grid gap-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleGenerateSelectedPanel}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <RefreshCcw className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {isGenerating
                    ? 'Generating'
                    : selectedCandidate
                      ? 'Regenerate cut'
                      : 'Generate cut'}
                </Button>
                <details className="overflow-hidden rounded-md border bg-background">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-muted-foreground">
                    최종 생성 조건
                  </summary>
                  <pre className="max-h-[180px] overflow-auto border-t bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                    {finalPrompt}
                  </pre>
                </details>
              </section>

              <section className="mb-5">
                <header className="mb-2 flex items-center justify-between gap-3">
                  <SectionTitle
                    icon={<ImagePlus className="size-4" />}
                    title="Candidates"
                    className="mb-0"
                  />
                  {selectedPanel.deletedCandidates.length > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-7 px-0"
                      onClick={handleRestoreCandidate}
                    >
                      Restore
                    </Button>
                  )}
                </header>
                <section
                  className="grid grid-cols-3 gap-2"
                  aria-label="Image candidates"
                >
                  {selectedPanel.candidates.length === 0 && (
                    <EmptyState>No candidates</EmptyState>
                  )}
                  {selectedPanel.candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      isActive={
                        candidate.id === selectedPanel.selectedCandidateId
                      }
                      onDelete={handleCandidateDelete}
                      onSelect={handleCandidateSelect}
                    />
                  ))}
                </section>
              </section>

              <SectionTitle
                icon={<MessageCircle className="size-4" />}
                title="Layers"
              />
              <nav
                className="mb-4 flex flex-wrap gap-2"
                aria-label="Layer actions"
              >
                {layerActions.map((action) => (
                  <LayerButton
                    key={action.type}
                    action={action}
                    onAdd={handleLayerAdd}
                  />
                ))}
              </nav>

              {selectedBubble ? (
                <section className="grid gap-3">
                  <FieldBlock label="텍스트" compact>
                    <Input
                      value={selectedBubble.text}
                      onChange={handleBubbleTextChange}
                      className="bg-background"
                    />
                  </FieldBlock>
                  <RangeField
                    label="글자 크기"
                    value={selectedBubble.fontSize}
                    suffix="px"
                    min={14}
                    max={72}
                    onValueChange={handleBubbleFontSizeChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-destructive"
                    onClick={handleSelectedBubbleDelete}
                  >
                    <Trash2 className="size-4" />
                    Delete layer
                  </Button>
                </section>
              ) : (
                <EmptyState>No layer selected</EmptyState>
              )}
            </section>
          )}
        </aside>
      </section>
    </main>
  );
};

const SectionTitle = ({
  icon,
  title,
  className,
}: {
  icon: ReactNode;
  title: string;
  className?: string;
}) => (
  <header
    className={cn(
      'mt-1 mb-3 flex items-center gap-2 text-foreground',
      className,
    )}
  >
    {icon}
    <h2 className="m-0 text-xs font-black uppercase">{title}</h2>
  </header>
);

const FieldBlock = ({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
}) => (
  <section className={cn('grid gap-2', compact ? 'mb-3' : 'mb-4')}>
    <Label className="text-xs font-black text-muted-foreground">{label}</Label>
    {children}
  </section>
);

const RangeField = ({
  label,
  value,
  suffix,
  min,
  max,
  step = 1,
  onValueChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number[]) => void;
}) => (
  <section className="mb-4 grid gap-3">
    <header className="flex items-center justify-between gap-3 text-xs font-black text-muted-foreground">
      <span>{label}</span>
      <strong className="text-foreground">
        {value}
        {suffix}
      </strong>
    </header>
    <Slider
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={onValueChange}
    />
  </section>
);

const EmptyState = ({ children }: { children: ReactNode }) => (
  <p className="col-span-full rounded-md border border-dashed bg-background/60 p-3.5 text-center text-sm font-bold text-muted-foreground">
    {children}
  </p>
);

const PanelListItem = ({
  panel,
  index,
  isActive,
  onSelect,
}: {
  panel: Panel;
  index: number;
  isActive: boolean;
  onSelect: (panelId: string) => void;
}) => {
  const handleSelect = (): void => {
    onSelect(panel.id);
  };

  return (
    <li>
      <button
        type="button"
        className={cn(
          'grid w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border bg-background p-2.5 text-left text-sm transition-colors hover:bg-accent',
          isActive && 'border-primary bg-primary/10 hover:bg-primary/10',
        )}
        onClick={handleSelect}
      >
        <span className="font-black text-primary">
          {String(index + 1).padStart(2, '0')}
        </span>
        <strong className="truncate">{panel.title}</strong>
        <small className="font-bold text-muted-foreground">
          {panel.height}px
        </small>
      </button>
    </li>
  );
};

const PanelCanvasItem = ({
  panel,
  index,
  isSelected,
  selectedBubbleId,
  onBubbleDragStart,
  onSelect,
}: {
  panel: Panel;
  index: number;
  isSelected: boolean;
  selectedBubbleId: string | null;
  onBubbleDragStart: (payload: BubbleDragStartPayload) => void;
  onSelect: (panelId: string) => void;
}) => {
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

const BubbleLayer = ({
  bubble,
  panel,
  isSelected,
  onDragStart,
}: {
  bubble: Bubble;
  panel: Panel;
  isSelected: boolean;
  onDragStart: (payload: BubbleDragStartPayload) => void;
}) => {
  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    onDragStart({ event, bubble, panel, mode: 'move' });
  };

  const handleResizePointerDown = (
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    onDragStart({ event, bubble, panel, mode: 'resize' });
  };

  return (
    <section
      className={cn(
        'bubble-layer',
        bubble.type,
        getBubbleClassName(panel, bubble),
        isSelected && 'active',
      )}
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
    >
      <span>{bubble.text}</span>
      {isSelected && (
        <i className="resize-handle" onPointerDown={handleResizePointerDown} />
      )}
    </section>
  );
};

const CandidateCard = ({
  candidate,
  isActive,
  onDelete,
  onSelect,
}: {
  candidate: Candidate;
  isActive: boolean;
  onDelete: (candidateId: string) => void;
  onSelect: (candidateId: string) => void;
}) => {
  const handleSelect = (): void => {
    onSelect(candidate.id);
  };

  const handleDelete = (): void => {
    onDelete(candidate.id);
  };

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-md border-2 border-transparent bg-background',
        isActive && 'border-primary',
      )}
    >
      <button
        type="button"
        className="block aspect-square w-full bg-muted"
        onClick={handleSelect}
      >
        <img
          src={candidate.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 size-6 rounded-full bg-background/90 text-destructive hover:bg-background"
        onClick={handleDelete}
        aria-label="Delete candidate"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </article>
  );
};

const LayerButton = ({
  action,
  onAdd,
}: {
  action: LayerAction;
  onAdd: (type: BubbleType) => void;
}) => {
  const handleAdd = (): void => {
    onAdd(action.type);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
      {action.icon}
      {action.label}
    </Button>
  );
};

export { App };
export type { Bubble, BubbleType, Candidate, Panel, StudioState };
