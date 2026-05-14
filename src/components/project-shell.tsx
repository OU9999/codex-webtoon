import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

import { ApiClientError, loadProjectState } from '@/api/client';
import { Button } from '@/components/ui/button';
import { ProjectPicker } from '@/components/project-picker/project-picker';
import { Studio } from '@/components/studio/studio';
import {
  DEFAULT_CANVAS_TITLE,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_PANEL_GAP_COLOR,
  getNormalizedPanelCanvasId,
  normalizeCanvasHeight,
  normalizePanelGapColor,
  normalizePanelGeometry,
  normalizeProjectCanvases,
  normalizeSelectedCanvasId,
} from '@shared/project-state';
import {
  buildReferenceImageLookup,
  normalizeReferenceImageRefs,
} from '@shared/reference-images';
import type {
  ReferenceImageRef,
  StudioState,
} from '@/components/studio/_lib/types';
import { defaultCommonPrompt } from '@/components/studio/_lib/constants';
import {
  createPanel,
  createWebtoonCanvas,
} from '@/components/studio/_lib/factories';
import { withDefaultBubbleStyle } from '@/components/studio/_lib/bubble-style';

const createDefaultState = (): StudioState => {
  const panelGap = 28;
  const canvas = createWebtoonCanvas({
    title: DEFAULT_CANVAS_TITLE,
    height: DEFAULT_CANVAS_HEIGHT,
  });
  const panels = [
    createPanel({
      canvasId: canvas.id,
      title: 'Opening beat',
      y: 0,
      height: 420,
      prompt:
        '비 오는 저녁, 민지가 버스정류장 아래에서 휴대폰 알림을 확인한다. 미디엄 샷.',
    }),
    createPanel({
      canvasId: canvas.id,
      title: 'Reaction close-up',
      y: 420 + panelGap,
      height: 330,
      prompt:
        '민지의 눈이 흔들리는 클로즈업. 화면에는 텍스트 없이 감정만 드러난다.',
    }),
    createPanel({
      canvasId: canvas.id,
      title: 'Long pause',
      y: 420 + panelGap + 330 + panelGap,
      height: 560,
      prompt: '',
    }),
  ];

  return {
    commonPrompt: defaultCommonPrompt,
    canvases: [canvas],
    selectedCanvasId: canvas.id,
    panels,
    selectedPanelId: panels[0].id,
    selectedBubbleId: null,
    panelGap,
    panelGapColor: DEFAULT_PANEL_GAP_COLOR,
    variantCount: 1,
  };
};

const isReferenceImageRef = (value: unknown): value is ReferenceImageRef => {
  if (!value || typeof value !== 'object') return false;
  const ref = value as Record<string, unknown>;
  return typeof ref.panelId === 'string' && typeof ref.candidateId === 'string';
};

const normalizeLoadedState = (loaded: StudioState): StudioState => {
  const referenceLookup = buildReferenceImageLookup(loaded.panels);
  const canvases = normalizeProjectCanvases(
    (loaded as { canvases?: unknown }).canvases,
    loaded.panels,
    loaded.panelGap,
    (loaded as { canvasHeight?: unknown }).canvasHeight,
    (loaded as { panelGapColor?: unknown }).panelGapColor,
  );
  const validCanvasIds = new Set(canvases.map((canvas) => canvas.id));
  const fallbackCanvasId = canvases[0]?.id ?? '';
  const selectedPanelId = loaded.selectedBubbleId
    ? null
    : loaded.selectedPanelId;
  const selectedCanvasId = normalizeSelectedCanvasId(
    (loaded as { selectedCanvasId?: unknown }).selectedCanvasId,
    canvases,
    loaded.panels,
    selectedPanelId,
  );
  const fallbackYByCanvas = new Map<string, number>(
    canvases.map((canvas) => [canvas.id, 0]),
  );

  return {
    commonPrompt: loaded.commonPrompt,
    canvases,
    selectedCanvasId,
    selectedPanelId,
    panels: loaded.panels.map((panel) => {
      const canvasId = getNormalizedPanelCanvasId(
        panel,
        validCanvasIds,
        fallbackCanvasId,
      );
      const canvasHeight =
        canvases.find((canvas) => canvas.id === canvasId)?.height ??
        normalizeCanvasHeight(
          (loaded as { canvasHeight?: unknown }).canvasHeight,
          loaded.panels,
          loaded.panelGap,
        );
      const fallbackY = fallbackYByCanvas.get(canvasId) ?? 0;
      const rawReferences = (panel as { referenceImages?: unknown })
        .referenceImages;
      const referenceImages = Array.isArray(rawReferences)
        ? normalizeReferenceImageRefs(
            rawReferences.filter(isReferenceImageRef),
            referenceLookup,
          )
        : [];
      const geometry = normalizePanelGeometry(panel, fallbackY, canvasHeight);
      fallbackYByCanvas.set(
        canvasId,
        fallbackY + geometry.height + loaded.panelGap,
      );

      return {
        ...panel,
        canvasId,
        ...geometry,
        referenceImages,
        bubbles: panel.bubbles.map(withDefaultBubbleStyle),
      };
    }),
    selectedBubbleId: loaded.selectedBubbleId,
    panelGap: loaded.panelGap,
    panelGapColor: normalizePanelGapColor(
      (loaded as { panelGapColor?: unknown }).panelGapColor,
    ),
    variantCount:
      typeof loaded.variantCount === 'number' && loaded.variantCount >= 1
        ? Math.min(4, Math.trunc(loaded.variantCount))
        : 1,
  };
};

const ProjectShell = () => {
  const [projectName, setProjectName] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<StudioState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadGenRef = useRef(0);

  const handlePick = (name: string): void => {
    setProjectName(name);
  };

  const handleBack = (): void => {
    setProjectName(null);
    setInitialState(null);
    setError(null);
  };

  const handleRetry = (): void => {
    if (!projectName) return;
    setProjectName(null);
    setError(null);
    setTimeout(() => setProjectName(projectName), 0);
  };

  /**
   * Loads the chosen project's state from the server.
   * Uses a generation counter to ignore responses from stale projects when
   * the user picks another project mid-load.
   */
  useEffect(() => {
    if (!projectName) return;

    const gen = ++loadGenRef.current;
    setLoading(true);
    setError(null);
    setInitialState(null);

    void (async () => {
      try {
        const loaded = await loadProjectState(projectName);
        if (gen !== loadGenRef.current) return;
        setInitialState(
          loaded
            ? normalizeLoadedState(loaded as unknown as StudioState)
            : createDefaultState(),
        );
      } catch (err) {
        if (gen !== loadGenRef.current) return;
        const message =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : '프로젝트를 여는 중 오류가 발생했습니다.';
        setError(message);
      } finally {
        if (gen === loadGenRef.current) setLoading(false);
      }
    })();
  }, [projectName]);

  if (!projectName) return <ProjectPicker onPick={handlePick} />;

  if (loading || !initialState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          프로젝트를 불러오는 중…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
        <p className="text-sm text-red-300">{error}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleBack}>
            프로젝트 목록으로
          </Button>
          <Button type="button" onClick={handleRetry}>
            <RotateCcw className="size-4" />
            다시 시도
          </Button>
        </div>
      </main>
    );
  }

  return (
    <Studio
      projectName={projectName}
      initialState={initialState}
      onBack={handleBack}
    />
  );
};

export { ProjectShell };
