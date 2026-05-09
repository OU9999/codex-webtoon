import { Slider } from '@/components/ui/slider';

interface RangeFieldProps {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number[]) => void;
}

const RangeField = ({
  label,
  value,
  suffix,
  min,
  max,
  step = 1,
  onValueChange,
}: RangeFieldProps) => {
  return (
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
};

export { RangeField };
