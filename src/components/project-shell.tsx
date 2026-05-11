import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

import { ApiClientError, loadProjectState } from '@/api/client';
import { Button } from '@/components/ui/button';
import { ProjectPicker } from '@/components/project-picker';
import { Studio } from '@/components/studio/studio';
import type {
  ReferenceImageRef,
  StudioState,
} from '@/components/studio/_lib/types';
import { defaultCommonPrompt } from '@/components/studio/_lib/constants';
import { createPanel } from '@/components/studio/_lib/factories';

const createDefaultState = (): StudioState => {
  const panels = [
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

  return {
    commonPrompt: defaultCommonPrompt,
    panels,
    selectedPanelId: panels[0].id,
    selectedBubbleId: null,
    panelGap: 28,
    variantCount: 1,
  };
};

const referenceKey = (reference: ReferenceImageRef): string =>
  `${reference.panelId}:${reference.candidateId}`;

const isReferenceImageRef = (value: unknown): value is ReferenceImageRef => {
  if (!value || typeof value !== 'object') return false;
  const ref = value as Record<string, unknown>;
  return typeof ref.panelId === 'string' && typeof ref.candidateId === 'string';
};

const normalizeLoadedState = (loaded: StudioState): StudioState => {
  const candidateKeys = new Set<string>();
  for (const panel of loaded.panels) {
    for (const candidate of panel.candidates) {
      candidateKeys.add(`${panel.id}:${candidate.id}`);
    }
  }

  return {
    ...loaded,
    panels: loaded.panels.map((panel) => {
      const rawReferences = (panel as { referenceImages?: unknown })
        .referenceImages;
      const referenceImages = Array.isArray(rawReferences)
        ? rawReferences
            .filter(isReferenceImageRef)
            .filter((reference) => candidateKeys.has(referenceKey(reference)))
        : [];

      return { ...panel, referenceImages };
    }),
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
