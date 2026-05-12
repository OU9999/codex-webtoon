import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import {
  getBubbleShapePatch,
  getBubbleTailSidePatch,
  isBubbleBorderStyle,
  isBubbleFontFamily,
  isBubbleFontWeight,
  isBubbleShape,
  isBubbleTailSide,
} from '../_lib/bubble-style';
import { createBubble } from '../_lib/factories';
import type { Bubble, BubbleType, StudioState } from '../_lib/types';

const BUBBLE_TYPE_VALUES: readonly BubbleType[] = [
  'speech',
  'monologue',
  'thought',
  'sfx',
];

const isBubbleType = (value: unknown): value is BubbleType => {
  return (
    typeof value === 'string' &&
    BUBBLE_TYPE_VALUES.includes(value as BubbleType)
  );
};

const useLayerActions = (setState: Dispatch<SetStateAction<StudioState>>) => {
  const patchSelectedBubbleNumber = (
    key: keyof Pick<
      Bubble,
      | 'radiusTopLeft'
      | 'radiusTopRight'
      | 'radiusBottomRight'
      | 'radiusBottomLeft'
      | 'tailPosition'
      | 'tailWidth'
      | 'tailHeight'
      | 'tailSkew'
      | 'tailTipX'
      | 'tailTipY'
    >,
    value: number[],
  ): void => {
    const nextValue = value[0];
    if (typeof nextValue !== 'number') return;
    patchSelectedBubble({ [key]: nextValue });
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

  const handleLayerAdd = (
    type: BubbleType,
    patch: Partial<Bubble> = {},
  ): void => {
    const bubble = { ...createBubble(type), ...patch };
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

  const handleBubbleSelect = (bubbleId: string): void => {
    setState((current) => ({ ...current, selectedBubbleId: bubbleId }));
  };

  const handleBubbleTextChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ text: event.target.value });
  };

  const handleBubbleTypeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleType(event.target.value)) return;
    patchSelectedBubble({ type: event.target.value });
  };

  const handleBubbleFontSizeChange = (value: number[]): void => {
    const fontSize = value[0];
    if (typeof fontSize !== 'number') return;
    patchSelectedBubble({ fontSize });
  };

  const handleBubbleFillColorChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ fillColor: event.target.value });
  };

  const handleBubbleTextColorChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ textColor: event.target.value });
  };

  const handleBubbleBorderColorChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    patchSelectedBubble({ borderColor: event.target.value });
  };

  const handleBubbleBorderWidthChange = (value: number[]): void => {
    const borderWidth = value[0];
    if (typeof borderWidth !== 'number') return;
    patchSelectedBubble({ borderWidth });
  };

  const handleBubbleBorderStyleChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleBorderStyle(event.target.value)) return;
    patchSelectedBubble({ borderStyle: event.target.value });
  };

  const handleBubbleFontFamilyChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleFontFamily(event.target.value)) return;
    patchSelectedBubble({ fontFamily: event.target.value });
  };

  const handleBubbleFontWeightChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleFontWeight(event.target.value)) return;
    patchSelectedBubble({ fontWeight: event.target.value });
  };

  const handleBubbleShapeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleShape(event.target.value)) return;
    patchSelectedBubble(getBubbleShapePatch(event.target.value));
  };

  const handleBubbleRadiusTopLeftChange = (value: number[]): void => {
    patchSelectedBubbleNumber('radiusTopLeft', value);
  };

  const handleBubbleRadiusTopRightChange = (value: number[]): void => {
    patchSelectedBubbleNumber('radiusTopRight', value);
  };

  const handleBubbleRadiusBottomRightChange = (value: number[]): void => {
    patchSelectedBubbleNumber('radiusBottomRight', value);
  };

  const handleBubbleRadiusBottomLeftChange = (value: number[]): void => {
    patchSelectedBubbleNumber('radiusBottomLeft', value);
  };

  const handleBubbleTailPositionChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailPosition', value);
  };

  const handleBubbleTailSideChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    if (!isBubbleTailSide(event.target.value)) return;
    patchSelectedBubble(getBubbleTailSidePatch(event.target.value));
  };

  const handleBubbleTailWidthChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailWidth', value);
  };

  const handleBubbleTailHeightChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailHeight', value);
  };

  const handleBubbleTailSkewChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailSkew', value);
  };

  const handleBubbleTailTipXChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailTipX', value);
  };

  const handleBubbleTailTipYChange = (value: number[]): void => {
    patchSelectedBubbleNumber('tailTipY', value);
  };

  const handleBubbleStylePatch = (patch: Partial<Bubble>): void => {
    patchSelectedBubble(patch);
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

  return {
    handleBubbleBorderColorChange,
    handleBubbleBorderStyleChange,
    handleBubbleBorderWidthChange,
    handleBubbleFillColorChange,
    handleBubbleFontFamilyChange,
    handleBubbleFontSizeChange,
    handleBubbleFontWeightChange,
    handleBubbleRadiusBottomLeftChange,
    handleBubbleRadiusBottomRightChange,
    handleBubbleRadiusTopLeftChange,
    handleBubbleRadiusTopRightChange,
    handleBubbleSelect,
    handleBubbleShapeChange,
    handleBubbleStylePatch,
    handleBubbleTailHeightChange,
    handleBubbleTailPositionChange,
    handleBubbleTailSideChange,
    handleBubbleTailSkewChange,
    handleBubbleTailTipXChange,
    handleBubbleTailTipYChange,
    handleBubbleTailWidthChange,
    handleBubbleTextChange,
    handleBubbleTextColorChange,
    handleBubbleTypeChange,
    handleLayerAdd,
    handleSelectedBubbleDelete,
  };
};

export { useLayerActions };
