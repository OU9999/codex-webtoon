import type { ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { FieldBlock } from '@/components/studio/_components/field-block';
import { RangeField } from '@/components/studio/_components/range-field';
import {
  getLayerActionById,
  getLayerActionIdForBubble,
  getLayerActionStylePatch,
  layerActions,
} from '@/components/studio/_lib/layer-actions';
import { resolveBubbleStyle } from '@/components/studio/_lib/bubble-style';
import { useStudioContext } from '@/components/studio/studio-context';
import type {
  BubbleBorderStyle,
  BubbleFontFamily,
  BubbleFontWeight,
} from '@/components/studio/_lib/types';
import { InspectorSection } from '../../inspector-section';

interface SelectOption<Value extends string> {
  value: Value;
  labelKey: string;
}

interface BubbleColorPreset {
  labelKey: string;
  value: string;
  className: string;
}

const SELECT_CLASS_NAME =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

const FONT_FAMILY_OPTIONS: readonly SelectOption<BubbleFontFamily>[] = [
  { value: 'inter', labelKey: 'styles.fontFamily.inter' },
  { value: 'mono', labelKey: 'styles.fontFamily.mono' },
  { value: 'display', labelKey: 'styles.fontFamily.display' },
  { value: 'serif', labelKey: 'styles.fontFamily.serif' },
];

const FONT_WEIGHT_OPTIONS: readonly SelectOption<BubbleFontWeight>[] = [
  { value: 'regular', labelKey: 'styles.fontWeight.regular' },
  { value: 'medium', labelKey: 'styles.fontWeight.medium' },
  { value: 'bold', labelKey: 'styles.fontWeight.bold' },
];

const BORDER_STYLE_OPTIONS: readonly SelectOption<BubbleBorderStyle>[] = [
  { value: 'solid', labelKey: 'styles.border.solid' },
  { value: 'dashed', labelKey: 'styles.border.dashed' },
  { value: 'dotted', labelKey: 'styles.border.dotted' },
];

const FILL_COLOR_PRESETS: readonly BubbleColorPreset[] = [
  { labelKey: 'styles.color.white', value: '#ffffff', className: 'bg-white' },
  {
    labelKey: 'styles.color.ivory',
    value: '#fbf9f0',
    className: 'bg-[#fbf9f0]',
  },
  {
    labelKey: 'styles.color.blue',
    value: '#e6eef6',
    className: 'bg-[#e6eef6]',
  },
  {
    labelKey: 'styles.color.yellow',
    value: '#fff4cf',
    className: 'bg-[#fff4cf]',
  },
  {
    labelKey: 'styles.color.pink',
    value: '#ffe8ef',
    className: 'bg-[#ffe8ef]',
  },
];

const BubbleForm = () => {
  const { t } = useTranslation();
  const {
    handleBubbleBorderColorChange,
    handleBubbleBorderStyleChange,
    handleBubbleFillColorChange,
    handleBubbleFontFamilyChange,
    handleBubbleFontSizeChange,
    handleBubbleFontWeightChange,
    handleBubbleStylePatch,
    handleBubbleTextChange,
    handleBubbleTextColorChange,
    handleSelectedBubbleDelete,
    selectedBubble,
    selectedBubblePanel,
  } = useStudioContext();

  if (!selectedBubble || !selectedBubblePanel) {
    return <EmptyState>{t('inspector.bubble.noLayerSelected')}</EmptyState>;
  }

  const style = resolveBubbleStyle(selectedBubble);
  const meta = t(`bubbles.type.${selectedBubble.type}`);

  const handleFillPresetSelect = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ): void => {
    const fillColor = event.currentTarget.dataset.value;
    if (!fillColor) return;
    handleBubbleStylePatch({ fillColor });
  };

  const handleBubblePresetChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    const action = getLayerActionById(event.target.value);
    if (!action) return;
    handleBubbleStylePatch(getLayerActionStylePatch(action));
  };

  return (
    <InspectorSection
      icon={<MessageCircle className="size-4" />}
      title={t('inspector.bubble.title')}
      meta={meta}
      contentClassName="grid gap-3"
    >
      <FieldBlock label={t('inspector.bubble.text')} compact>
        <Textarea
          value={selectedBubble.text}
          onChange={handleBubbleTextChange}
          className="min-h-24 resize-y bg-background"
        />
      </FieldBlock>

      <RangeField
        label={t('inspector.bubble.fontSize')}
        value={selectedBubble.fontSize}
        suffix="px"
        min={14}
        max={72}
        onValueChange={handleBubbleFontSizeChange}
      />

      <section className="grid grid-cols-2 gap-3">
        <FieldBlock label={t('inspector.bubble.fontFamily')} compact>
          <select
            value={style.fontFamily}
            onChange={handleBubbleFontFamilyChange}
            className={SELECT_CLASS_NAME}
          >
            {FONT_FAMILY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </FieldBlock>
        <FieldBlock label={t('inspector.bubble.fontWeight')} compact>
          <select
            value={style.fontWeight}
            onChange={handleBubbleFontWeightChange}
            className={SELECT_CLASS_NAME}
          >
            {FONT_WEIGHT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </FieldBlock>
      </section>

      <FieldBlock label={t('inspector.bubble.fill')} compact>
        <section className="grid grid-cols-[52px_minmax(0,1fr)] gap-2">
          <Input
            type="color"
            value={style.fillColor}
            onChange={handleBubbleFillColorChange}
            className="h-9 bg-background p-1"
          />
          <nav
            className="flex items-center gap-1.5"
            aria-label={t('inspector.bubble.fill')}
          >
            {FILL_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                data-value={preset.value}
                className={cn(
                  'size-7 rounded-md border border-rim transition-[box-shadow,border-color]',
                  preset.className,
                  style.fillColor === preset.value &&
                    'border-brand ring-2 ring-brand ring-offset-1',
                )}
                onClick={handleFillPresetSelect}
              >
                <span className="sr-only">{t(preset.labelKey)}</span>
              </button>
            ))}
          </nav>
        </section>
      </FieldBlock>

      <section className="grid grid-cols-2 gap-3">
        <FieldBlock label={t('inspector.bubble.textColor')} compact>
          <Input
            type="color"
            value={style.textColor}
            onChange={handleBubbleTextColorChange}
            className="h-9 bg-background p-1"
          />
        </FieldBlock>
        <FieldBlock label={t('inspector.bubble.borderColor')} compact>
          <Input
            type="color"
            value={style.borderColor}
            onChange={handleBubbleBorderColorChange}
            className="h-9 bg-background p-1"
          />
        </FieldBlock>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <FieldBlock label={t('inspector.bubble.borderStyle')} compact>
          <select
            value={style.borderStyle}
            onChange={handleBubbleBorderStyleChange}
            className={SELECT_CLASS_NAME}
          >
            {BORDER_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </FieldBlock>
        <FieldBlock label={t('inspector.bubble.shape')} compact>
          <select
            value={getLayerActionIdForBubble(selectedBubble)}
            onChange={handleBubblePresetChange}
            className={SELECT_CLASS_NAME}
          >
            {layerActions.map((option) => (
              <option key={option.id} value={option.id}>
                {t(`layerActions.${option.id}`)}
              </option>
            ))}
          </select>
        </FieldBlock>
      </section>

      <Button
        type="button"
        variant="outline"
        className="w-full text-destructive"
        onClick={handleSelectedBubbleDelete}
      >
        <Trash2 className="size-4" />
        {t('inspector.bubble.deleteLayer')}
      </Button>
    </InspectorSection>
  );
};

export { BubbleForm };
