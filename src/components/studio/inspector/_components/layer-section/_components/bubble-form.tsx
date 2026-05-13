import type { ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
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
  getLayerActionPatch,
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
  label: string;
}

interface BubbleColorPreset {
  label: string;
  value: string;
  className: string;
}

const SELECT_CLASS_NAME =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

const FONT_FAMILY_OPTIONS: readonly SelectOption<BubbleFontFamily>[] = [
  { value: 'inter', label: 'Inter Tight' },
  { value: 'mono', label: 'IBM Plex Mono' },
  { value: 'display', label: 'Bagel Fat One' },
  { value: 'serif', label: 'Serif' },
];

const FONT_WEIGHT_OPTIONS: readonly SelectOption<BubbleFontWeight>[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'bold', label: 'Bold' },
];

const BORDER_STYLE_OPTIONS: readonly SelectOption<BubbleBorderStyle>[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

const FILL_COLOR_PRESETS: readonly BubbleColorPreset[] = [
  { label: 'White', value: '#ffffff', className: 'bg-white' },
  { label: 'Ivory', value: '#fbf9f0', className: 'bg-[#fbf9f0]' },
  { label: 'Blue', value: '#e6eef6', className: 'bg-[#e6eef6]' },
  { label: 'Yellow', value: '#fff4cf', className: 'bg-[#fff4cf]' },
  { label: 'Pink', value: '#ffe8ef', className: 'bg-[#ffe8ef]' },
];

const BubbleForm = () => {
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
    return <EmptyState>No layer selected</EmptyState>;
  }

  const style = resolveBubbleStyle(selectedBubble);
  const meta = selectedBubble.type.toUpperCase();

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
    handleBubbleStylePatch(getLayerActionPatch(action));
  };

  return (
    <InspectorSection
      icon={<MessageCircle className="size-4" />}
      title="Bubble"
      meta={meta}
      contentClassName="grid gap-3"
    >
      <FieldBlock label="텍스트" compact>
        <Textarea
          value={selectedBubble.text}
          onChange={handleBubbleTextChange}
          className="min-h-24 resize-y bg-background"
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

      <section className="grid grid-cols-2 gap-3">
        <FieldBlock label="글씨체" compact>
          <select
            value={style.fontFamily}
            onChange={handleBubbleFontFamilyChange}
            className={SELECT_CLASS_NAME}
          >
            {FONT_FAMILY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldBlock>
        <FieldBlock label="굵기" compact>
          <select
            value={style.fontWeight}
            onChange={handleBubbleFontWeightChange}
            className={SELECT_CLASS_NAME}
          >
            {FONT_WEIGHT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldBlock>
      </section>

      <FieldBlock label="채우기" compact>
        <section className="grid grid-cols-[52px_minmax(0,1fr)] gap-2">
          <Input
            type="color"
            value={style.fillColor}
            onChange={handleBubbleFillColorChange}
            className="h-9 bg-background p-1"
          />
          <nav className="flex items-center gap-1.5" aria-label="Fill colors">
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
                <span className="sr-only">{preset.label}</span>
              </button>
            ))}
          </nav>
        </section>
      </FieldBlock>

      <section className="grid grid-cols-2 gap-3">
        <FieldBlock label="글자색" compact>
          <Input
            type="color"
            value={style.textColor}
            onChange={handleBubbleTextColorChange}
            className="h-9 bg-background p-1"
          />
        </FieldBlock>
        <FieldBlock label="선 색" compact>
          <Input
            type="color"
            value={style.borderColor}
            onChange={handleBubbleBorderColorChange}
            className="h-9 bg-background p-1"
          />
        </FieldBlock>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <FieldBlock label="선 스타일" compact>
          <select
            value={style.borderStyle}
            onChange={handleBubbleBorderStyleChange}
            className={SELECT_CLASS_NAME}
          >
            {BORDER_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldBlock>
        <FieldBlock label="모양" compact>
          <select
            value={getLayerActionIdForBubble(selectedBubble)}
            onChange={handleBubblePresetChange}
            className={SELECT_CLASS_NAME}
          >
            {layerActions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
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
        Delete layer
      </Button>
    </InspectorSection>
  );
};

export { BubbleForm };
