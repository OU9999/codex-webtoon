import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  CircleDot,
  MousePointer2,
  PencilLine,
  RefreshCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type PanelGenerationCtaTone =
  | 'generating'
  | 'needs-prompt'
  | 'needs-selection'
  | 'ready'
  | 'selected';

interface PanelGenerationCtaProps {
  candidateCount: number;
  isGenerating: boolean;
  promptInputLength: number;
  selectedCandidateIndex: number;
  variantCount: number;
}

interface PanelGenerationCtaState {
  detail: string;
  icon: LucideIcon;
  iconSpin?: boolean;
  title: string;
  tone: PanelGenerationCtaTone;
}

interface PanelGenerationCtaInput {
  candidateCount: number;
  isGenerating: boolean;
  promptInputLength: number;
  selectedCandidateIndex: number;
  t: ReturnType<typeof useTranslation>['t'];
  variantCount: number;
}

const getPanelGenerationCtaState = ({
  candidateCount,
  isGenerating,
  promptInputLength,
  selectedCandidateIndex,
  t,
  variantCount,
}: PanelGenerationCtaInput): PanelGenerationCtaState => {
  if (isGenerating) {
    return {
      detail: t('inspector.panelForm.ctaGeneratingDetail'),
      icon: RefreshCcw,
      iconSpin: true,
      title: t('inspector.panelForm.ctaGeneratingTitle'),
      tone: 'generating',
    };
  }

  if (candidateCount > 0 && selectedCandidateIndex >= 0) {
    return {
      detail: t('inspector.panelForm.ctaSelectedDetail', {
        count: candidateCount,
        number: String(selectedCandidateIndex + 1).padStart(2, '0'),
      }),
      icon: CheckCircle2,
      title: t('inspector.panelForm.ctaSelectedTitle'),
      tone: 'selected',
    };
  }

  if (candidateCount > 0) {
    return {
      detail: t('inspector.panelForm.ctaNeedsSelectionDetail', {
        count: candidateCount,
      }),
      icon: MousePointer2,
      title: t('inspector.panelForm.ctaNeedsSelectionTitle'),
      tone: 'needs-selection',
    };
  }

  if (promptInputLength === 0) {
    return {
      detail: t('inspector.panelForm.ctaNeedsPromptDetail'),
      icon: PencilLine,
      title: t('inspector.panelForm.ctaNeedsPromptTitle'),
      tone: 'needs-prompt',
    };
  }

  return {
    detail: t('inspector.panelForm.ctaReadyDetail', {
      count: promptInputLength,
      variants: variantCount,
    }),
    icon: CircleDot,
    title: t('inspector.panelForm.ctaReadyTitle'),
    tone: 'ready',
  };
};

const toneClassNames: Record<PanelGenerationCtaTone, string> = {
  generating: 'border-brand/35 bg-brand/10 text-brand',
  'needs-prompt':
    'border-status-yellow/45 bg-status-yellow/10 text-status-yellow',
  'needs-selection': 'border-status-blue/35 bg-status-blue/10 text-status-blue',
  ready: 'border-brand/35 bg-brand/10 text-brand',
  selected: 'border-status-green/40 bg-status-green/10 text-status-green',
};

const PanelGenerationCta = ({
  candidateCount,
  isGenerating,
  promptInputLength,
  selectedCandidateIndex,
  variantCount,
}: PanelGenerationCtaProps) => {
  const { t } = useTranslation();
  const cta = getPanelGenerationCtaState({
    candidateCount,
    isGenerating,
    promptInputLength,
    selectedCandidateIndex,
    t,
    variantCount,
  });
  const Icon = cta.icon;

  return (
    <aside
      aria-live="polite"
      className={cn(
        'grid gap-1 rounded-md border px-3 py-2 text-xs',
        toneClassNames[cta.tone],
      )}
    >
      <header className="flex items-start gap-2">
        <Icon
          className={cn(
            'mt-0.5 size-3.5 shrink-0',
            cta.iconSpin && 'animate-spin',
          )}
        />
        <section className="min-w-0">
          <h3 className="font-mono text-[10px] font-semibold uppercase">
            {cta.title}
          </h3>
          <p className="mt-1 leading-relaxed">{cta.detail}</p>
        </section>
      </header>
    </aside>
  );
};

export { PanelGenerationCta };
