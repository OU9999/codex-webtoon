import type { MouseEvent as ReactMouseEvent } from 'react';
import { ChevronLeft, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { FieldBlock } from '@/components/studio/_components/field-block';
import { RangeField } from '@/components/studio/_components/range-field';
import { SectionTitle } from '@/components/studio/_components/section-title';
import { resolveBubbleStyle } from '@/components/studio/_lib/bubble-style';
import { useStudioContext } from '@/components/studio/studio-context';
import type {
  BubbleBorderStyle,
  BubbleFontFamily,
  BubbleFontWeight,
  BubbleShape,
  BubbleType,
} from '@/components/studio/_lib/types';

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

const BUBBLE_TYPE_OPTIONS: readonly SelectOption<BubbleType>[] = [
  { value: 'speech', label: 'Speech' },
  { value: 'monologue', label: 'Box' },
  { value: 'thought', label: 'Thought' },
  { value: 'sfx', label: 'SFX' },
];

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
  { value: 'black', label: 'Black' },
];

const BORDER_STYLE_OPTIONS: readonly SelectOption<BubbleBorderStyle>[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

const SHAPE_OPTIONS: readonly SelectOption<BubbleShape>[] = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'square', label: 'Box' },
  { value: 'sharp', label: 'Sharp' },
  { value: 'rough', label: 'Rough' },
  { value: 'burst', label: 'Burst' },
  { value: 'custom', label: 'Custom' },
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
    handleBubbleShapeChange,
    handleBubbleStylePatch,
    handleBubbleTextChange,
    handleBubbleTextColorChange,
    handleBubbleTypeChange,
    handlePanelSelect,
    handleSelectedBubbleDelete,
    selectedBubble,
    selectedPanel,
  } = useStudioContext();

  if (!selectedBubble) {
    return <EmptyState>No layer selected</EmptyState>;
  }

  const style = resolveBubbleStyle(selectedBubble);

  const handleFillPresetSelect = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ): void => {
    const fillColor = event.currentTarget.dataset.value;
    if (!fillColor) return;
    handleBubbleStylePatch({ fillColor });
  };

  const handleShowPanelMenu = (): void => {
    if (!selectedPanel) return;
    handlePanelSelect(selectedPanel.id);
  };

  return (
    <section className="grid gap-3">
      <header className="flex items-start justify-between gap-3">
        <SectionTitle
          icon={<MessageCircle className="size-4" />}
          title="Bubble"
          className="mt-0 mb-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShowPanelMenu}
        >
          <ChevronLeft className="size-4" />
          Panel
        </Button>
      </header>

      <FieldBlock label="텍스트" compact>
        <Input
          value={selectedBubble.text}
          onChange={handleBubbleTextChange}
          className="bg-background"
        />
      </FieldBlock>

      <FieldBlock label="종류" compact>
        <select
          value={selectedBubble.type}
          onChange={handleBubbleTypeChange}
          className={SELECT_CLASS_NAME}
        >
          {BUBBLE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
        <FieldBlock label="선 종류" compact>
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
            value={style.shape}
            onChange={handleBubbleShapeChange}
            className={SELECT_CLASS_NAME}
          >
            {SHAPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
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
    </section>
  );
};

export { BubbleForm };
