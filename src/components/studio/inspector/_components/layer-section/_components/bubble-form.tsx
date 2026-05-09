import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/studio/_components/empty-state';
import { FieldBlock } from '@/components/studio/_components/field-block';
import { RangeField } from '@/components/studio/_components/range-field';
import { useStudioContext } from '@/components/studio/studio-context';

const BubbleForm = () => {
  const {
    handleBubbleFontSizeChange,
    handleBubbleTextChange,
    handleSelectedBubbleDelete,
    selectedBubble,
  } = useStudioContext();

  if (!selectedBubble) {
    return <EmptyState>No layer selected</EmptyState>;
  }

  return (
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
  );
};

export { BubbleForm };
